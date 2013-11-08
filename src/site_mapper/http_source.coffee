Source = require('./source')
request = require('request')
{each} = require 'underscore'

channelForHref = (href) ->
  href.split('/')[0]

module.exports = class HttpSource extends Source
  constructor: (url, options) ->
    Source.call(this, options)
    @url = url
    @channelForHref = options.channelForHref || channelForHref
    @urlFormatter = options.urlFormatter || ( (href) -> href )

  _generateUrls: (cb) ->
    console.log "Generating sitemap urls from service url #{@url}"
    updatedAt = new Date()
    request @url, (error, response, body) =>
      urls = body.split("\n")
      console.log "Read #{body.length} bytes from #{@url}, #{urls.length} urls, first: #{urls[0]}"
      each urls, (href) =>
        cb {
          url: @urlFormatter(href)
          channel: @channelForHref(href)
          updatedAt: updatedAt
          changefreq: @changefreq
          priority: @priority
        }
      @end()
