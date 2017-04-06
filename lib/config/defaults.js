"use strict";

var config = {};
config.env = process.env.NODE_ENV || 'development';
config.defaultSitemapConfig = {
  targetDirectory: process.cwd() + "/tmp/sitemaps/" + config.env,
  sitemapIndex: "sitemap.xml",
  sitemapRootUrl: "http://www.mysite.com",
  sitemapFileDirectory: "/sitemaps",
  maxUrlsPerFile: 50000,
  urlBase: "http://www.mysite.com"
};
config.logConfig = {
  name: "sitemapper",
  level: "debug"
};
config.sitemapIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 https://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
config.sitemapHeader = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 https://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd http://www.google.com/schemas/sitemap-video/1.1 https://www.google.com/schemas/sitemap-video/1.1/sitemap-video.xsd http://www.google.com/schemas/sitemap-news/0.9 https://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd http://www.w3.org/1999/xhtml https://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd">';
config.defaultUrlFormatter = function (options) {
  return function (href) {
    if ('/' == href) {
      return options.urlBase;
    } else if (href && href.length && href[0] == '/') {
      return "" + options.urlBase + href;
    } else if (href && href.length && href.match(/^https?:\/\//)) {
      return href;
    } else {
      if (href.length) {
        return options.urlBase + "/" + href;
      } else {
        return options.urlBase;
      }
    }
  };
};

module.exports = config;