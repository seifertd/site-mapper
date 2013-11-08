Source = require './source'
config = require '../config'

{each} = require 'underscore'

module.exports = class ConfigSource extends Source
  constructor: (configKey, options) ->
    Source.call(this, options)
    @configKey = configKey

  _generateUrls: (cb) ->
    util = require 'util'
    console.log "Generating sitemap urls from config key #{@configKey}, this = #{util.inspect this}"
    urls = config[@configKey]
    channel = urls.channel
    updatedAt = new Date()
    each urls.urls, (href) =>
      cb {
        url: href
        channel: channel
        updatedAt: updatedAt
        changefreq: @changefreq
        priority: @priority
      }
    @end()
