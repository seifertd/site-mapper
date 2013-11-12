expect = require('chai').expect
util = require 'util'
Source = require 'site_mapper/source'

class TestSource extends Source
  _generateUrls: (cb) =>
    cb {
      url: 'http://foo.com/foo/bar'
      channel: 'foo'
      updatedAt: new Date()
      priority: @priority
      changefreq: @changefreq
    }
    @emit('done')

describe 'url sources', ->
  @url = null
  it 'produce urls', (done) ->
    source = new TestSource({changefreq: 'foo', priority: 1})

    source.on 'done', =>
      expect(@url.url).to.equal 'http://foo.com/foo/bar'
      expect(@url.changefreq).to.equal 'foo'
      expect(@url.priority).to.equal 1
      done()

    source.generateUrls (url) =>
      @url = url
