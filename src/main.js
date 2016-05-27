import {config} from './config';
import {SiteMapper} from './site_mapper';
import * as sources from './sources';
import {generateSitemaps} from './generateSitemaps';
import {extend} from 'underscore';
import util from 'util';

var toExport = {config, SiteMapper, generateSitemaps};
toExport = extend(toExport, sources);

/*
config.log.debug({sources}, "Source Classes");
config.log.debug({exports: toExport}, "Exporting site-mapper");
config.log.debug(`addAppSpecific: ${util.inspect(config.addAppSpecific)}`);
*/

module.exports = toExport;
