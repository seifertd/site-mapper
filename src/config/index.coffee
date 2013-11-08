env = process.env.NODE_ENV || 'development'

module.exports = config = require "./#{env}"

config.env = env
