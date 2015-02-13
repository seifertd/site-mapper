config = require './config'
async = require 'async'
{each} = require 'underscore'
Sitemap = require './sitemap'

module.exports = class SitemapGroup
  constructor: (sitemapConfig, channel) ->
    sitemapConfig.generateOptions.out.write "Creating SitemapGroup for channel #{channel}\n"
    @sitemapConfig = sitemapConfig
    @baseUrl = "#{@sitemapConfig.sitemapRootUrl}#{@sitemapConfig.sitemapFileDirectory}"
    @directory = @sitemapConfig.targetDirectory
    @channel = channel
    @urlCount = 0
    @groupCount = 1
    @maxUrlsPerFile = @sitemapConfig.maxUrlsPerFile
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
      sitemap = @sitemaps[sitemapIndex] = new Sitemap(@sitemapConfig, "#{@baseUrl}/#{fileName}", "#{@directory}/#{fileName}")

    sitemap

  notifyWhenDone: (allDoneCb) ->
    process.nextTick =>
      seriesTasks = []
      each @sitemaps, (sitemap) ->
        sitemap.close()
        seriesTasks.push (cb) -> sitemap.notifyWhenDone(cb)
      async.series seriesTasks, (err, results) =>
        allDoneCb(err, results)

