EventEmitter = require('events').EventEmitter

module.exports = class Source extends EventEmitter
  constructor: (options) ->
    @changefreq = options.changefreq
    @priority = options.priority

  generateUrls: (cb) ->
    @_generateUrls cb 

  _generateUrls: (cb) ->
    throw "Not Implemented Yet!"
