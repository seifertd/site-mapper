module.exports = config = {}
config.env = process.env.NODE_ENV || 'development'
config.targetDirectory = "./tmp/sitemaps/#{config.env}"
config.sitemapIndex = "sitemap.xml"
config.sitemapRootUrl = "http://www.groupon.com"
config.sitemapFileDirectory = "/sitemaps"
config.maxUrlsPerFile = 50000
