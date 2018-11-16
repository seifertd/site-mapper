import {SitemapTransformer} from './sitemap_transformer';
import {Url} from '../url';
import {config} from '../config';
import {extend} from 'lodash';
const sax = require('sax');

const DEFAULT_OPTIONS = {
  urlTag: 'url',
  urlAttributes: {
    'lastmod': 'lastModified',
    'changefreq': 'changeFrequency',
    'priority': 'priority',
    'loc': 'url'
  },
  parserOptions: {
    trim: true
  }
};
export class XmlSource extends SitemapTransformer {
  constructor(options) {
    super(options);
    let myConfig = extend({}, DEFAULT_OPTIONS, options.options);
    this.parser = sax.createStream(true, myConfig.parserOptions);
    this.parser.on("opentag", (element) => {
      if (element.name === myConfig.urlTag) {
        this.url = {};
      } else if (this.url) {
        this.url.nextAttribute = element.name;
      }
    }).on("closetag", (tagName) => {
      if (tagName === myConfig.urlTag) {
        try {
          delete this.url.nextAttribute;
          if (this.url.lastModified) {
            //config.log.trace(`PARSING ${this.url.lastModified} as a date`);
            this.url.lastModified = Date.parse(this.url.lastModified);
          }
          if (this.url.priority) {
            //config.log.trace(`PARSING ${this.url.priority} as a float`);
            this.url.priority = parseFloat(this.url.priority);
          }
          let url = this._decorateUrl(new Url(this.url));
          if (url) {
            this.push(url);
          }
        } catch (err) {
          this.emit("error", err);
        }
        this.url = null;
      }
    }).on("text", (text) => {
      if (this.url && this.url.nextAttribute) {
        let urlAttr = myConfig.urlAttributes[this.url.nextAttribute];
        if (urlAttr) {
          this.url[urlAttr] = `${this.url[urlAttr] || ''}${text}`;
        }
      }
    }).on("error", (err) => {
      this.emit("error", err);
    }).on("end", () => this.emit("end"));
  }
  _transform(chunk, encoding, callback) {
    this.parser.write(chunk);
    callback();
  }
  open() {
    super.open();
    if (this.inputStream) {
      this.inputStream.pipe(this);
    }
  }
}
