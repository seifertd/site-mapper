import {config} from './config';
import {CsvSource} from './sources/csv_source';
import {Sitemap} from './sitemap';
import {SiteMapper} from './site_mapper';
import {extend} from 'lodash';

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
var sitemapper = new SiteMapper(sitemapConfig);
sitemapper.generateSitemap( (err) => {
  if (err) {
    config.log.error(err, "Error generating sitemaps");
  } else {
    config.log.info("Done generating sitemaps");
  }
});
