'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SitemapTransformer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('../config');

var _cached_input = require('./cached_input');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Transform = require('stream').Transform;
var fs = require('fs');
var request = require('request');

var _require = require('underscore');

var extend = _require.extend;

var SitemapTransformer = exports.SitemapTransformer = function (_Transform) {
  _inherits(SitemapTransformer, _Transform);

  function SitemapTransformer(sourceConfig) {
    _classCallCheck(this, SitemapTransformer);

    var _this = _possibleConstructorReturn(this, (SitemapTransformer.__proto__ || Object.getPrototypeOf(SitemapTransformer)).call(this, { objectMode: true }));

    _config.config.log.debug("Initializing source", sourceConfig);
    if (sourceConfig.siteMap) {
      _this.urlFormatter = sourceConfig.siteMap.urlFormatter;
      _this.urlFilter = sourceConfig.siteMap.urlFilter;
      _this.urlAugmenter = sourceConfig.siteMap.urlAugmenter;
      _this.extraUrls = sourceConfig.siteMap.extraUrls;
      _this.defaultPriority = sourceConfig.siteMap.priority;
      _this.defaultChangeFrequency = sourceConfig.siteMap.changefreq;
      _this.channel = sourceConfig.siteMap.channel;
      _this.channelIsFunction = typeof _this.channel === "function";
    }
    _this.name = sourceConfig.name;
    _this.inputConfig = sourceConfig.input;
    _this.ignoreErrors = sourceConfig.ignoreErrors;
    return _this;
  }

  _createClass(SitemapTransformer, [{
    key: 'open',
    value: function open() {
      var _this2 = this;

      this.inputStream = this.openInputStream(this.inputConfig);
      if (this.inputStream) {
        this.inputStream.on("error", function (err) {
          _this2.emit("error", err);
        });
      }
      //Handle extraUrls for the source
      if (this.extraUrls) {
        _config.config.log.debug('Pushing ' + this.extraUrls.length + ' extraUrls');
        this.extraUrls.forEach(function (extra) {
          _this2.write(extra);
        });
        this.extraUrls = null;
      }
      return this;
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl(chunk) {
      // subclasses must override
      throw new Error("SitemapTransformer subclasses must override buildUrl(chunk)");
    }
  }, {
    key: 'channelForUrl',
    value: function channelForUrl(url) {
      if (this.channelIsFunction) {
        return this.channel(url);
      } else {
        return this.channel;
      }
    }
  }, {
    key: 'openInputStream',
    value: function openInputStream(inputOptions) {
      var _this3 = this;

      if (!inputOptions) {
        this.emit("error", new Error("config.input needs to be set"));
        return;
      }
      var input = function input() {
        if (inputOptions.fileName) {
          _config.config.log.debug('Source ' + _this3.name + ' opening file ' + inputOptions.fileName);
          return fs.createReadStream(inputOptions.fileName, extend({ encoding: "utf8" }, _config.config.fileOptions, inputOptions.fileOptions));
        } else if (inputOptions.url) {
          _config.config.log.debug('Source ' + _this3.name + ' opening url ' + inputOptions.url);
          return request.get(extend({}, _config.config.httpOptions, inputOptions.httpOptions, { uri: inputOptions.url }));
        } else if (inputOptions.stream) {
          return inputOptions.stream;
        } else {
          var util = require('util');
          _this3.emit('error', new Error('config.input needs to have one of \'fileName\', \'url\', or \'stream\': ' + util.inspect(inputOptions)));
        }
      };
      if (inputOptions.cached) {
        return new _cached_input.CachedInput(input, inputOptions.cached);
      } else {
        return input();
      }
    }
  }, {
    key: '_transform',
    value: function _transform(chunk, encoding, callback) {
      try {
        var url = this._decorateUrl(this.buildUrl(chunk));
        if (url) {
          this.push(url);
        }
      } catch (err) {
        this.emit("error", err);
      }
      callback();
    }
  }, {
    key: '_decorateUrl',
    value: function _decorateUrl(url) {
      // Apply url formatter
      if (this.urlFormatter) {
        url.url = this.urlFormatter(url.url);
      }
      if (!this.urlFilter || !this.urlFilter(url)) {
        // apply transformer if available
        if (this.urlAugmenter) {
          this.urlAugmenter(url);
        }
        // apply defaults
        if (!url.priority) {
          url.priority = this.defaultPriority;
        }
        if (!url.changeFrequency) {
          url.changeFrequency = this.defaultChangeFrequency;
        }
        return url;
      }
      return null;
    }
  }, {
    key: '_flush',
    value: function _flush(callback) {
      callback();
    }
  }]);

  return SitemapTransformer;
}(Transform);