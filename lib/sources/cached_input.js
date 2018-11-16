import {Readable} from 'stream';
import {config} from '../config';
import fs from 'fs';

export class CachedInput extends Readable {
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
    }
  }
  _read(size) {
    if (!this.input) {
      this.input = this.inputCreate().on('data', (data) => {
        let pause = !this.push(data);
        /*if (pause) {
          config.log.trace("WE MUST PAUSE AND ARE IGNORING IT, MAYBE WE WILL HANG");
        }*/
      }).on('end', () => {
        this.push(null);
      }).on('error', (err) => {
        this.emit('error', err);
      });
    }
  }
}
