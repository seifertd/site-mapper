{expect} = require('chai')
{generateSitemaps} = require '../../src/generator'
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
