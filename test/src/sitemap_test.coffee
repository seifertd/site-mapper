{expect} = require 'chai'
Sitemap = require '../../src/sitemap'
concat = require 'concat-stream'
util = require 'util'

describe 'sitemap', ->
  it 'class exists', ->
    expect(Sitemap).to_exist

  describe 'instances', ->
    before ->
      @outStream = concat (stdoutData) ->
      @config =
        generateOptions:
          out: @outStream

    beforeEach ->
      @sitemap = new Sitemap @config, "sitemap.xml.gz", "sitemap.xml.gz"
      @sitemap.open = ->

    after ->
      @outStream.end()

    it "can be created", ->
      expect(@sitemap).to_exist

    it "can consume url objects", (done) ->
      self = this
      @sitemap.stream = concat (xml) ->
        expect(xml).to.match /<loc>http:\/\/foo.com\/foo\.html/
        expect(self.sitemap.urlCount).to.equal 1
        done()
      @sitemap.stream.on 'data', (data) ->
        self.sitemap.stream.write(data)

      @sitemap.addUrl({url:"http://foo.com/foo.html", updatedAt: new Date(), changefreq: 'daily', priority: 1})
      @sitemap.stream.end()

    it "can put image tags in sitemaps", (done) ->
      self = this
      @sitemap.stream = concat (xml) ->
        expect(xml).to.match /<image:image>/
        expect(self.sitemap.urlCount).to.equal 1
        done()
      @sitemap.stream.on 'data', (data) ->
        self.sitemap.stream.write(data)

      @sitemap.addUrl({url:"http://foo.com/foo.html", updatedAt: new Date(), changefreq: 'daily', priority: 1, image: "http://foo.com/image.png"})
      @sitemap.stream.end()

    it "can put xhtml link tags in sitemaps", (done) ->
      self = this
      @sitemap.stream = concat (xml) ->
        expect(xml).to.match /<xhtml:link.*href="http:\/\/foo.com\/link"\/>/
        expect(self.sitemap.urlCount).to.equal 1
        done()
      @sitemap.stream.on 'data', (data) ->
        self.sitemap.stream.write(data)

      @sitemap.addUrl({url:"http://foo.com/foo.html", updatedAt: new Date(), changefreq: 'daily', priority: 1, links: [{rel: 'alternate', href: "http://foo.com/link"}] })
      @sitemap.stream.end()

