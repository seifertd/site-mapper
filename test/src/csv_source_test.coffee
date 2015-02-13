config = require 'config'
expect = require('chai').expect
bond = require 'bondjs'
concat = require 'concat-stream'

CsvFileSource = require 'site_mapper/csv_file_source'

util = require 'util'

describe 'csv file source', ->
  before ->
    @urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"})
    @out = concat (data) ->

  it 'parses csv and produces urls', (done) ->
    source = new CsvFileSource {out: @out, changefreq: 'foo', priority: 1, channel: 'csv', fileName: "#{process.cwd()}/config/test.csv", urlFormatter: @urlFormatter}
    urlCb = bond()
    source.on 'done', ->
      expect(urlCb.called).to.equal 5
      expect(urlCb.calledArgs[0].length).to.equal 1
      expect(urlCb.calledArgs[0][0].url).to.equal 'http://test.com/url1'
      expect(urlCb.calledArgs[0][0].image).to.be_null
      expect(urlCb.calledArgs[1].length).to.equal 1
      expect(urlCb.calledArgs[1][0].url).to.equal 'http://test.com/url2'
      expect(urlCb.calledArgs[1][0].image).to.equal '/image2'
      done()

    source.generateUrls urlCb

  it 'fails when csv file is bad', (done) ->
    source = new CsvFileSource {out: @out, changefreq: 'foo', priority: 1, channel: 'csv', fileName: "#{process.cwd()}/config/error.csv", urlFormatter: @urlFormatter}
    doneCb = bond()
    urlCb = bond()
    source.on 'done', doneCb
    source.on 'error', (error) =>
      expect(error).to.not.be_null
      expect(doneCb.called).to.equal 0
      expect(urlCb.called).to.equal 0
      done()

    source.generateUrls urlCb
