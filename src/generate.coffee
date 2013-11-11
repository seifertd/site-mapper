config = require 'config'
{each} = require 'underscore'
SiteMapper = require 'site_mapper'

sitemapper = new SiteMapper
sourceDefinitions = config.sources
each sourceDefinitions, (sourceDefinition) ->
  clazz = sourceDefinition.type
  source = new clazz(sourceDefinition.options)
  sitemapper.addSource source

sitemapper.generateSitemap()
