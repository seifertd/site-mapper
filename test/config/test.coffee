{StaticSetSource} = require '../../src/generator'

module.exports =
  foo: 'bar'
  sitemaps:
    "test.com":
      sitemapIndex: 'testSitemap.xml'
      urlBase: 'http://test.com'
  sources:
    source1: (sitemapConfig) ->
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
    source2: (sitemapConfig) ->
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
