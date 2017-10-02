'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CsvSource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _sitemap_transformer = require('./sitemap_transformer');

var _url = require('../url');

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var csv = require('csv');

var DEFAULT_OPTIONS = {
  columns: ['url', 'imageUrl', 'lastModified', 'comments'],
  relax_column_count: true
};

var CsvSource = exports.CsvSource = function (_SitemapTransformer) {
  _inherits(CsvSource, _SitemapTransformer);

  function CsvSource(config) {
    _classCallCheck(this, CsvSource);

    var _this = _possibleConstructorReturn(this, (CsvSource.__proto__ || Object.getPrototypeOf(CsvSource)).call(this, config));

    var csvOptions = (0, _lodash.extend)({}, DEFAULT_OPTIONS, config.options);
    _this.parser = csv.parse(csvOptions);
    _this.parser.on("error", function (err) {
      _this.emit('error', err);
    });
    return _this;
  }

  _createClass(CsvSource, [{
    key: 'open',
    value: function open() {
      _get(CsvSource.prototype.__proto__ || Object.getPrototypeOf(CsvSource.prototype), 'open', this).call(this);
      if (this.inputStream) {
        this.inputStream.pipe(this.parser).pipe(this);
      }
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl(chunk) {
      return new _url.Url(chunk);
    }
  }]);

  return CsvSource;
}(_sitemap_transformer.SitemapTransformer);