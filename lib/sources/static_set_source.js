'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StaticSetSource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _sitemap_transformer = require('./sitemap_transformer');

var _streamArray = require('stream-array');

var _streamArray2 = _interopRequireDefault(_streamArray);

var _url = require('../url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var StaticSetSource = exports.StaticSetSource = function (_SitemapTransformer) {
  _inherits(StaticSetSource, _SitemapTransformer);

  function StaticSetSource(config) {
    _classCallCheck(this, StaticSetSource);

    if (!config.input) {
      config.input = {};
    }
    config.input.stream = (0, _streamArray2.default)(config.options.urls);
    return _possibleConstructorReturn(this, Object.getPrototypeOf(StaticSetSource).call(this, config));
  }

  _createClass(StaticSetSource, [{
    key: 'open',
    value: function open() {
      _get(Object.getPrototypeOf(StaticSetSource.prototype), 'open', this).call(this);
      this.inputStream.pipe(this);
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl(chunk) {
      return new _url.Url({ url: chunk });
    }
  }]);

  return StaticSetSource;
}(_sitemap_transformer.SitemapTransformer);