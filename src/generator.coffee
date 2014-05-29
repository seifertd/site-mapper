config = require './config'
SiteMapper = require './site_mapper'
Source = require './site_mapper/source'
HttpSource = require './site_mapper/http_source'
StaticSetSource = require './site_mapper/static_set_source'
CsvFileSource = require './site_mapper/csv_file_source'
{each,isEmpty} = require 'underscore'

generateSitemaps = ->
  # Extend the config with app specific config
  config.addAppSpecific()

  each config.sitemaps, (sitemapConfig, sitemapName) ->
    console.log "Generating sitemaps for configuration #{sitemapName}"
    sitemapper = new SiteMapper(sitemapConfig)
    sitemapper.generateSitemap()

module.exports = {generateSitemaps, Source, HttpSource, StaticSetSource, SiteMapper, CsvFileSource, config}
