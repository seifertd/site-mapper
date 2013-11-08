EventEmitter = require('events').EventEmitter

module.exports = class Source extends EventEmitter
  constructor: (options) ->
    util = require 'util'
    console.log "!! new Source, options: #{util.inspect options}"
    @changefreq = options.changefreq
    @priority = options.priority

  generateUrls: (cb) ->
    @_generateUrls cb 

  end: ->
    process.nextTick =>
      @emit('done')

  _generateUrls: (cb) ->
    throw "Not Implemented Yet!"
