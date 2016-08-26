'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsonSource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _stream = require('stream');

var _sitemap_transformer = require('./sitemap_transformer');

var _url = require('../url');

var _config = require('../config');

var _underscore = require('underscore');

var _Parser = require('stream-json/Parser');

var _Parser2 = _interopRequireDefault(_Parser);

var _Streamer = require('stream-json/Streamer');

var _Streamer2 = _interopRequireDefault(_Streamer);

var _json_filter = require('./json_filter');

var _Packer = require('stream-json/Packer');

var _Packer2 = _interopRequireDefault(_Packer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var JsonSource = exports.JsonSource = function (_SitemapTransformer) {
  _inherits(JsonSource, _SitemapTransformer);

  function JsonSource(config) {
    _classCallCheck(this, JsonSource);

    var _this = _possibleConstructorReturn(this, (JsonSource.__proto__ || Object.getPrototypeOf(JsonSource)).call(this, config));

    _this.transformer = config.options && config.options.transformer;
    _this.stringArray = config.options && config.options.stringArray;
    _this.parser = new _Parser2.default();
    _this.parser.on('error', function (err) {
      _this.emit('error', err);
    });
    _this.streamer = new _Streamer2.default();
    _this.packer = new _Packer2.default({ packKeys: true, packStrings: true, packNumbers: true });
    _this.filter = new _json_filter.JsonFilter({ filter: config.options.filter });
    _this.stack = [];
    _this.currentKey = [];
    return _this;
  }

  _createClass(JsonSource, [{
    key: 'open',
    value: function open() {
      _get(JsonSource.prototype.__proto__ || Object.getPrototypeOf(JsonSource.prototype), 'open', this).call(this);
      if (this.inputStream) {
        this.inputStream.pipe(this.parser).pipe(this.streamer).pipe(this.packer).pipe(this.filter).pipe(this);
      }
    }
  }, {
    key: 'disposeObject',
    value: function disposeObject(object) {
      var util = require('util');
      //config.log.trace(`Disposing of object: ${util.inspect(object)}, stack length: ${this.stack.length}`);
      if (this.stack.length > 0) {
        var parentObject = this.stack[this.stack.length - 1];
        if (parentObject instanceof Array) {
          parentObject.push(object);
        } else {
          parentObject[this.currentKey.pop()] = object;
        }
        //config.log.trace(`CURRENT OBJECT: ${util.inspect(parentObject)}`);
      } else {
        //config.log.trace(`CURRENT OBJECT: ${util.inspect(parentObject)}`);
        if (this.transformer) {
          object = this.transformer(object);
        }
        try {
          var url = this._decorateUrl(new _url.Url(object));
          if (url) {
            this.push(url);
          } else {
            //config.log.trace(`After transform and decoration ${util.inspect(object)} => ${util.inspect(url)}`);
          }
        } catch (err) {
          this.emit('error', err);
        }
      }
    }
  }, {
    key: '_transform',
    value: function _transform(object, encoding, callback) {
      var util = require('util');
      //config.log.trace(`Got object ${util.inspect(object)}, stack length: ${this.stack.length}`);
      switch (object.name) {
        case 'startObject':
          this.stack.push({});
          break;
        case 'startArray':
          if (this.stack.length > 0) {
            this.stack.push([]);
          }
          this.currentArray = true;
          break;
        case 'endArray':
          if (this.stack.length > 1) {
            this.disposeObject(this.stack.pop());
          }
          this.currentArray = false;
          break;
        case 'endObject':
          this.disposeObject(this.stack.pop());
          break;
        case 'keyValue':
          this.currentKey.push(object.value);
          break;
        case 'stringValue':
          if (this.stringArray) {
            object.value = { url: object.value };
          }
        case 'trueValue':
        case 'falseValue':
        case 'nullValue':
          this.disposeObject(object.value);
          break;
        case 'numberValue':
          this.disposeObject(parseFloat(object.value));
          break;
      }
      callback();
    }
  }]);

  return JsonSource;
}(_sitemap_transformer.SitemapTransformer);