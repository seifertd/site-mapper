config = require './config'
util = require 'util'
async = require 'async'

SITEMAP_INDEX_HEADER = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

escapeXmlValue = (str) ->
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;')

{each, map} = require 'underscore'
class SitemapGroup
  constructor: (channel) ->
    console.log "Creating SitemapGroup for channel #{channel}"
    @baseUrl = "#{config.sitemapRootUrl}#{config.sitemapFileDirectory}"
    @directory = config.targetDirectory
    @channel = channel
    @urlCount = 0
    @groupCount = 1
    @maxUrlsPerFile = config.maxUrlsPerFile
    @sitemaps = []

  addUrl: (url) ->
    sitemap = @currentSitemap()
    sitemap.addUrl url
    @urlCount += 1

  currentSitemap: ->
    sitemapIndex = Math.floor(@urlCount / @maxUrlsPerFile)
    fileName = "#{@channel}#{sitemapIndex}.xml.gz"
    sitemap = @sitemaps[sitemapIndex]
    if !sitemap?
      sitemap = @sitemaps[sitemapIndex] = new Sitemap("#{@baseUrl}/#{fileName}", "#{@directory}/#{fileName}")

    sitemap

  notifyWhenDone: (allDoneCb) ->
    process.nextTick =>
      seriesTasks = []
      each @sitemaps, (sitemap) ->
        sitemap.close()
        seriesTasks.push (cb) -> sitemap.notifyWhenDone(cb)
      async.series seriesTasks, (err, results) =>
        allDoneCb(err, results)

fs = require 'fs'
Stream = require('stream')

SITEMAP_HEADER = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9/">'

class Sitemap
  constructor: (location, fileName) ->
    @location = location
    @fileName = fileName
    @urlCount = 0
 
  open: ->
    console.log "!! sitemap open #{@fileName}"
    @file = fs.createWriteStream(@fileName)
    @stream = new Stream()
    @flushed = false
    @closed = false
    @gzipper = require('zlib').createGzip()

    sitemapThis = this

    @gzipper.on 'end', =>
      sitemapThis.flushed = true
    @stream.pipe(@gzipper).pipe(@file)
    @stream.emit 'data', SITEMAP_HEADER

  notifyWhenDone: (cb) ->
    sitemapThis = this
    process.nextTick =>
      if sitemapThis.flushed
        console.log "!! sitemap done #{sitemapThis.fileName}, #{sitemapThis.urlCount} urls"
        cb(null, true)
      else
        sitemapThis.gzipper.on 'end', =>
          console.log "!! sitemap done #{sitemapThis.fileName}, #{sitemapThis.urlCount} urls"
          cb(null, true)

  close: ->
    return if @closed
    @closed = true
    @stream.emit 'data', "</urlset>"
    @stream.emit 'end' 

  addUrl: (url) ->
    @open() if @urlCount == 0
    @urlCount += 1
    @stream.emit 'data', @urlXml(url)

  asIndexXml: ->
    "<sitemap><loc>#{escapeXmlValue(@location)}</loc><lastmod>#{new Date().toISOString()}</lastmod></sitemap>"

  urlXml: (url) ->
    "<url><loc>#{url.url}</loc><lastmod>#{url.updatedAt.toISOString()}</lastmod><changefreq>#{url.changefreq}</changefreq><priority>#{url.priority}</priority></url>"

{each, reduce} = require 'underscore'
module.exports = class SiteMapper
  constructor: ->
    @targetDirectory = config.targetDirectory
    buildDir = (parentPath, nextPath) ->
      fullPath = if parentPath.length > 0 then "#{parentPath}/#{nextPath}" else nextPath
      if fullPath != "."
        fs.mkdirSync(fullPath) unless fs.existsSync(fullPath)
      fullPath
    reduce @targetDirectory.split('/'), buildDir, ''
    @sitemapIndex = config.sitemapIndex
    @sources = []
    @sitemapGroups = {}

  addSource: (source) ->
    @sources.push source

  generateSitemap: ->
    console.log "Generating sitemaps for #{@sources.length} sources ..."
    addUrlCb = (url) =>
      @addUrl(url)
    seriesTasks = []
    seriesTasks.push (stCb) =>
      parallelTasks = map @sources, (source) ->
        (cb) ->
          source.on 'done', (result) ->
            cb(null, result)
          source.on 'error', (error) ->
            cb(error, null)
          source.generateUrls addUrlCb
      async.parallel parallelTasks, (err, results) ->
        stCb(err, results)
    seriesTasks.push (stCb) =>
      console.log "Waiting for sitemap groups ..."
      parallelTasks = map @sitemapGroups, (group, channel) =>
        (cb) ->
          group.notifyWhenDone cb
      async.parallel parallelTasks, (err, results) ->
        stCb(err, results)
    async.series seriesTasks, (err, results) =>
      if err?
        console.log "ERROR! generating sitemaps: #{err}"
      else
        @createIndex()

  createIndex: ->
    console.log "Creating sitemap index..."
    index = fs.createWriteStream("#{config.targetDirectory}/#{config.sitemapIndex}")
    index.write(SITEMAP_INDEX_HEADER)
    each @sitemapGroups, (group, channel) ->
      each group.sitemaps, (sitemap) ->
        index.write sitemap.asIndexXml()
    index.write "</sitemapindex>"
    index.end()

  addUrl: (url) ->
    sitemapGroup = @sitemapGroupForChannel(url.channel || 'home')
    sitemapGroup.addUrl url

  sitemapGroupForChannel: (channel) ->
    group = @sitemapGroups[channel]
    unless group?
      group = @sitemapGroups[channel] = new SitemapGroup(channel)
    group
