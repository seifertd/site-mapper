config = require './config'
util = require 'util'

SITEMAP_INDEX_HEADER = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

escapeXmlValue = (str) ->
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;')

{each} = require 'underscore'
class SitemapGroup
  constructor: (channel) ->
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
    sitemapIndex = @urlCount / @maxUrlsPerFile
    fileName = "#{@channel}#{sitemapIndex}.xml.gz"
    sitemap = @sitemaps[sitemapIndex]
    if !sitemap?
      # Close previous one ...
      if sitemapIndex > 0
        previousSitemap = @sitemaps[sitemapIndex-1]
        previousSitemap.close()

      sitemap = @sitemaps[sitemapIndex] = new Sitemap("#{@baseUrl}/#{fileName}", "#{@directory}/#{fileName}")
      sitemap.open()

    sitemap


  flush: (cb) ->
    each @sitemaps, (sitemap) ->
      

fs = require 'fs'
gzipper = require('zlib').createGzip();
Stream = require('stream')

SITEMAP_HEADER = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9/">'

class Sitemap
  constructor: (location, fileName) ->
    @location = location
    @fileName = fileName
 
  open: ->
    @file = fs.createWriteStream(@fileName)
    @stream = new Stream()
    @flushed = false
    @closed = false

    gzipper.on 'end', ->
      @flushed = true
    @stream.pipe(gzipper).pipe(@file)
    @stream.emit 'data', SITEMAP_HEADER

  close: ->
    return if @closed
    @closed = true
    @stream.emit 'data', "</urlset>"
    @stream.emit 'end' 

  addUrl: (url) ->
    @stream.emit 'data', urlXml(url)

  asIndexXml: ->
    "<sitemap><loc>#{escapeXmlValue(@location)}</loc><lastmod>#{new Date().toIsoString()}</lastmod></sitemap>"

  urlXml: (url) ->
    "<url><loc>#{url.url}</loc><lastmod>#{url.updatedAt.toIsoString()}</lastmod><changefreq>#{url.changefreq}</changefreq><priority>#{url.priority}</priority></url>"

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
    each @sources, (source) =>
      source.generateUrls @addUrl
    @createIndex()

  createIndex: ->
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
    @sitemapGroups[channel] ||= new SitemapGroup(channel)

