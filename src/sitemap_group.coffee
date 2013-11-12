config = require './config'
async = require 'async'
{each} = require 'underscore'
Sitemap = require './sitemap'

module.exports = class SitemapGroup
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

