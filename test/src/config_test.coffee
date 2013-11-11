expect      = require('chai').expect
config      = require 'config'

describe 'config', ->
  it 'knows the environment', ->
    expect(config.env).to.equal 'test'

  it 'can read config in the module', ->
    expect(config.testing).to.be_true

  it 'can read the default configuration', ->
    expect(config.targetDirectory).to.equal "#{process.cwd()}/tmp/sitemaps/test"

  describe 'app specific', ->
    before ->
      config.addAppSpecific()

    it 'can be found', ->
      expect(config.foo).to.equal 'bar'

    it 'overrides defaults', ->
      expect(config.sitemapIndex).to.equal 'testSitemap.xml'
