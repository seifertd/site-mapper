'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SiteMapper = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _underscore = require('underscore');

var _sitemap = require('./sitemap');

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SiteMapper = exports.SiteMapper = function () {
  function SiteMapper(sitemapConfig) {
    _classCallCheck(this, SiteMapper);

    this.sitemapConfig = (0, _underscore.extend)({}, _config.config.defaultSitemapConfig, sitemapConfig);
    _config.config.log.info('Site mapper config ', this.sitemapConfig);
    var buildDir = function buildDir(parentPath, nextPath) {
      var fullPath = void 0;
      if (parentPath.length > 0 && parentPath != "/") {
        fullPath = parentPath + '/' + nextPath;
      } else {
        fullPath = '' + parentPath + nextPath;
      }
      if (fullPath != "." && fullPath != "") {
        if (!_fs2.default.existsSync(fullPath)) {
          _fs2.default.mkdirSync(fullPath);
        }
      } else if (fullPath == "") {
        fullPath = "/";
      }
      return fullPath;
    };

    this.sitemapConfig.targetDirectory.split('/').reduce(buildDir, '');
    this.sources = this.initializeSources();
    this.sitemaps = [];
  }

  _createClass(SiteMapper, [{
    key: 'initializeSources',
    value: function initializeSources() {
      var _this = this;

      var sources = [];
      var buildSource = function buildSource(sourceDefinition, sourceName) {
        var sourceConfig = sourceDefinition(_this.sitemapConfig);
        var sourceClass = sourceConfig.type;
        var sourceOptions = sourceConfig.options;
        _config.config.log.trace('Building source ' + sourceName + ' with options ', sourceOptions);
        if (!sourceOptions.siteMap.urlFormatter) {
          sourceOptions.siteMap.urlFormatter = _config.config.defaultUrlFormatter(_this.sitemapConfig);
        }
        sourceOptions.name = sourceName;
        return new sourceClass(sourceOptions);
      };
      _config.config.log.info("Initializing sources");
      var includes = this.sitemapConfig.sources && this.sitemapConfig.sources.includes;
      var excludes = this.sitemapConfig.sources && this.sitemapConfig.sources.excludes;
      (0, _underscore.each)(_config.config.sources, function (sourceDefinition, sourceName) {
        if (includes && includes.length > 0) {
          // If there is an explicit includes list, only include sources in this list
          if (includes.indexOf(sourceName) >= 0) {
            _config.config.log.info(' -> Explicit include of source ' + sourceName);
            sources.push(buildSource(sourceDefinition, sourceName));
          }
        } else {
          if (excludes && excludes.indexOf(sourceName) >= 0) {
            _config.config.log.info(' -> Explicit exclude of source ' + sourceName);
            return;
          }
          _config.config.log.info(' -> Including ' + sourceName + ' since it is not explicitly excluded');
          sources.push(buildSource(sourceDefinition, sourceName));
        }
      });
      if (sources.length <= 0) {
        throw new Error('No sitemap source definitions matched includes: ' + includes);
      }
      _config.config.log.info('Initialized ' + sources.length + ' sources');
      return sources;
    }
  }, {
    key: 'generateSitemap',
    value: function generateSitemap(done) {
      var _this2 = this;

      _async2.default.series([function (done) {
        return _this2.generateFiles(done);
      }, function (done) {
        return _this2.generateIndex(done);
      }], done);
    }
  }, {
    key: 'generateIndex',
    value: function generateIndex(done) {
      this.indexFileName = this.sitemapConfig.targetDirectory + '/' + this.sitemapConfig.sitemapIndex;
      _config.config.log.info('Creating sitemap index: ' + this.indexFileName);
      var index = _fs2.default.createWriteStream(this.indexFileName);
      index.on("finish", done);
      index.on("error", done);
      index.write(_config.config.sitemapIndexHeader);
      this.sitemaps.forEach(function (sitemap) {
        sitemap.allFiles().forEach(function (file) {
          index.write(file.toIndexXml());
        });
      });
      index.write("</sitemapindex>");
      index.end();
    }
  }, {
    key: 'generateFiles',
    value: function generateFiles(done) {
      var _this3 = this;

      var tasks = this.sources.map(function (source) {
        return function (cb) {
          var ended = false;
          var endTask = function endTask(err) {
            if (!ended) {
              ended = true;
              cb(err);
            } else {
              _config.config.log.trace("Tried to call back more than once with: ", err);
            }
          };
          _config.config.log.info('Generating sitemap(s) for source ' + source.name);
          var sitemap = new _sitemap.Sitemap({ source: source, sitemapConfig: _this3.sitemapConfig }).on('error', function (err) {
            if (source.ignoreErrors) {
              _config.config.log.warn('Ignoring error by configuration', err);
              endTask();
            } else {
              endTask(err);
            }
          }).on('finish', function () {
            var closedRemaining = false;
            var waiting = function waiting() {
              var _sitemap$totalUrls = sitemap.totalUrls(),
                  _sitemap$totalUrls2 = _slicedToArray(_sitemap$totalUrls, 2),
                  pushed = _sitemap$totalUrls2[0],
                  drained = _sitemap$totalUrls2[1];

              _config.config.log.trace('Waiting for sitemap(s) for source ' + source.name + ', processed ' + drained + '/' + pushed + ' URLS');
              if (drained < pushed) {
                setTimeout(waiting, 100);
              } else {
                if (!closedRemaining) {
                  closedRemaining = true;
                  sitemap.closeRemaining();
                  setTimeout(waiting, 100);
                } else {
                  _config.config.log.info('Processed ' + drained + '/' + pushed + ' URLS to sitemap ' + source.name);
                  _this3.sitemaps.push(sitemap);
                  endTask(null);
                }
              }
            };
            setTimeout(waiting, 100);
          });
          sitemap.open();
        };
      });
      _async2.default.series(tasks, function (err, results) {
        done(err, _this3.sitemaps);
      });
    }
  }]);

  return SiteMapper;
}();