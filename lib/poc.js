const {config} = require('./config');
const CsvSource = require('./sources/csv_source');
const Sitemap = require('./sitemap');
const SiteMapper = require('./site_mapper');
const {extend} = require('lodash');

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
var sitemapConfig = extend({}, config.defaultSitemapConfig);
config.sources = {
  test: (sitemapConfig) =>  {
    return {
      type: CsvSource,
      options: sourceOptions
    };
  }
};

config.log.info({config: sitemapConfig}, "Sitemap config");
config.log.info({sources: config.source}, "Sources");
const sitemapper = new SiteMapper(sitemapConfig);
sitemapper.generateSitemap( (err) => {
  if (err) {
    config.log.error(err, "Error generating sitemaps");
  } else {
    config.log.info("Done generating sitemaps");
  }
});
