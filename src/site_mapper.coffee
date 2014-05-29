config = require './config'
util = require 'util'
async = require 'async'
fs = require 'fs'
SitemapGroup = require './sitemap_group'
{each, map, reduce, extend} = require 'underscore'

module.exports = class SiteMapper
  constructor: (sitemapConfig) ->
    @sitemapConfig = extend {}, config.defaultSitemapConfig, sitemapConfig
    @targetDirectory = @sitemapConfig.targetDirectory
    buildDir = (parentPath, nextPath) ->
      fullPath = if parentPath.length > 0 && parentPath != "/" then "#{parentPath}/#{nextPath}" else "#{parentPath}#{nextPath}"
      if fullPath != "." && fullPath != ""
        fs.mkdirSync(fullPath) unless fs.existsSync(fullPath)
      else if fullPath == ""
        fullPath = "/"
      fullPath

    reduce @targetDirectory.split('/'), buildDir, ''
    @sitemapIndex = @sitemapConfig.sitemapIndex
    @sources = @initializeSources()
    @sitemapGroups = {}

  initializeSources: ->
    console.log "Initializing sources, config = #{util.inspect @sitemapConfig.sources}"
    @sources = []
    buildSource = (sourceDefinition) =>
      sourceConfig = sourceDefinition(@sitemapConfig)
      sourceClass = sourceConfig.type
      new sourceClass(extend {}, {urlFormatter: config.defaultUrlFormatter(@sitemapConfig)}, sourceConfig.options)
    each config.sources, (sourceDefinition, sourceName) =>
      if @sitemapConfig.sources?.includes?.length > 0
        # If there is an explicit includes list, only include sources in this list
        if @sitemapConfig.sources.includes.indexOf(sourceName) >= 0
          console.log " -> Including source #{sourceName} because it is in includes: #{@sitemapConfig.sources.includes.indexOf(sourceName)}"
          @sources.push buildSource(sourceDefinition)
      else
        if @sitemapConfig.sources?.excludes?.length > 0
          # Skip this if it is in the excludes
          if @sitemapConfig.sources.excludes.indexOf(sourceName) >= 0
            console.log " -> Skipping source #{sourceName} because it is in excludes"
            return
        console.log " -> Including source #{sourceName} because it is in not in excludes #{@sitemapConfig.sources.excludes.indexOf(sourceName)}"
        @sources.push buildSource(sourceDefinition)

    # Error if we defined no sources
    throw "No sitemap Source definitions" if @sources.length <= 0

    @sources


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
        console.log "\n\nERROR! generating sitemaps: #{util.inspect err}\n\n"
        process.exit(2)
      else
        @createIndex()

  createIndex: ->
    console.log "Creating sitemap index..."
    index = fs.createWriteStream("#{@sitemapConfig.targetDirectory}/#{@sitemapConfig.sitemapIndex}")
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
      group = @sitemapGroups[channel] = new SitemapGroup(@sitemapConfig, channel)
    group
