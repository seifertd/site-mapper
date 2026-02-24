var StaticSetSource = require('../../lib/main').StaticSetSource;

module.exports = {
  sources: {
    source1: (_sitemapConfig) => {
      return {
        type: StaticSetSource,
        options: {
          siteMap: {
            channel: 'channel1',
            changefreq: 'weekly',
            priority: 1,
            indexFile: 'channel1Index.xml'
          },
          options: {
            urls: [
              '/',
              '/about',
              '/faq',
              '/jobs'
            ]
          }
        }
      };
    },
    source2: (_sitemapConfig) => {
      return {
        type: StaticSetSource,
        options: {
          siteMap: {
            channel: 'channel2',
            changefreq: 'daily',
            priority: 0.1,
            indexFile: 'channel2Index.xml'
          },
          options: {
            urls: [
              '/stuff',
              '/such',
              '/deep/url',
              '/garbage.html'
            ]
          }
        }
      };
    }
  }
};
