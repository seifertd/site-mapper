"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Url = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _xml_escape = require("./xml_escape");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NOW = new Date();

var Url = exports.Url = function () {
  function Url(attributes) {
    _classCallCheck(this, Url);

    Object.assign(this, attributes);
    if (this.lastModified && !(this.lastModified instanceof Date)) {
      this.lastModified = new Date(this.lastModified);
    } else if (!this.lastModified) {
      this.lastModified = NOW;
    }
  }

  _createClass(Url, [{
    key: "toXml",
    value: function toXml() {
      var xml = "<url><loc>" + (0, _xml_escape.escapeXmlValue)(this.url) + "</loc>";
      if (this.lastModified) {
        xml += "<lastmod>" + this.lastModified.toISOString() + "</lastmod>";
      }
      if (this.changeFrequency) {
        xml += "<changefreq>" + this.changeFrequency + "</changefreq>";
      }
      if (this.priority) {
        xml += "<priority>" + this.priority + "</priority>";
      }
      if (this.imageUrl) {
        xml += "<image:image><image:loc>" + (0, _xml_escape.escapeXmlValue)(this.imageUrl) + "</image:loc></image:image>";
      }
      if (this.linkTags) {
        this.linkTags.forEach(function (linkTag) {
          xml += "<xhtml:link rel=\"" + (0, _xml_escape.escapeXmlValue)(linkTag.rel) + "\" href=\"" + (0, _xml_escape.escapeXmlValue)(linkTag.href) + "\"/>";
        });
      }
      xml += "</url>";
      return xml;
    }
  }]);

  return Url;
}();