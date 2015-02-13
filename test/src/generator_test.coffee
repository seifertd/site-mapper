{expect} = require('chai')
{generateSitemaps} = require '../../src/generator'
concat = require 'concat-stream'

describe 'sitemap generator', ->
  it 'exists', ->
    expect(generateSitemaps).to_exist

  it 'works with the test configuration', (done) ->
    out = concat (log) ->
      expect(log).to.match /sitemap done.+channel10.+4 urls/ 
      expect(log).to.match /sitemap done.+channel20.+4 urls/ 
      done()

    @timeout(5000)

    generateSitemaps {out}
