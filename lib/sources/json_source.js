const SitemapTransformer = require('./sitemap_transformer');
const Url = require('../url');
const {parser} = require('stream-json');
const pick = require('stream-json/filters/pick.js');
const streamValues = require('stream-json/streamers/stream-values.js');
const streamArray = require('stream-json/streamers/stream-array.js');

const isMatchAll = filter => !filter || (filter instanceof RegExp && filter.source === '.*');

module.exports = class JsonSource extends SitemapTransformer {
  constructor(config) {
    super(config);
    this.transformer = config.options && config.options.transformer;
    this.stringArray = config.options && config.options.stringArray;
    this.filterOption = config.options && config.options.filter;
  }
  open() {
    super.open();
    if (this.inputStream) {
      const propagate = err => this.emit('error', err);
      const p = parser.asStream();
      p.on('error', propagate);
      this.inputStream.pipe(p);

      if (isMatchAll(this.filterOption)) {
        const sa = streamArray.asStream();
        sa.on('error', propagate);
        p.pipe(sa).pipe(this);
      } else {
        const pk = pick.asStream({filter: this.filterOption});
        pk.on('error', propagate);
        const sv = streamValues.asStream();
        sv.on('error', propagate);
        p.pipe(pk).pipe(sv).pipe(this);
      }
    }
  }
  _transform({value}, encoding, callback) {
    if (this.stringArray) {
      value = {url: value};
    }
    if (this.transformer) {
      value = this.transformer(value);
    }
    try {
      const url = this._decorateUrl(new Url(value));
      if (url) this.push(url);
    } catch (err) {
      this.emit('error', err);
    }
    callback();
  }
};
