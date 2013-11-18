Source = require './source'
csv = require 'csv'
util = require 'util'

module.exports = class CsvFileSource extends Source
  constructor: (options) ->
    Source.call(this, options)
    @fileName = options.fileName
    @channel = options.channel

  _generateUrls: (cb) ->
    console.log "Generating sitemap urls from csv #{@fileName}"
    updatedAt = new Date()
    try
      csv().from.path(@fileName).on('record', (row, index) =>
        imageUrl = if row[1]?.length then row[1] else null
        cb {
          url: @urlFormatter(row[0])
          channel: @channel
          updatedAt: updatedAt
          changefreq: @changefreq
          priority: @priority
          image: imageUrl
        }
      ).on('error', (err) =>
        @error(err)
      ).on('end', (count) =>
        console.log "!! Read #{count} urls from csv"
        @end()
      )
    catch err
      console.log "!! exception parsing csv #{err}"
      @error(err)
