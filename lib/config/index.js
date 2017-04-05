'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var fs = require('fs');
var path = require('path');

var _require = require('underscore'),
    extend = _require.extend;

var bunyan = require('bunyan');

var env = process.env.NODE_ENV || 'development';
var config = null;
var defaultConfig = require("./defaults");
try {
  exports.config = config = extend({}, defaultConfig, require('./' + env));
} catch (err) {
  exports.config = config = extend({}, defaultConfig);
}
config.env = env;

var addAppSpecific = function addAppSpecific() {
  // Overlay cwd config
  var workingDir = process.env.CONFIG_DIR || process.cwd();
  var appConfigPath = [workingDir, 'config', env].join(path.sep);
  var appConfig = null;
  try {
    appConfig = require(appConfigPath);
    extend(config, appConfig);
    // Update log
    config.log = bunyan.createLogger(config.logConfig);
  } catch (err) {
    config.log.warn(err, 'Could not require app specific config ' + appConfigPath);
  }
};

// Set up logger
config.log = bunyan.createLogger(config.logConfig);
config.addAppSpecific = addAppSpecific;
config.addOverrides = function (overrides) {
  extend(config, overrides);
};

exports.config = config;