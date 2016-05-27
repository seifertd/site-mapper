'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sitemap = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sitemapFile = require('./sitemapFile');

var _config = require('./config');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Writable = require('stream').Writable;

var DEFAULTS = {
  maxUrlsPerFile: 50000
};

var Sitemap = exports.Sitemap = function (_Writable) {
  _inherits(Sitemap, _Writable);

  function Sitemap(_ref) {
    var source = _ref.source;
    var sitemapConfig = _ref.sitemapConfig;

    _classCallCheck(this, Sitemap);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Sitemap).call(this, { objectMode: true }));

    _this.source = source;
    _this.source.on("error", function (err) {
      _this.emit("error", err);
    });
    _this.sitemapConfig = sitemapConfig;
    _this.baseUrl = '' + sitemapConfig.sitemapRootUrl + sitemapConfig.sitemapFileDirectory;
    _this.directory = sitemapConfig.targetDirectory;
    _this.urlCount = {};
    _this.maxPerFile = _this.sitemapConfig.maxUrlsPerFile || DEFAULTS.maxUrlsPerFile;
    _this.files = {};
    _this.pipeline = source.pipe(_this);
    _this.finished = false;
    _this.on('finish', function () {
      _this.finished = true;
      _config.config.log.trace('Pushed all urls for ' + _this.source.name);
    });
    return _this;
  }

  _createClass(Sitemap, [{
    key: 'open',
    value: function open() {
      this.source.open();
    }
  }, {
    key: 'isFinished',
    value: function isFinished() {
      var _this2 = this;

      // Hasn't started yet
      if (!this.finished && Object.keys(this.files).length == 0) {
        return false;
      }
      if (Object.keys(this.files).length == 0 && this.finished) {
        // All urls filtered?
        return true;
      }
      return Object.keys(this.files).every(function (channel) {
        var channelFiles = _this2.filesForChannel(channel) || [];
        return channelFiles.every(function (file) {
          var drained = file.isDrained();
          if (drained) {
            file.end();
          }
          return drained;
        });
      });
    }
  }, {
    key: 'allFiles',
    value: function allFiles() {
      var _this3 = this;

      return Object.keys(this.files).reduce(function (memo, channel) {
        return memo.concat(_this3.files[channel]);
      }, []);
    }
  }, {
    key: 'filesForChannel',
    value: function filesForChannel(channel) {
      var channelFiles = this.files[channel];
      if (channelFiles === undefined) {
        channelFiles = this.files[channel] = [];
      }
      return channelFiles;
    }
  }, {
    key: 'currentSitemapFile',
    value: function currentSitemapFile(channel) {
      var _this4 = this;

      if (this.urlCount[channel] === undefined) {
        this.urlCount[channel] = 0;
      }
      var fileIndex = Math.floor(this.urlCount[channel] / this.maxPerFile);
      var channelFiles = this.filesForChannel(channel);
      var file = channelFiles[fileIndex];
      var previousFile = null;
      if (!file) {
        if (fileIndex > 0) {
          // close out the old one
          previousFile = channelFiles[fileIndex - 1];
          _config.config.log.trace('Closing ' + previousFile.fileName);
          previousFile.close();
        }
        var fileName = '' + channel + fileIndex + '.xml.gz';
        file = channelFiles[fileIndex] = new _sitemapFile.SitemapFile({ location: this.baseUrl + '/' + fileName,
          fileName: this.directory + '/' + fileName });
        file.on('error', function (err) {
          _this4.emit("error", err);
        });
        file.open();
      }
      return [file, previousFile];
    }
  }, {
    key: 'totalUrls',
    value: function totalUrls() {
      var _this5 = this;

      var pushed = 0;
      Object.keys(this.urlCount).forEach(function (channel) {
        pushed += _this5.urlCount[channel];
      });
      var drained = 0;
      Object.keys(this.files).forEach(function (channel) {
        _this5.files[channel].forEach(function (file) {
          drained += file.urlCount;
        });
      });
      return [pushed, drained];
    }
  }, {
    key: 'closeRemaining',
    value: function closeRemaining() {
      var _this6 = this;

      Object.keys(this.files).forEach(function (channel) {
        var channelFiles = _this6.filesForChannel(channel);
        if (channelFiles.length > 0) {
          var lastFileInChannel = channelFiles[channelFiles.length - 1];
          _config.config.log.trace('CLOSING ' + lastFileInChannel.fileName);
          lastFileInChannel.close();
        }
      });
    }
  }, {
    key: '_write',
    value: function _write(url, encoding, callback) {
      // Just pass the url through to the currently active SitemapFile
      var channel = this.source.channelForUrl(url);
      if (!channel) {
        var util = require('util');
        _config.config.log.error(new Error('url ' + util.inspect(url) + ' of source ' + this.source.name + ' has no channel: ' + util.inspect(channel)));
        throw new Error('url ' + util.inspect(url) + ' has no channel: ' + util.inspect(channel));
      }

      var _currentSitemapFile = this.currentSitemapFile(channel);

      var _currentSitemapFile2 = _slicedToArray(_currentSitemapFile, 2);

      var file = _currentSitemapFile2[0];
      var previousFile = _currentSitemapFile2[1];
      // If there is a previousFile, wait for it to drain before writing url

      if (previousFile) {
        (function () {
          var waiting = function waiting() {
            if (previousFile.isDrained()) {
              _config.config.log.trace(previousFile.fileName + ' is drained, saved ' + previousFile.urlCount + ' URLS');
              callback();
            } else {
              //config.log.trace(`${previousFile.fileName} is not drained, waiting`);
              setTimeout(waiting, 100);
            }
          };
          setTimeout(waiting, 100);
        })();
      } else {
        file.write(url);
        this.urlCount[channel] += 1;
        callback();
      }
    }
  }]);

  return Sitemap;
}(Writable);