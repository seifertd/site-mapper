'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateSitemaps = undefined;

var _config = require('./config');

var _site_mapper = require('./site_mapper');

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _underscore = require('underscore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var generateSitemaps = function generateSitemaps(done) {
  var tasks = [];
  var siteMappers = [];
  _config.config.addAppSpecific();

  if (!_config.config.sitemaps || _config.config.sitemaps.length <= 0) {
    _config.config.log.error("No sitemaps in config");
    if (done) {
      done(new Error("No sitemaps in config"));
    }
    return;
  }
  (0, _underscore.each)(_config.config.sitemaps, function (sitemapConfig, sitemapName) {
    tasks.push(function (taskCb) {
      _config.config.log.info('Generating sitemaps for configuration ' + sitemapName);
      var siteMapper = new _site_mapper.SiteMapper(sitemapConfig);
      siteMapper.generateSitemap(taskCb);
      siteMappers.push(siteMapper);
    });
  });

  _async2.default.series(tasks, function (err) {
    if (err) {
      _config.config.log.error(err, "Error generating sitemaps");
    } else {
      _config.config.log.info("Done generating sitemaps");
    }
    if (done) {
      done(err, siteMappers);
    }
  });
};

exports.generateSitemaps = generateSitemaps;