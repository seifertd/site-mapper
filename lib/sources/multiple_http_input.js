const {Readable} = require('stream');
const {config} = require('../config');

module.exports = class MultipleHttpInput extends Readable {
  constructor(options) {
    super();
    this.urls = options.urls.slice();
    this.error = false;
    this.httpOptions = options.httpOptions;
    this.format = options.format;
    this.stop = options.stop;
    this.state = {
      firstRequest: true
    };
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
      const headers = Object.assign({}, config.httpOptions && config.httpOptions.headers, this.httpOptions && this.httpOptions.headers);
      fetch(url, { headers })
        .then(res => {
          config.log.trace(`URL: ${url} => ${res.status} LENGTH: ${res.headers.get('content-length')}`);
          if (res.status >= 300) {
            this.error = true;
            this.emit('error', new Error(`Non 2XX response from ${url}: ${res.status}`));
            return;
          }
          if (this.state.firstRequest) {
            if (this.format == 'json') {
              this.push("[");
            }
            this.state.firstRequest = false;
          }
          const stream = Readable.fromWeb(res.body);
          stream.on('data', (data) => {
            let paused = !this.push(data);
            if (paused) {
              config.log.warn("We should pause, but are not");
            }
          }).on('end', () => {
            if (this.urls.length > 0 && this.format == 'json') {
              this.push(",");
            }
            this._startNextRequest();
          }).on('error', (err) => {
            this.error = true;
            this.emit('error', err);
          });
        })
        .catch(err => {
          this.error = true;
          this.emit('error', err);
        });
    } else {
      if (this.format == 'json') {
        this.push("]");
      }
      this.push(null);
    }
  }
  _read(_size) {
    if (!this.input) {
      this.input = true;
      this._startNextRequest();
    }
  }
}
