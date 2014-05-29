{StaticSetSource} = require '../../lib/generator'

module.exports =
  foo: 'bar'
  sitemaps:
    "test.com":
      sitemapIndex: 'testSitemap.xml'
      urlBase: 'http://test.com'
  sources:
    source1:
      type: StaticSetSource
      options:
        channel: 'channel1'
        changefreq: 'weekly'
        priority: 1
        urls: [
          '/',
          '/about',
          '/faq',
          '/jobs'
        ]
    source2:
      type: StaticSetSource
      options:
        channel: 'channel2'
        changefreq: 'daily'
        priority: 0.1
        urls: [
          '/stuff',
          '/such',
          '/deep/url',
          '/garbage.html'
        ]
