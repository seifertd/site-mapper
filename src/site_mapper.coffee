config = require './config'
util = require 'util'
async = require 'async'
fs = require 'fs'
SitemapGroup = require './sitemap_group'

{each, map, reduce} = require 'underscore'

module.exports = class SiteMapper
  constructor: ->
    @targetDirectory = config.targetDirectory
    buildDir = (parentPath, nextPath) ->
      fullPath = if parentPath.length > 0 && parentPath != "/" then "#{parentPath}/#{nextPath}" else "#{parentPath}#{nextPath}"
      if fullPath != "." && fullPath != ""
        fs.mkdirSync(fullPath) unless fs.existsSync(fullPath)
      else if fullPath == ""
        fullPath = "/"
      fullPath

    reduce @targetDirectory.split('/'), buildDir, ''
    @sitemapIndex = config.sitemapIndex
    @sources = []
    @sitemapGroups = {}

  addSource: (source) ->
    @sources.push source

  generateSitemap: ->
    console.log "Generating sitemaps for #{@sources.length} sources, environment = #{config.env} ..."
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
    index.write(config.sitemapIndexHeader)
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
