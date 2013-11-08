SiteMapper = require 'site_mapper'
HttpSource = require 'site_mapper/http_source'
ConfigSource = require 'site_mapper/config_source'

sitemapper = new SiteMapper
sitemapper.addSource new ConfigSource("homeUrls", {changefreq: 'weekly', priority: 0.1})

# sitemap.txt
options =
  changefreq: 'daily'
  priority: 1
  urlFormatter: (href) ->
    "http://www.groupon.com/#{href}"
#sitemapper.addSource new HttpSource("http://seo-services-vip.snc1/seodeals/pages.txt", options)
sitemapper.addSource new HttpSource("http://localhost:8080/seodeals/pages.txt", options)


sitemapper.generateSitemap()
