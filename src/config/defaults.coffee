module.exports = config = {}
config.env = process.env.NODE_ENV || 'development'
config.targetDirectory = "./tmp/sitemaps/#{config.env}"
config.sitemapIndex = "sitemap.xml"
config.sitemapRootUrl = "http://www.groupon.com"
config.sitemapFileDirectory = "/sitemaps"
config.maxUrlsPerFile = 50000
config.urlBase = "http://www.groupon.com"
config.defaultUrlFormatter = (href) ->
  if href && href.length && href[0] == '/'
    "#{config.urlBase}#{href}"
  else
    "#{config.urlBase}/#{href}"

config.deals =
  sitemapOptions:
    changefreq: 'daily'
    priority: 1
  serviceUrl: "http://seo-api2-staging.snc1/seoapi/v1/deals/sitemap.txt"
  channelForUrl: (url) ->
    switch url.channel
      when 'goods', 'getaways'
        "#{url.channel}-deals"
      else
        'local-deals'
  bodyProcessor: (body) ->
    JSON.parse(body).deals

config.localPages =
  sitemapOptions:
    changefreq: 'daily'
    priority: 1
  serviceUrl: "http://seo-services-vip.snc1/seodeals/pages.txt?indexed=true"

config.homeUrls =
  channel: 'home'
  sitemapOptions:
    changefreq: 'weekly'
    priority: 0.1
  urls: [
   '/',
   '/about',
   '/affiliate_widget',
   '/chamber-of-commerce-terms',
   '/cities',
   '/clicky',
   '/college-ambassador',
   '/contact-us',
   '/ellen',
   '/epic-deal-coming-soon',
   '/faq',
   '/giftcards',
   '/groupon-promise',
   '/jobs',
   '/joinrewards',
   '/learn',
   '/link_builder',
   '/live',
   '/login',
   '/merchant_qr',
   '/merchants/rewards',
   '/mobile',
   '/mothers-day',
   '/mothers-day/los-angeles',
   '/mothers-day/new-york-city',
   '/mothers-day/san-francisco',
   '/mothers-day/washington-dc',
   '/pages/affiliates',
   '/pages/api',
   '/privacy',
   '/redeem',
   '/scheduler',
   '/subscribe',
   '/support',
   '/techjobs',
   '/terms',
   '/topchef',
   '/unlock',
   '/valentines-gifts',
   '/vip',
   '/what-is-a-groupon',
   '/widget'
  ]
