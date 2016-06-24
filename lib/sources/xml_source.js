'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XmlSource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _sitemap_transformer = require('./sitemap_transformer');

var _url = require('../url');

var _config = require('../config');

var _underscore = require('underscore');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var sax = require('sax');

var DEFAULT_OPTIONS = {
  urlTag: 'url',
  urlAttributes: {
    'lastmod': 'lastModified',
    'changefreq': 'changeFrequency',
    'priority': 'priority',
    'loc': 'url'
  },
  parserOptions: {
    trim: true
  }
};

var XmlSource = exports.XmlSource = function (_SitemapTransformer) {
  _inherits(XmlSource, _SitemapTransformer);

  function XmlSource(options) {
    _classCallCheck(this, XmlSource);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(XmlSource).call(this, options));

    var myConfig = (0, _underscore.extend)({}, DEFAULT_OPTIONS, options.options);
    _this.parser = sax.createStream(true, myConfig.parserOptions);
    _this.parser.on("opentag", function (element) {
      if (element.name === myConfig.urlTag) {
        _this.url = {};
      } else if (_this.url) {
        _this.url.nextAttribute = element.name;
      }
    }).on("closetag", function (tagName) {
      if (tagName === myConfig.urlTag) {
        try {
          delete _this.url.nextAttribute;
          if (_this.url.lastModified) {
            //config.log.trace(`PARSING ${this.url.lastModified} as a date`);
            _this.url.lastModified = Date.parse(_this.url.lastModified);
          }
          if (_this.url.priority) {
            //config.log.trace(`PARSING ${this.url.priority} as a float`);
            _this.url.priority = parseFloat(_this.url.priority);
          }
          var url = _this._decorateUrl(new _url.Url(_this.url));
          if (url) {
            _this.push(url);
          }
        } catch (err) {
          _this.emit("error", err);
        }
        _this.url = null;
      }
    }).on("text", function (text) {
      if (_this.url && _this.url.nextAttribute) {
        var urlAttr = myConfig.urlAttributes[_this.url.nextAttribute];
        if (urlAttr) {
          _this.url[urlAttr] = '' + (_this.url[urlAttr] || '') + text;
        }
      }
    }).on("error", function (err) {
      _this.emit("error", err);
    });
    return _this;
  }

  _createClass(XmlSource, [{
    key: '_transform',
    value: function _transform(chunk, encoding, callback) {
      this.parser.write(chunk);
      callback();
    }
  }, {
    key: 'open',
    value: function open() {
      _get(Object.getPrototypeOf(XmlSource.prototype), 'open', this).call(this);
      if (this.inputStream) {
        this.inputStream.pipe(this);
      }
    }
  }]);

  return XmlSource;
}(_sitemap_transformer.SitemapTransformer);