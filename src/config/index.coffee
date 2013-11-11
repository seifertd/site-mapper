cfr = require 'coffee-script-redux/register'
fs = require 'fs'
path = require 'path'
{extend} = require 'underscore'

env = process.env.NODE_ENV || 'development'
config = {}
try
  config = require "./#{env}"
catch err
  # Load defaults
  config = require "./defaults"

config.env = env

config.addAppSpecific = ->
  # Overlay cwd config
  appConfigPath = path.join(process.cwd(), 'config', env)
  try
    appConfig = require appConfigPath
  catch err
    console.log "WARN: Could not require app specific config #{appConfigPath}: #{err}"

  if appConfig?
    extend config, appConfig

module.exports = config
