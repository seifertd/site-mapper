import {SitemapTransformer} from './sitemap_transformer';
import {Url} from '../url';
import {config} from '../config';
import {extend} from 'underscore';
const libxml = require('libxmljs');

const DEFAULT_OPTIONS = {
  urlTag: 'url',
  urlAttributes: {
    'lastmod': 'lastModified',
    'changefreq': 'changeFrequency',
    'priority': 'priority',
    'loc': 'url'
  }
};
export class XmlSource extends SitemapTransformer {
  constructor(options) {
    super(options);
    let myConfig = extend({}, DEFAULT_OPTIONS, options.options);
    this.parser = new libxml.SaxPushParser();
    this.parser.on("startElementNS", (element) => {
      if (element === myConfig.urlTag) {
        this.url = {};
      } else if (this.url) {
        this.url.nextAttribute = element;
      }
    }).on("endElementNS", (element) => {
      if (element === myConfig.urlTag) {
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
    }).on("characters", (text) => {
      if (this.url && this.url.nextAttribute) {
        let urlAttr = myConfig.urlAttributes[this.url.nextAttribute];
        if (urlAttr) {
          this.url[urlAttr] = `${this.url[urlAttr] || ''}${text}`.trim();
        }
      }
    }).on("error", (err) => {
      this.emit("error", err);
    });
  }
  _transform(chunk, encoding, callback) {
    this.parser.push(chunk);
    callback();
  }
  open() {
    super.open();
    if (this.inputStream) {
      this.inputStream.pipe(this);
    }
  }
}
