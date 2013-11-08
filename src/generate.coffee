SiteMapper = require 'site_mapper'
HttpSource = require 'site_mapper/http_source'

sitemapper = new SiteMapper
sitemapper.addSource new HttpSource("http://seo-services-vip.snc1/seodeals/pages.txt", {changefreq: 'daily', priority: 1})
sitemapper.generateSitemap()
