import {SitemapTransformer} from './sitemap_transformer';
import {Url} from '../url';
import {extend} from 'underscore';
const csv = require('csv');

const DEFAULT_OPTIONS = {
  columns: ['url', 'imageUrl', 'lastModified', 'comments'],
  relax_column_count: true
};
export class CsvSource extends SitemapTransformer {
  constructor(config) {
    super(config);
    let csvOptions = extend({}, DEFAULT_OPTIONS, config.options);
    this.parser = csv.parse(csvOptions);
    this.parser.on("error", (err) => {
      this.emit('error', err);
    });
  }
  open() {
    super.open();
    if (this.inputStream) {
      this.inputStream.pipe(this.parser).pipe(this);
    }
  }
  buildUrl(chunk) {
    return new Url(chunk);
  }
}
