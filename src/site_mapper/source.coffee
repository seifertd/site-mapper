EventEmitter = require('events').EventEmitter
config = require '../config'

module.exports = class Source extends EventEmitter
  constructor: (options) ->
    @options = options
    @changefreq = options.changefreq
    @priority = options.priority
    @urlFormatter = options.urlFormatter

  generateUrls: (cb) ->
    @_generateUrls cb 

  end: ->
    process.nextTick =>
      @emit('done')

  error: (err) ->
    process.nextTick =>
      @emit('error', err)

  _generateUrls: (cb) ->
    throw "Not Implemented Yet!"
