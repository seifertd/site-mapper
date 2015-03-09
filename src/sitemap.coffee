config = require './config'
fs = require 'fs'
Stream = require 'stream'
async = require 'async'

escapeXmlValue = (str) ->
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;')

urlXml = (url) ->
  xml = "<url><loc>#{url.url}</loc><lastmod>#{url.updatedAt.toISOString()}</lastmod><changefreq>#{url.changefreq}</changefreq><priority>#{url.priority}</priority>"
  if url.image?
    xml = xml + "<image:image><image:loc>#{url.image}</image:loc></image:image>"
  if url.links?
    for link in url.links
      xml = xml + "<xhtml:link rel=\"#{link.rel}\" href=\"#{link.href}\"/>"
  xml + "</url>"

module.exports = class Sitemap
  constructor: (sitemapConfig, location, fileName) ->
    @location = location
    @fileName = fileName
    @sitemapConfig = sitemapConfig
    @urlCount = 0
 
  open: ->
    @sitemapConfig.generateOptions.out.write "!! sitemap open #{@fileName}\n"
    @file = fs.createWriteStream(@fileName)
    @stream = new Stream()
    @flushed = false
    @fileFlushed = false
    @closed = false
    @gzipper = require('zlib').createGzip()

    sitemapThis = this

    @gzipper.on 'end', =>
      sitemapThis.flushed = true
    @file.on 'close', =>
      sitemapThis.fileFlushed = true
    @stream.pipe(@gzipper).pipe(@file)
    @stream.emit 'data', config.sitemapHeader

  notifyWhenDone: (cb) ->
    sitemapThis = this
    process.nextTick =>
      async.until(
        -> sitemapThis.flushed && sitemapThis.fileFlushed
        (untilCb) ->
          setTimeout(untilCb, 1000)
        (err) ->
          sitemapThis.sitemapConfig.generateOptions.out.write "!! sitemap done #{sitemapThis.fileName}, #{sitemapThis.urlCount} urls, err: #{err}\n"
          cb(err, true)
      )

  close: ->
    return if @closed
    @closed = true
    @stream.emit 'data', "</urlset>"
    @stream.emit 'end'

  addUrl: (url) ->
    @open() if @urlCount == 0
    @urlCount += 1
    try
      @stream.emit 'data', urlXml(url)
    catch ex
      util = require 'util'
      @sitemapConfig.generateOptions.out.write "!!ERROR: Could not convert url: #{util.inspect url} to xml: #{util.inspect ex}\n"

  asIndexXml: ->
    "<sitemap><loc>#{escapeXmlValue(@location)}</loc><lastmod>#{new Date().toISOString()}</lastmod></sitemap>"
