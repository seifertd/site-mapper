import {SitemapTransformer} from './sitemap_transformer';
import streamify from 'stream-array';
import {Url} from '../url';

export class StaticSetSource extends SitemapTransformer {
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
