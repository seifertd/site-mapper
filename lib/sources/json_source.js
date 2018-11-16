import {Transform} from 'stream';
import {SitemapTransformer} from './sitemap_transformer';
import {Url} from '../url';
import {config} from '../config';
import Parser from 'stream-json/Parser';
import Streamer from 'stream-json/Streamer';
import {JsonFilter} from './json_filter';
import Packer from 'stream-json/Packer';

export class JsonSource extends SitemapTransformer {
  constructor(config) {
    super(config);
    this.transformer = config.options && config.options.transformer;
    this.stringArray = config.options && config.options.stringArray;
    this.parser = new Parser();
    this.parser.on('error', (err) => {
      this.emit('error', err);
    });
    this.streamer = new Streamer();
    this.packer = new Packer({packKeys: true, packStrings: true, packNumbers: true});
    this.filter = new JsonFilter({filter: config.options.filter});
    this.stack = [];
    this.currentKey = [];
  }
  open() {
    super.open();
    if (this.inputStream) {
      this.inputStream.pipe(this.parser).
        pipe(this.streamer).
        pipe(this.packer).
        pipe(this.filter).
        pipe(this);
    }
  }
  disposeObject(object) {
    let util = require('util');
    //config.log.trace(`Disposing of object: ${util.inspect(object)}, stack length: ${this.stack.length}`);
    if (this.stack.length > 0) {
      let parentObject = this.stack[this.stack.length - 1];
      if (parentObject instanceof Array) {
        parentObject.push(object);
      } else {
        parentObject[this.currentKey.pop()] = object;
      }
      //config.log.trace(`CURRENT OBJECT: ${util.inspect(parentObject)}`);
    } else {
      //config.log.trace(`CURRENT OBJECT: ${util.inspect(parentObject)}`);
      if (this.transformer) {
        object = this.transformer(object);
      }
      try {
        let url = this._decorateUrl(new Url(object));
        if (url) {
          this.push(url);
        } else {
          //config.log.trace(`After transform and decoration ${util.inspect(object)} => ${util.inspect(url)}`);
        }
      } catch (err) {
        this.emit('error', err);
      }
    }
  }
  _transform(object, encoding, callback) {
    let util = require('util');
    //config.log.trace(`Got object ${util.inspect(object)}, stack length: ${this.stack.length}`);
    switch(object.name) {
      case 'startObject':
        this.stack.push({});
        break;
      case 'startArray':
        if (this.stack.length > 0) {
          this.stack.push([]);
        }
        this.currentArray = true;
        break;
      case 'endArray':
        if (this.stack.length > 1) {
          this.disposeObject(this.stack.pop());
        }
        this.currentArray = false;
        break;
      case 'endObject':
        this.disposeObject(this.stack.pop());
        break;
      case 'keyValue':
        this.currentKey.push(object.value);
        break;
      case 'stringValue':
        if (this.stringArray) {
          object.value = {url: object.value};
        }
      case 'trueValue':
      case 'falseValue':
      case 'nullValue':
        this.disposeObject(object.value);
        break;
      case 'numberValue':
        this.disposeObject(parseFloat(object.value));
        break;
    }
    callback();
  }
}
