const {config} = require('./config');
const SiteMapper = require('./site_mapper');

const generateSitemaps = async function(configOverrides, done) {
  // Optional argument handling
  if (typeof(configOverrides) === "function") {
    done = configOverrides;
    configOverrides = {};
  }
  const siteMappers = [];
  config.addAppSpecific();
  config.addOverrides(configOverrides);

  if (!config.sitemaps || config.sitemaps.length <= 0) {
    const err = new Error("No sitemaps in config");
    config.log.error(err, "No sitemaps in config");
    if (done) { done(err); return; }
    throw err;
  }

  let caughtError = null;
  try {
    for (const [sitemapName, sitemapConfig] of Object.entries(config.sitemaps)) {
      config.log.info(`Generating sitemaps for configuration ${sitemapName}`);
      const siteMapper = new SiteMapper(sitemapConfig);
      await siteMapper.generateSitemap();
      siteMappers.push(siteMapper);
    }
    config.log.info("Done generating sitemaps");
  } catch (err) {
    config.log.error(err, "Error generating sitemaps");
    caughtError = err;
  }

  // Call done outside try-catch so exceptions from the callback propagate naturally
  if (done) {
    done(caughtError, caughtError ? undefined : siteMappers);
    return;
  }
  if (caughtError) throw caughtError;
  return siteMappers;
};

module.exports = { generateSitemaps };
