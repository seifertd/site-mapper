'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultipleHttpInput = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('stream');

var _config = require('../config');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _underscore = require('underscore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MultipleHttpInput = exports.MultipleHttpInput = function (_Readable) {
  _inherits(MultipleHttpInput, _Readable);

  function MultipleHttpInput(options) {
    _classCallCheck(this, MultipleHttpInput);

    var _this = _possibleConstructorReturn(this, (MultipleHttpInput.__proto__ || Object.getPrototypeOf(MultipleHttpInput)).call(this));

    _this.urls = options.urls.slice();
    _this.error = false;
    _this.httpOptions = options.httpOptions;
    _this.format = options.format;
    _this.stop = options.stop;
    _this.state = {
      firstRequest: true
    };
    if (!_this.urls || _this.urls.length == 0) {
      throw new Error("No urls specified for MultipleHttpInput: ", _this.urls);
    }
    _this.input = null;
    return _this;
  }

  _createClass(MultipleHttpInput, [{
    key: '_startNextRequest',
    value: function _startNextRequest() {
      var _this2 = this;

      if (this.error) {
        return;
      }
      var url = this.urls.shift();
      if (url) {
        this.input = _request2.default.get((0, _underscore.extend)({}, _config.config.httpOptions, this.httpOptions, { uri: url })).on('response', function (response) {
          _config.config.log.trace('URL: ' + url + ' => ' + response.statusCode + ' LENGTH: ' + response.headers['content-length']);
          if (response.statusCode >= 300) {
            _this2.error = true;
            _this2.emit('error', new Error('Non 2XX response from ' + url + ': ' + response.statusCode));
          }
        }).on('data', function (data) {
          if (_this2.state.firstRequest) {
            if (_this2.format == 'json') {
              _this2.push("[");
            }
            _this2.state.firstRequest = false;
          }
          var paused = !_this2.push(data);
          if (paused) {
            _config.config.log.warn("We should pause, but are not");
          }
        }).on('end', function () {
          if (_this2.urls.length > 0 && _this2.format == 'json') {
            _this2.push(",");
          }
          _this2._startNextRequest();
        }).on('error', function (err) {
          _this2.error = true;
          _this2.emit('error', err);
        });
      } else {
        if (this.format == 'json') {
          this.push("]");
        }
        this.push(null);
      }
    }
  }, {
    key: '_read',
    value: function _read(size) {
      if (!this.input) {
        this._startNextRequest();
      }
    }
  }]);

  return MultipleHttpInput;
}(_stream.Readable);