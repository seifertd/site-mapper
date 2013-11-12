module.exports = config = {}
config.env = process.env.NODE_ENV || 'development'
config.targetDirectory = "#{process.cwd()}/tmp/sitemaps/#{config.env}"
config.sitemapIndex = "sitemap.xml"
config.sitemapRootUrl = "http://www.groupon.com"
config.sitemapFileDirectory = "/sitemaps"
config.sitemapIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
config.sitemapHeader = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9/">'
config.maxUrlsPerFile = 50000
config.urlBase = "http://www.groupon.com"
config.defaultUrlFormatter = (href) ->
  if '/' == href
    config.urlBase
  else if href && href.length && href[0] == '/'
    "#{config.urlBase}#{href}"
  else if href && href.length && href.match(/^https?:\/\//)
    href
  else
    if href.length
      "#{config.urlBase}/#{href}"
    else
      config.urlBase
