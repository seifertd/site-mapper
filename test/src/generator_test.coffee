{expect} = require('chai')
{generateSitemaps} = require '../../src/generator'
HttpSource = require '../../src/site_mapper/http_source'
config = require '../../src/config'
libxmljs = require 'libxmljs'
zlib = require 'zlib'
concat = require 'concat-stream'
fs = require 'fs'
util = require 'util'

describe 'sitemap generator', ->
  it 'exists', ->
    expect(generateSitemaps).to_exist

  it 'works with the test configuration', (done) ->
    out = concat (log) ->
      expect(log).to.match /sitemap done.+channel10.+4 urls/ 
      expect(log).to.match /sitemap done.+channel20.+4 urls/

      # Check that sitemaps are well formed xml
      parseXml = (xmlData) ->
        ->
          xmlDoc = new libxmljs.parseXml xmlData
      expect(parseXml(fs.readFileSync("./tmp/sitemaps/test/testSitemap.xml"))).to.not.throw(Error)

      gzipOut = concat (xmlData) ->
        expect(parseXml(xmlData)).to.not.throw(Error)

        againGzipOut = concat (xmlData) ->
          expect(parseXml(xmlData)).to.not.throw(Error)
          done()
        fs.createReadStream("./tmp/sitemaps/test/channel20.xml.gz").pipe(zlib.createGunzip()).pipe(againGzipOut)

      fs.createReadStream("./tmp/sitemaps/test/channel10.xml.gz").pipe(zlib.createGunzip()).pipe(gzipOut)

    @timeout(5000)

    generateSitemaps {out}

  describe 'with a source with error', (done) ->
    before ->
      @sourceOptions =
        type: HttpSource
        options:
          serviceUrl: "http://jdflasdfjlkdsjlsfdjlsdj.com/foo/bar"
      config.sources.errorSource = (sitemapConfig) =>
        @sourceOptions
    describe 'with default config', ->
      it 'fails', (done) ->
        out = concat (log) ->
          expect(log).to.match /ERROR\! generating sitemaps/

        cb = (err, results) ->
          expect(err).to.not.be_null
          expect(results).to.be_null
          done()

        @timeout(5000)

        generateSitemaps {out}, cb

    describe 'with config to ignore errors', ->
      before ->
        @sourceOptions.options.ignoreErrors = true
      it 'works', (done) ->
        out = concat (log) ->
          expect(log).to.match /\[IGNORING ERROR\]/

        cb = (err, results) ->
          expect(err).to.be_null
          done()

        @timeout(5000)

        generateSitemaps {out}, cb
