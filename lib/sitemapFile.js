'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SitemapFile = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _xml_escape = require('./xml_escape');

var _config = require('./config');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Transform = require('stream').Transform;
var fs = require('fs');
var zlib = require('zlib');

var SitemapFile = exports.SitemapFile = function (_Transform) {
  _inherits(SitemapFile, _Transform);

  function SitemapFile(_ref) {
    var location = _ref.location;
    var fileName = _ref.fileName;

    _classCallCheck(this, SitemapFile);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SitemapFile).call(this, { objectMode: true }));

    _this.location = location;
    _this.fileName = fileName;
    _this.gzipDone = false;
    _this.fileDone = false;
    _this.urlCount = 0;
    return _this;
  }

  _createClass(SitemapFile, [{
    key: 'open',
    value: function open() {
      var _this2 = this;

      _config.config.log.trace('Opening sitemap ' + this.fileName);
      this.gzipper = zlib.createGzip().on('finish', function () {
        _this2.gzipDone = true;
      });
      this.file = fs.createWriteStream(this.fileName).on('finish', function () {
        _this2.fileDone = true;
      });
      this.output = this.pipe(this.gzipper).pipe(this.file).on('error', function (err) {
        _this2.emit("error", err);
      });
      this.gzipper.write(_config.config.sitemapHeader);
    }
  }, {
    key: '_transform',
    value: function _transform(url, encoding, callback) {
      this.push(url.toXml());
      this.urlCount += 1;
      callback();
    }
  }, {
    key: 'toIndexXml',
    value: function toIndexXml() {
      return '<sitemap><loc>' + (0, _xml_escape.escapeXmlValue)(this.location) + '</loc><lastmod>' + new Date().toISOString() + '</lastmod></sitemap>';
    }
  }, {
    key: 'isDrained',
    value: function isDrained() {
      return this.gzipDone && this.fileDone;
    }
  }, {
    key: 'close',
    value: function close() {
      this.gzipper.write("</urlset>");
      this.end();
    }
  }]);

  return SitemapFile;
}(Transform);