const {config} = require('./config');
const SiteMapper = require('./site_mapper');
const async = require('async');
const {each} = require('lodash');
/*
import {config} from './config';
import {SiteMapper} from './site_mapper';
import async from 'async';
import {each} from 'lodash';
*/

var generateSitemaps = function(configOverrides, done) {
  // Optional argument handling
  if (typeof(configOverrides) === "function") {
    done = configOverrides;
    configOverrides = {};
  }
  let tasks = [];
  let siteMappers = [];
  config.addAppSpecific();

  config.addOverrides(configOverrides);

  if (!config.sitemaps || config.sitemaps.length <= 0) {
    config.log.error("No sitemaps in config");
    if (done) {
      done(new Error("No sitemaps in config"));
    }
    return;
  }
  each(config.sitemaps, (sitemapConfig, sitemapName) => {
    tasks.push((taskCb) => {
      config.log.info(`Generating sitemaps for configuration ${sitemapName}`);
      var siteMapper = new SiteMapper(sitemapConfig);
      siteMapper.generateSitemap(taskCb);
      siteMappers.push(siteMapper);
    });
  });

  async.series(tasks, (err) => {
    if (err) {
      config.log.error(err, "Error generating sitemaps");
    } else {
      config.log.info("Done generating sitemaps");
    }
    if (done) {
      done(err, siteMappers);
    }
  });
};

module.exports = { generateSitemaps };
