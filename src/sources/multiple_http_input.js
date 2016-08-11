import {Readable} from 'stream';
import {config} from '../config';
import request from 'request';
import {extend} from 'underscore';

export class MultipleHttpInput extends Readable {
  constructor(options) {
    super();
    this.urls = options.urls.slice();
    this.error = false;
    this.httpOptions = options.httpOptions;
    if (!this.urls || this.urls.length == 0) {
      throw new Error("No urls specified for MultipleHttpInput: ", this.urls);
    }
    this.input = null;
  }
  _startNextRequest() {
    if (this.error) {
      return;
    }
    let url = this.urls.shift();
    if (url) {
      this.input = request.get(extend({}, config.httpOptions, this.httpOptions, {uri: url})).on('response', (response) => {
        config.log.trace(`URL: ${url} => ${response.statusCode} LENGTH: ${response.headers['content-length']}`);
        if (response.statusCode >= 300) {
          this.error = true;
          this.emit('error', new Error(`Non 2XX response from ${url}: ${response.statusCode}`));
        }
      }).on('data', (data) => {
        let paused = !this.push(data);
        if (paused) {
          config.log.warn("We should pause, but are not");
        }
      }).on('end', () => {
        this._startNextRequest();
      }).on('error', (err) => {
        this.error = true;
        this.emit('error', err);
      });
    } else {
      this.push(null);
    }
  }
  _read(size) {
    if (!this.input) {
      this._startNextRequest();
    }
  }
}
