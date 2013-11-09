ConfigSource = require('./config_source')
request = require('request')
{each} = require 'underscore'
util = require 'util'

defaultChannelForUrl = (url) ->
  url.split('/')[0]

defaultBodyProcessor = (body) ->
  body.split("\n")

module.exports = class HttpSource extends ConfigSource
  constructor: (configKey, options = {}) ->
    ConfigSource.call(this, configKey, options)
    @url = @sourceConfig.serviceUrl
    @channelForUrl = @sourceConfig.channelForUrl || defaultChannelForUrl
    @bodyProcessor = @sourceConfig.bodyProcessor || defaultBodyProcessor

  _generateUrls: (cb) ->
    console.log "Generating sitemap urls from service url #{@url}"
    updatedAt = new Date()
    request @url, (error, response, body) =>
      if error
        @error(error)
      else
        urls = @bodyProcessor(body)
        console.log "Read #{body.length} bytes from #{@url}, #{urls.length} urls, first: #{util.inspect urls[0]}"
        each urls, (url) =>
          cb {
            url: @urlFormatter(url)
            channel: @channelForUrl(url)
            updatedAt: updatedAt
            changefreq: @changefreq
            priority: @priority
          }
        @end()
