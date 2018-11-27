const SitemapTransformer = require('./sitemap_transformer');
const streamify = require('stream-array');
const Url = require('../url');

module.exports = class StaticSetSource extends SitemapTransformer {
  constructor(config) {
    if (!config.input) {
      config.input = {};
    }
    config.input.stream = streamify(config.options.urls);
    super(config);
  }
  open() {
    super.open();
    this.inputStream.pipe(this);
  }
  buildUrl(chunk) {
    return new Url({url: chunk});
  }
}
