import {SitemapTransformer} from './sitemap_transformer';
import {Url} from '../url';
import {config} from '../config';
import {extend} from 'underscore';
const libxml = require('libxmljs');

const DEFAULT_OPTIONS = {
  urlTag: 'url'
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
            config.log.trace(`PARSING ${this.url.priority} as a float`);
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
        switch(this.url.nextAttribute) {
          case 'lastmod':
            this.url.lastModified = `${this.url.lastModified || ''}${text}`.trim();
            break;
          case 'changefreq':
            this.url.changeFrequency = `${this.url.changeFrequency || ''}${text}`.trim();
            break;
          case 'priority':
            this.url.priority = `${this.url.priority || ''}${text}`.trim();
            break;
          case 'loc':
            this.url.url = `${this.url.url || ''}${text}`.trim();
            break;
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
