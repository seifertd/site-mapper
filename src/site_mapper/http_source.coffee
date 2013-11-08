Source = require('./source')
request = require('request')
{each} = require 'underscore'

channelForHref = (href) ->
  href.split('/')[0]

module.exports = class HttpSource extends Source
  constructor: (url, options) ->
    Source.call(this, options)
    @url = url

  _generateUrls: (cb) ->
    updatedAt = new Date()
    request @url, (error, response, body) ->
      each body.split("/n"), (href) ->
        cb {
          url: href
          channel: channelForHref(href)
          updatedAt: updatedAt
          changefreq: @changefreq
          priority: @priority
        }

    @emit('done')
