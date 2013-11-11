config = require './config'
SiteMapper = require './site_mapper'
HttpSource = require './site_mapper/http_source'
StaticSetSource = require './site_mapper/static_set_source'
{each,isEmpty} = require 'underscore'

generateSitemaps = ->
  # Extend the config with app specific config
  config.addAppSpecific()


  sitemapper = new SiteMapper
  sourceDefinitions = config.sources
  throw "No sitemap Source definitions" if isEmpty sourceDefinitions

  each sourceDefinitions, (sourceDefinition) ->
    clazz = sourceDefinition.type
    source = new clazz(sourceDefinition.options)
    sitemapper.addSource source

  sitemapper.generateSitemap()

module.exports = {generateSitemaps, HttpSource, StaticSetSource, SiteMapper}
