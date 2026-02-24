const SitemapTransformer = require('./sitemap_transformer');
const {Readable} = require('stream');
const Url = require('../url');

module.exports = class StaticSetSource extends SitemapTransformer {
  constructor(config) {
    if (!config.input) {
      config.input = {};
    }
    config.input.stream = Readable.from(config.options.urls);
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
