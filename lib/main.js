const {config} = require('./config');
const SiteMapper = require('./site_mapper');
const sources = require('./sources');
const {generateSitemaps} = require('./generateSitemaps');
const util = require('util');

let toExport = {config, SiteMapper, generateSitemaps};
toExport = Object.assign(toExport, sources);

/*
config.log.debug({sources}, "Source Classes");
config.log.debug({exports: toExport}, "Exporting site-mapper");
config.log.debug(`addAppSpecific: ${util.inspect(config.addAppSpecific)}`);
*/

module.exports = toExport;
