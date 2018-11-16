const Writable = require('stream').Writable;
import {SitemapFile} from './sitemapFile';
import {config} from './config';
const DEFAULTS = {
  maxUrlsPerFile: 50000
}

export class Sitemap extends Writable {
  constructor({source, sitemapConfig}) {
    super({objectMode: true});
    this.source = source;
    this.source.on("error", (err) => { this.emit("error", err); });
    this.sitemapConfig = sitemapConfig;
    this.baseUrl = `${sitemapConfig.sitemapRootUrl}${sitemapConfig.sitemapFileDirectory}`;
    this.directory = sitemapConfig.targetDirectory;
    this.urlCount = {};
    this.maxPerFile = this.sitemapConfig.maxUrlsPerFile || DEFAULTS.maxUrlsPerFile;
    this.files = {};
    this.pipeline = source.pipe(this);
    this.finished = false;
    this.on('finish', () => {
      this.finished = true;
      config.log.trace(`Pushed all urls for ${this.source.name}`);
    });
  }
  open() {
    this.source.open();
  }
  isFinished() {
    // Hasn't started yet
    if (!this.finished && Object.keys(this.files).length == 0) {
      return false;
    }
    if (Object.keys(this.files).length == 0 && this.finished) {
      // All urls filtered?
      return true;
    }
    return Object.keys(this.files).every((channel) => {
      let channelFiles = this.filesForChannel(channel) || [];
      return channelFiles.every((file) => {
        let drained = file.isDrained();
        if (drained) {
          file.end();
        }
        return drained;
      });
    });
  }
  allFiles() {
    return Object.keys(this.files).reduce((memo, channel) =>{
      return memo.concat(this.files[channel]);
    }, []);
  }
  filesForChannel(channel) {
    let channelFiles = this.files[channel];
    if (channelFiles === undefined) {
      channelFiles = this.files[channel] = [];
    }
    return channelFiles;
  }
  currentSitemapFile(channel) {
    if( this.urlCount[channel] === undefined ) {
      this.urlCount[channel] = 0;
    }
    let fileIndex = Math.floor(this.urlCount[channel] / this.maxPerFile);
    let channelFiles = this.filesForChannel(channel);
    let file = channelFiles[fileIndex];
    let previousFile = null;
    if (!file) {
      if (fileIndex > 0) {
        // close out the old one
        previousFile = channelFiles[fileIndex - 1];
        config.log.trace(`Closing ${previousFile.fileName}`);
        previousFile.close();
      }
      let fileName = `${channel}${fileIndex}.xml.gz`;
      file = channelFiles[fileIndex] = new SitemapFile({location: `${this.baseUrl}/${fileName}`,
        fileName: `${this.directory}/${fileName}`});
      file.on('error', (err) => { this.emit("error", err); });
      file.open();
    }
    return [file, previousFile];
  }
  totalUrls() {
    let pushed = 0;
    Object.keys(this.urlCount).forEach((channel) => {
      pushed += this.urlCount[channel];
    });
    let drained = 0;
    Object.keys(this.files).forEach((channel) => {
      this.files[channel].forEach((file) => {
        drained += file.urlCount;
      });
    });
    return [pushed, drained];
  }
  closeRemaining() {
    Object.keys(this.files).forEach((channel) => {
      let channelFiles = this.filesForChannel(channel);
      if (channelFiles.length > 0) {
        let lastFileInChannel = channelFiles[channelFiles.length - 1];
        config.log.trace(`Closing ${lastFileInChannel.fileName}`);
        lastFileInChannel.close();
      }
    });
  }
  _write(url, encoding, callback) {
    // Just pass the url through to the currently active SitemapFile
    let channel = this.source.channelForUrl(url);
    if (!channel) {
      let util = require('util');
      config.log.error(new Error(`url ${util.inspect(url)} of source ${this.source.name} has no channel: ${util.inspect(channel)}`));
      throw new Error(`url ${util.inspect(url)} has no channel: ${util.inspect(channel)}`);
    }
    let [file, previousFile] = this.currentSitemapFile(channel);
    file.write(url);
    this.urlCount[channel] += 1;
    // If there is a previousFile, wait for it to drain before writing url
    if (previousFile) {
      let waiting = function() {
        if (previousFile.isDrained()) {
          config.log.trace(`${previousFile.fileName} is drained, saved ${previousFile.urlCount} URLS`);
          callback();
        } else {
          //config.log.trace(`${previousFile.fileName} is not drained, waiting`);
          setTimeout(waiting, 100);
        }
      };
      setTimeout(waiting, 100);
    } else {
      callback();
    }
  }
}
