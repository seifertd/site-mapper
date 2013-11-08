expect      = require('chai').expect
bond        = require 'bondjs'
config      = require 'config'

describe 'config', ->
  it 'knows the environment', ->
    expect(config.env).to.equal 'test'
