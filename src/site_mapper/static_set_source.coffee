Source = require './source'
config = require '../config'

{each, extend} = require 'underscore'

module.exports = class StaticSetSource extends Source
  constructor: (options) ->
    Source.call(this, options)

  _generateUrls: (cb) ->
    channel = @options.channel
    updatedAt = new Date()
    each @options.urls, (href) =>
      cb {
        url: @urlFormatter(href)
        channel: channel
        updatedAt: updatedAt
        changefreq: @changefreq
        priority: @priority
      }
    @end()
