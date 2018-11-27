const fs = require('fs');
const path = require('path');
const {extend} = require('lodash');
const bunyan = require('bunyan');

const env = process.env.NODE_ENV || 'development';
let config = null;
const defaultConfig = require("./defaults");
try {
  config = extend({}, defaultConfig, require(`./${env}`));
} catch (err) {
  config = extend({}, defaultConfig);
}
config.env = env;

const addAppSpecific = function() {
  // Overlay cwd config
  let workingDir = process.env.CONFIG_DIR || process.cwd();
  let appConfigPath = [workingDir, 'config', env].join(path.sep);
  let appConfig = null;
  try {
    appConfig = require(appConfigPath);
    extend(config, appConfig);
    // Update log
    config.log = bunyan.createLogger(config.logConfig);
  } catch (err) {
    config.log.warn(err, `Could not require app specific config ${appConfigPath}`);
  }
};

// Set up logger
config.log = bunyan.createLogger(config.logConfig);
config.addAppSpecific = addAppSpecific;
config.addOverrides = (overrides) => {
  extend(config, overrides);
};

export { config };
