'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CachedInput = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('stream');

var _config = require('../config');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CachedInput = exports.CachedInput = function (_Readable) {
  _inherits(CachedInput, _Readable);

  function CachedInput(inputCreate, options) {
    _classCallCheck(this, CachedInput);

    var _this = _possibleConstructorReturn(this, (CachedInput.__proto__ || Object.getPrototypeOf(CachedInput)).call(this));

    _this.output = null;
    _this.cacheFile = options.cacheFile;
    _this.inputCreate = inputCreate;
    if (_fs2.default.existsSync(_this.cacheFile)) {
      var stats = _fs2.default.statSync(_this.cacheFile);
      var lastMod = new Date(stats.mtime);
      var now = new Date();
      var maxAge = options.maxAge || 86400000;
      if (stats.size > 0 && lastMod.getTime() + maxAge > now.getTime()) {
        _config.config.log.debug('Using cached data at ' + _this.cacheFile);
        _this.inputCreate = function () {
          return _fs2.default.createReadStream(_this.cacheFile);
        };
      } else {
        _this.output = _fs2.default.createWriteStream(_this.cacheFile);
        _config.config.log.debug('Cached data has expired or is empty, regenerating ' + _this.cacheFile);
      }
    } else {
      _this.output = _fs2.default.createWriteStream(_this.cacheFile);
      _config.config.log.debug('Cached data does not exist, regenerating ' + _this.cacheFile);
    }
    if (_this.output) {
      _this.pipe(_this.output);
    }
    return _this;
  }

  _createClass(CachedInput, [{
    key: '_read',
    value: function _read(size) {
      var _this2 = this;

      if (!this.input) {
        this.input = this.inputCreate().on('data', function (data) {
          var pause = !_this2.push(data);
          /*if (pause) {
            config.log.trace("WE MUST PAUSE AND ARE IGNORING IT, MAYBE WE WILL HANG");
          }*/
        }).on('end', function () {
          _this2.push(null);
        }).on('error', function (err) {
          _this2.emit('error', err);
        });
      }
    }
  }]);

  return CachedInput;
}(_stream.Readable);