const Transform = require('stream').Transform;
const fs = require('fs');
const request = require('request');
const {extend} = require('underscore');
import {config} from '../config';
import {CachedInput} from './cached_input';

export class SitemapTransformer extends Transform {
  constructor(sourceConfig) {
    super({objectMode: true});
    config.log.debug("Initializing source", sourceConfig);
    if (sourceConfig.siteMap) {
      this.urlFormatter = sourceConfig.siteMap.urlFormatter;
      this.urlFilter = sourceConfig.siteMap.urlFilter;
      this.urlAugmenter = sourceConfig.siteMap.urlAugmenter;
      this.extraUrls = sourceConfig.siteMap.extraUrls;
      this.defaultPriority = sourceConfig.siteMap.priority;
      this.defaultChangeFrequency = sourceConfig.siteMap.changefreq;
      this.channel = sourceConfig.siteMap.channel;
      this.channelIsFunction = typeof this.channel === "function";
    }
    this.name = sourceConfig.name;
    this.inputConfig = sourceConfig.input;
    this.ignoreErrors = sourceConfig.ignoreErrors;
  }
  open() {
    this.inputStream = this.openInputStream(this.inputConfig);
    if (this.inputStream) {
      this.inputStream.on("error", (err) => { this.emit("error", err); });
    }
    //Handle extraUrls for the source
    if (this.extraUrls) {
      config.log.debug(`Pushing ${this.extraUrls.length} extraUrls`);
      this.extraUrls.forEach((extra) => {
        this.write(extra);
      });
      this.extraUrls = null;
    }
    return this;
  }
  buildUrl(chunk) {
    // subclasses must override
    throw new Error("SitemapTransformer subclasses must override buildUrl(chunk)");
  }
  channelForUrl(url) {
    if (this.channelIsFunction) {
      return this.channel(url);
    } else {
      return this.channel;
    }
  }
  openInputStream(inputOptions) {
    if (!inputOptions) {
      this.emit("error", new Error("config.input needs to be set"));
      return;
    }
    let input = () => {
      if (inputOptions.fileName) {
        config.log.debug(`Source ${this.name} opening file ${inputOptions.fileName}`)
        return fs.createReadStream(inputOptions.fileName, extend({encoding: "utf8"}, config.fileOptions, inputOptions.fileOptions));
      } else if (inputOptions.url) {
        config.log.debug(`Source ${this.name} opening url ${inputOptions.url}`)
        return request.get(extend({}, config.httpOptions, inputOptions.httpOptions, {uri: inputOptions.url}));
      } else if (inputOptions.stream) {
        return inputOptions.stream;
      } else {
        let util = require('util');
        this.emit('error', new Error(`config.input needs to have one of 'fileName', 'url', or 'stream': ${util.inspect(inputOptions)}`));
      }
    }
    if (inputOptions.cached) {
      return new CachedInput(input, inputOptions.cached);
    } else {
      return input();
    }
  }
  _transform(chunk, encoding, callback) {
    try {
      let url = this._decorateUrl(this.buildUrl(chunk));
      if (url) {
        this.push(url);
      }
    } catch (err) {
      this.emit("error", err);
    }
    callback();
  }
  _decorateUrl(url) {
    // Apply url formatter
    if (this.urlFormatter) {
      url.url = this.urlFormatter(url.url);
    }
    if (!this.urlFilter || !this.urlFilter(url)) {
      // apply transformer if available
      if (this.urlAugmenter) {
        this.urlAugmenter(url);
      }
      // apply defaults
      if (!url.priority) {
        url.priority = this.defaultPriority;
      }
      if (!url.changeFrequency) {
        url.changeFrequency = this.defaultChangeFrequency;
      }
      return url;
    }
    return null;
  }
  _flush(callback) {
    callback();
  }
}
