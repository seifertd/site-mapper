fs = require 'fs'
path = require 'path'
{extend} = require 'underscore'

env = process.env.NODE_ENV || 'development'
module.exports = config = require "./#{env}"
config.env = env

# Overlay cwd config
appConfigPath = path.join(process.cwd(), 'config', env)

try
  appConfig = require appConfigPath
  if appConfig?
    extend config, appConfig
catch err
  console.log "!WARN: Could not require app specific configuration #{appConfigPath}: #{err}"
