'use strict';

var _config = require('./config');

var _csv_source = require('./sources/csv_source');

var _sitemap = require('./sitemap');

var _site_mapper = require('./site_mapper');

var _lodash = require('lodash');

var sourceOptions = {
  options: {
    delimiter: ',',
    columns: ['url', 'imageUrl', 'lastModified', 'comments'],
    escapeChar: '"',
    enclosedChar: '"'
  },
  name: 'goofy',
  siteMap: {
    changefreq: 'weekly',
    priority: 1,
    channel: "boogy"
  },
  input: {
    fileName: process.argv[2] || "/Users/dseifert/Downloads/foo.csv"
  }
};
var sitemapConfig = (0, _lodash.extend)({}, _config.config.defaultSitemapConfig);
_config.config.sources = {
  test: function test(sitemapConfig) {
    return {
      type: _csv_source.CsvSource,
      options: sourceOptions
    };
  }
};

_config.config.log.info({ config: sitemapConfig }, "Sitemap config");
_config.config.log.info({ sources: _config.config.source }, "Sources");
var sitemapper = new _site_mapper.SiteMapper(sitemapConfig);
sitemapper.generateSitemap(function (err) {
  if (err) {
    _config.config.log.error(err, "Error generating sitemaps");
  } else {
    _config.config.log.info("Done generating sitemaps");
  }
});