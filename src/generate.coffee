SiteMapper = require 'site_mapper'
HttpSource = require 'site_mapper/http_source'
ConfigSource = require 'site_mapper/config_source'

sitemapper = new SiteMapper
sitemapper.addSource new ConfigSource("homeUrls")
sitemapper.addSource new HttpSource("localPages")
sitemapper.addSource new HttpSource("deals")
sitemapper.generateSitemap()
