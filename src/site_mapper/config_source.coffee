Source = require './source'
config = require '../config'

{each, extend} = require 'underscore'

module.exports = class ConfigSource extends Source
  constructor: (configKey, options = {}) ->
    @configKey = configKey
    @sourceConfig= config[configKey]
    @sitemapOptions = extend {}, @sourceConfig.sitemapOptions || {}, options
    Source.call(this, @sitemapOptions)

  _generateUrls: (cb) ->
    urls = @sourceConfig
    channel = urls.channel
    updatedAt = new Date()
    each urls.urls, (href) =>
      cb {
        url: @urlFormatter(href)
        channel: channel
        updatedAt: updatedAt
        changefreq: @changefreq
        priority: @priority
      }
    @end()
