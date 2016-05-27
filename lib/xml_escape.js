'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var escapeXmlValue = function escapeXmlValue(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

exports.escapeXmlValue = escapeXmlValue;