Source = require('./source')
request = require('request')
{extend, each} = require 'underscore'
util = require 'util'

defaultChannelForUrl = (url) ->
  url.split('/')[0]

defaultBodyProcessor = (body) ->
  if body? then body.split("\n") else []

module.exports = class HttpSource extends Source
  constructor: (options) ->
    Source.call(this, options)
    @url = @options.serviceUrl
    @defaultChannel = @options.channel
    @channelForUrl = @options.channelForUrl || defaultChannelForUrl
    @bodyProcessor = @options.bodyProcessor || defaultBodyProcessor
    @allowNoUrls = @options.allowNoUrls

  _generateUrls: (cb) ->
    @out.write "Generating sitemap urls from service url #{@url}\n"
    updatedAt = new Date()
    request @url, (error, response, body) =>
      if error
        @error(error)
      else if response.statusCode != 200
        @error
          message: "HTTP request got non-200 response"
          statusCode: response.statusCode
          url: @url
      else
        urls = @bodyProcessor(body)
        @out.write "Read #{body?.length || 0} bytes from #{@url}, #{urls.length} urls, first: #{util.inspect urls[0]}, status: #{response.statusCode}\n"
        if urls.length <= 0 && !@allowNoUrls
          @error
            message: "Despite 200 response, no valid urls were returned"
            statusCode: 204
            url: @url
        else
          each urls, (url) =>
            if typeof(url) is 'string'
              urlObj = { url: url }
            else
              urlObj = url
            myProps =
              url: @urlFormatter(url)
              updatedAt: urlObj.updatedAt || updatedAt
              channel: @defaultChannel || @channelForUrl(url)
              changefreq: @changefreq
              priority: @priority
            cb extend {}, urlObj, myProps
          @end()
