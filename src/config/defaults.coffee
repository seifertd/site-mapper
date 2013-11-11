module.exports = config = {}
config.env = process.env.NODE_ENV || 'development'
config.targetDirectory = "#{process.cwd()}/tmp/sitemaps/#{config.env}"
config.sitemapIndex = "sitemap.xml"
config.sitemapRootUrl = "http://www.groupon.com"
config.sitemapFileDirectory = "/sitemaps"
config.maxUrlsPerFile = 50000
config.urlBase = "http://www.groupon.com"
config.defaultUrlFormatter = (href) ->
  if href && href.length && href[0] == '/'
    "#{config.urlBase}#{href}"
  else
    if href.length
      "#{config.urlBase}/#{href}"
    else
      config.urlBase
