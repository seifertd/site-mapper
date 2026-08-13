const {Readable} = require('stream');
const {finished} = require('stream/promises');
const {config} = require('../config');
const fs = require('fs');

module.exports = class CachedInput extends Readable {
  constructor(inputCreate, options) {
    super();
    this.output = null;
    this.cacheFile = options.cacheFile;
    this.inputCreate = inputCreate;
    if (fs.existsSync(this.cacheFile)) {
      let stats = fs.statSync(this.cacheFile);
      let lastMod = new Date(stats.mtime);
      let now = new Date();
      let maxAge = options.maxAge || 86400000;
      if (stats.size > 0 && lastMod.getTime() + maxAge > now.getTime()) {
        config.log.debug(`Using cached data at ${this.cacheFile}`);
        this.inputCreate = () => {
          return fs.createReadStream(this.cacheFile);
        }
      } else {
        this.output = fs.createWriteStream(this.cacheFile);
        config.log.debug(`Cached data has expired or is empty, regenerating ${this.cacheFile}`);
      }
    } else {
      this.output = fs.createWriteStream(this.cacheFile);
      config.log.debug(`Cached data does not exist, regenerating ${this.cacheFile}`);
    }
    if (this.output) {
      this.pipe(this.output);
      // Consumers reach 'end' as soon as the data is read, but the cache file
      // is opened truncated and may still be buffered at that point. Await this
      // to know the cache file is complete on disk. Write failures surface on
      // the 'error' event, matching how input failures are reported below.
      this.cacheWritten = finished(this.output).catch((err) => {
        this.emit('error', err);
      });
    } else {
      // Reading from an existing cache: nothing is written.
      this.cacheWritten = Promise.resolve();
    }
  }
  _read(_size) {
    if (!this.input) {
      this.input = this.inputCreate().on('data', (data) => {
        this.push(data);
      }).on('end', () => {
        this.push(null);
      }).on('error', (err) => {
        this.emit('error', err);
      });
    }
  }
}
