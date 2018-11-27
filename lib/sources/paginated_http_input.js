const {Readable} = require('stream');
const {config} = require('../config');
const {extend} = require('lodash');
const iconv = require('iconv-lite');
const request = require('request');
const URL = require('url');

const DEFAULT_PAGINATION = {
  page: 'page',
  per: 'per',
  perPage: 100,
  increment: 1,
  start: 1
}

export class PaginatedHttpInput extends Readable {
  constructor(options) {
    super();
    this.baseUrl = URL.parse(options.url, true);
    this.pagination = extend({}, DEFAULT_PAGINATION, options.pagination);
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
    let newUrl = extend({}, this.baseUrl);
    let s = this.requestState;
    newUrl.query[this.pagination.page] = s.page;
    newUrl.query[this.pagination.per] = this.pagination.perPage;
    // WTF?
    delete newUrl.search;
    let url = URL.format(newUrl);
    request.get(extend({encoding: 'binary'}, config.httpOptions, this.httpOptions, {uri: url})).on('response', (response) => {
      config.log.trace(`URL: ${url} => ${response.statusCode} LENGTH: ${response.headers['content-length']}`);
      try {
        s.totalAvailable = parseFloat(response.headers['content-length']);
      } catch (err) {
        config.log.error(err, "Missing content length header, total length unknown");
        s.totalAvailable = 'UNK';
      }
      s.amountRead = 0;
      s.current = response;
    }).on('error', (err) => {
      config.log.error(err, "Error in PaginatedHttpInput");
      this.emit("error", err);
    }).on("end", () => {
      if (!s.done) {
        config.log.trace(`Finished request, read ${s.amountRead}/${s.totalAvailable}`);
        s.page += this.pagination.increment;
        s.current = null;
        s.started = false;
        if (this.format == 'json') {
          this.push(',');
        }
      }
    }).on("data", (data) => {
      if (data && this.stop && this.stop.string && data.indexOf(this.stop.string) != -1) {
        s.done = true;
      }
      s.paused = !this.push(data);
      s.amountRead += (data ? data.length : 0);
      //config.log.trace(`GOT DATA: READ: ${s.amountRead}/${s.totalAvailable}, PAUSED: ${s.paused}`);
      if (s.paused && !s.done) {
        // TODO: Handle pausing
        config.log.warn(' -> Pausing, this will probably cause a hang, please report a bug');
        s.current.pause();
      }
    });
  }
  _read(size) {
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
