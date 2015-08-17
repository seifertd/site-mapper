config = require './config'
SiteMapper = require './site_mapper'
Source = require './site_mapper/source'
HttpSource = require './site_mapper/http_source'
StaticSetSource = require './site_mapper/static_set_source'
CsvFileSource = require './site_mapper/csv_file_source'
{each,extend,isEmpty,isFunction} = require 'underscore'
async = require 'async'
util = require 'util'

generateSitemaps = (options, cb) ->

  if !cb && isFunction(options)
    cb = options
    options = null

  options = extend {}, {out: process.stdout}, options

  # Extend the config with app specific config
  config.addAppSpecific()
  config.generateOptions = options

  tasks = []
  each config.sitemaps, (sitemapConfig, sitemapName) ->
    tasks.push (taskCb) ->
      config.generateOptions.out.write "Generating sitemaps for configuration #{sitemapName}\n"
      sitemapConfig.generateOptions = config.generateOptions
      sitemapper = new SiteMapper(sitemapConfig)
      sitemapper.generateSitemap(taskCb)

  async.waterfall tasks, (err, results) ->
    if err
      config.generateOptions.out.write "ERR: #{util.inspect err}\n"

    config.generateOptions.out.write "All sitemaps done\n"
    if options?.out != process.stdout
      config.generateOptions.out.end()

    cb && cb(err, results)

module.exports = {generateSitemaps, Source, HttpSource, StaticSetSource, SiteMapper, CsvFileSource, config}
