'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsonFilter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('stream');

var _config = require('../config');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var JsonFilter = exports.JsonFilter = function (_Transform) {
  _inherits(JsonFilter, _Transform);

  function JsonFilter(_ref) {
    var filter = _ref.filter;

    _classCallCheck(this, JsonFilter);

    var _this = _possibleConstructorReturn(this, (JsonFilter.__proto__ || Object.getPrototypeOf(JsonFilter)).call(this, { objectMode: true }));

    if (typeof filter == "function") {
      _this.checker = filter;
    } else if (filter instanceof RegExp) {
      _this.regex = filter;
      _this.checker = _this.pattern;
    } else {
      _this.checker = _this.allowAll;
    }
    _this.stack = [];
    _this.inArray = false;
    _this.descending = false;
    return _this;
  }

  _createClass(JsonFilter, [{
    key: 'pattern',
    value: function pattern(path, event) {
      path = path.join('.');
      return path.match(this.regex);
    }
  }, {
    key: 'allowAll',
    value: function allowAll(path, event) {
      return true;
    }
  }, {
    key: '_transform',
    value: function _transform(object, encoding, callback) {
      //config.log.trace(`GOT OBJECT, regex ${this.regex}`, object);
      switch (object.name) {
        case 'keyValue':
          this.stack.push(object.value);
          this.descending = false;
          break;
        case 'endKey':
          if (!this.descending) {
            this.stack.pop();
          }
          break;
        case 'startObject':
          this.descending = true;
          break;
        case 'startArray':
          this.inArray = true;
          this.stack.push(0);
          break;
        case "endObject":
          if (this.stack.length > 0 && !this.descending) {
            this.stack.pop();
          }
        case "endString":
        case "endNumber":
        case "nullValue":
        case "trueValue":
        case "falseValue":
          this.descending = false;
          if (this.inArray) {
            var index = this.stack.pop();
            this.stack.push(typeof index == "number" ? index + 1 : index);
          }
          break;
        case "endArray":
          this.descending = false;
          this.stack.pop();
          break;
      }
      if (this.checker(this.stack, object)) {
        this.push(object);
      }
      callback();
    }
  }]);

  return JsonFilter;
}(_stream.Transform);