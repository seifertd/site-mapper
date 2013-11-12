{expect} = require('chai')
{generateSitemaps} = require '../../lib/generator'

describe 'sitemap generator', ->
  it 'exists', ->
    expect(generateSitemaps).to_exist
