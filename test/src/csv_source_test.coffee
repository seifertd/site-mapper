expect = require('chai').expect

CsvFileSource = require 'site_mapper/csv_file_source'

util = require 'util'

describe 'csv file source', ->
  urls = []

  it 'parses csv and produces urls', (done) ->
    source = new CsvFileSource {changefreq: 'foo', priority: 1, channel: 'csv', fileName: "#{process.cwd()}/config/test.csv"}
    source.on 'done', =>
      expect(urls.length).to.equal 5
      done()

    source.generateUrls (url) =>
      urls.push url
