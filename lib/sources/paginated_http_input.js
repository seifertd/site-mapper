const {Readable} = require('stream');
const {config} = require('../config');

const DEFAULT_PAGINATION = {
  page: 'page',
  per: 'per',
  perPage: 100,
  increment: 1,
  start: 1
}

module.exports = class PaginatedHttpInput extends Readable {
  constructor(options) {
    super();
    this.baseUrl = new URL(options.url);
    this.pagination = Object.assign({}, DEFAULT_PAGINATION, options.pagination);
    this.httpOptions = options.httpOptions;
    this.format = options.format;
    this.stop = options.stop;

    this.requestState = {
      firstRequest: true,
      started: false,
      page: this.pagination.start,
      done: false,
      paused: false,
      amountRead: 0,
      totalAvailable: 0,
      current: null
    };
  }
  _startNextRequest() {
    const newUrl = new URL(this.baseUrl.toString());
    const s = this.requestState;
    newUrl.searchParams.set(this.pagination.page, s.page);
    newUrl.searchParams.set(this.pagination.per, this.pagination.perPage);
    const url = newUrl.toString();

    const headers = Object.assign({}, config.httpOptions && config.httpOptions.headers, this.httpOptions && this.httpOptions.headers);
    fetch(url, { headers })
      .then(res => {
        config.log.trace(`URL: ${url} => ${res.status} LENGTH: ${res.headers.get('content-length')}`);
        try {
          s.totalAvailable = parseFloat(res.headers.get('content-length'));
        } catch (err) {
          config.log.error(err, "Missing content length header, total length unknown");
          s.totalAvailable = 'UNK';
        }
        s.amountRead = 0;
        return Readable.fromWeb(res.body);
      })
      .then(stream => {
        s.current = stream;
        stream.on('data', (data) => {
          if (data && this.stop && this.stop.string && data.indexOf(this.stop.string) != -1) {
            s.done = true;
          }
          s.paused = !this.push(data);
          s.amountRead += (data ? data.length : 0);
          if (s.paused && !s.done) {
            config.log.warn(' -> Pausing, this will probably cause a hang, please report a bug');
            s.current.pause();
          }
        }).on('end', () => {
          if (!s.done) {
            config.log.trace(`Finished request, read ${s.amountRead}/${s.totalAvailable}`);
            s.page += this.pagination.increment;
            s.current = null;
            s.started = false;
            if (this.format == 'json') {
              this.push(',');
            }
          }
        }).on('error', (err) => {
          config.log.error(err, "Error in PaginatedHttpInput");
          this.emit("error", err);
        });
      })
      .catch(err => {
        config.log.error(err, "Error in PaginatedHttpInput");
        this.emit("error", err);
      });
  }
  _read(_size) {
    let s = this.requestState;
    if (s.done) {
      if (this.format == 'json') {
        this.push("]");
      }
      this.push(null);
      return;
    }
    if (s.firstRequest) {
      if (this.format == 'json') {
        this.push("[");
      }
      s.firstRequest = false;
    }
    if (!s.current && !s.started) {
      s.started = true;
      this._startNextRequest();
      return;
    }
  }
}
