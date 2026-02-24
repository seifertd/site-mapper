const path = require('path');
const pino = require('pino');

const env = process.env.NODE_ENV || 'development';
let config = null;
const defaultConfig = require("./defaults");
try {
  config = Object.assign({}, defaultConfig, require(`./${env}`));
} catch {
  config = Object.assign({}, defaultConfig);
}
config.env = env;

const createLogger = (logConfig) => {
  const {stream, ...opts} = logConfig || {};
  return stream ? pino(opts, stream) : pino(opts);
};

const addAppSpecific = function() {
  // Overlay cwd config
  let workingDir = process.env.CONFIG_DIR || process.cwd();
  let appConfigPath = [workingDir, 'config', env].join(path.sep);
  try {
    const appConfig = require(appConfigPath);
    Object.assign(config, appConfig);
    // Update log
    config.log = createLogger(config.logConfig);
  } catch (err) {
    config.log.warn(err, `Could not require app specific config ${appConfigPath}`);
  }
};

// Set up logger
config.log = createLogger(config.logConfig);
config.addAppSpecific = addAppSpecific;
config.addOverrides = (overrides) => {
  Object.assign(config, overrides);
};

module.exports = { config };
