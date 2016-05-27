'use strict';

var _config = require('./config');

var _site_mapper = require('./site_mapper');

var _sources = require('./sources');

var sources = _interopRequireWildcard(_sources);

var _generateSitemaps = require('./generateSitemaps');

var _underscore = require('underscore');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var toExport = { config: _config.config, SiteMapper: _site_mapper.SiteMapper, generateSitemaps: _generateSitemaps.generateSitemaps };
toExport = (0, _underscore.extend)(toExport, sources);

/*
config.log.debug({sources}, "Source Classes");
config.log.debug({exports: toExport}, "Exporting site-mapper");
config.log.debug(`addAppSpecific: ${util.inspect(config.addAppSpecific)}`);
*/

module.exports = toExport;