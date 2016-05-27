'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PaginatedHttpInput = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('stream');

var _underscore = require('underscore');

var _config = require('../config');

var _iconvLite = require('iconv-lite');

var _iconvLite2 = _interopRequireDefault(_iconvLite);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_PAGINATION = {
  page: 'page',
  per: 'per',
  perPage: 100,
  increment: 1,
  start: 1
};

var PaginatedHttpInput = exports.PaginatedHttpInput = function (_Readable) {
  _inherits(PaginatedHttpInput, _Readable);

  function PaginatedHttpInput(options) {
    _classCallCheck(this, PaginatedHttpInput);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PaginatedHttpInput).call(this));

    _this.baseUrl = _url2.default.parse(options.url, true);
    _this.pagination = (0, _underscore.extend)({}, DEFAULT_PAGINATION, options.pagination);
    _this.format = options.format;
    _this.stop = options.stop;

    _this.requestState = {
      firstRequest: true,
      started: false,
      page: _this.pagination.start,
      done: false,
      paused: false,
      amountRead: 0,
      totalAvailable: 0,
      current: null
    };
    return _this;
  }

  _createClass(PaginatedHttpInput, [{
    key: '_startNextRequest',
    value: function _startNextRequest() {
      var _this2 = this;

      var newUrl = (0, _underscore.extend)({}, this.baseUrl);
      var s = this.requestState;
      newUrl.query[this.pagination.page] = s.page;
      newUrl.query[this.pagination.per] = this.pagination.perPage;
      // WTF?
      delete newUrl.search;
      var url = _url2.default.format(newUrl);
      _request2.default.get({ uri: url, encoding: 'binary' }).on('response', function (response) {
        _config.config.log.trace('URL: ' + url + ' => ' + response.statusCode + ' LENGTH: ' + response.headers['content-length']);
        try {
          s.totalAvailable = parseFloat(response.headers['content-length']);
        } catch (err) {
          _config.config.log.error(err, "Missing content length header, total length unknown");
          s.totalAvailable = 'UNK';
        }
        s.amountRead = 0;
        s.current = response;
      }).on('error', function (err) {
        _config.config.log.error(err, "Error in PaginatedHttpInput");
        _this2.emit("error", err);
      }).on("end", function () {
        if (!s.done) {
          _config.config.log.trace('Finished request, read ' + s.amountRead + '/' + s.totalAvailable);
          s.page += _this2.pagination.increment;
          s.current = null;
          s.started = false;
          if (_this2.format == 'json') {
            _this2.push(',');
          }
        }
      }).on("data", function (data) {
        if (data && _this2.stop && _this2.stop.string && data.indexOf(_this2.stop.string) != -1) {
          s.done = true;
        }
        s.paused = !_this2.push(data);
        s.amountRead += data ? data.length : 0;
        //config.log.trace(`GOT DATA: READ: ${s.amountRead}/${s.totalAvailable}, PAUSED: ${s.paused}`);
        if (s.paused && !s.done) {
          // TODO: Handle pausing
          _config.config.log.warn(' -> Pausing, this will probably cause a hang, please report a bug');
          s.current.pause();
        }
      });
    }
  }, {
    key: '_read',
    value: function _read(size) {
      var s = this.requestState;
      if (s.done) {
        if (this.format == 'json') {
          this.push("]");
        }
        this.push(null);
        return;
      }
      if (s.firstRequest) {
        if (this.format == 'json') {
          this.push("[");
        }
        s.firstRequest = false;
      }
      if (!s.current && !s.started) {
        s.started = true;
        this._startNextRequest();
        return;
      }
    }
  }]);

  return PaginatedHttpInput;
}(_stream.Readable);