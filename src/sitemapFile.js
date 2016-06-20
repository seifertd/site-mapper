const Transform = require('stream').Transform;
const fs = require('fs');
const zlib = require('zlib');
import {escapeXmlValue} from './xml_escape';
import {config} from './config'

export class SitemapFile extends Transform {
  constructor({location, fileName}) {
    super({objectMode: true});
    this.location = location;
    this.fileName = fileName;
    this.gzipDone = false;
    this.fileDone = false;
    this.urlCount = 0;
  }
  open() {
    config.log.trace(`Opening sitemap ${this.fileName}`);
    this.gzipper = zlib.createGzip().on('finish', () => {this.gzipDone = true;});
    this.file = fs.createWriteStream(this.fileName).on('finish', () => {this.fileDone = true;});
    this.output = this.pipe(this.gzipper).pipe(this.file).on('error', (err) => {
      this.emit("error", err);
    });
    this.gzipper.write(config.sitemapHeader);
  }
  _transform(url, encoding, callback) {
    if (typeof url === "string") {
      this.push(url);
    } else {
      this.push(url.toXml());
      this.urlCount += 1;
    }
    callback();
  }
  toIndexXml() {
    return `<sitemap><loc>${escapeXmlValue(this.location)}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;
  }
  isDrained() {
    return this.gzipDone && this.fileDone;
  }
  close() {
    this.write("</urlset>");
    this.end();
  }
}
