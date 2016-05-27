import {Transform} from 'stream';
import {config} from '../config';

export class JsonFilter extends Transform {
  constructor({filter}) {
    super({objectMode: true});
    if (typeof filter == "function") {
      this.checker = filter;
    } else if (filter instanceof RegExp) {
      this.regex = filter;
      this.checker = this.pattern;
    } else {
      this.checker = this.allowAll;
    }
    this.stack = [];
    this.inArray = false;
    this.descending = false;
  }
  pattern(path, event) {
    path = path.join('.');
    return path.match(this.regex);
  }
  allowAll(path, event) {
    return true;
  }
  _transform(object, encoding, callback) {
    //config.log.trace(`GOT OBJECT, regex ${this.regex}`, object);
    switch(object.name) {
      case 'keyValue':
        this.stack.push(object.value);
        this.descending = false;
        break;
      case 'endKey':
        if (!this.descending) {
          this.stack.pop();
        }
        break;
      case 'startObject':
        this.descending = true;
        break;
      case 'startArray':
        this.inArray = true;
        this.stack.push(0);
        break;
      case "endObject":
        if (this.stack.length > 0 && !this.descending) {
          this.stack.pop();
        }
      case "endString":
      case "endNumber":
      case "nullValue":
      case "trueValue":
      case "falseValue":
        this.descending = false;
        if (this.inArray) {
          var index = this.stack.pop();
          this.stack.push(typeof index == "number" ? index + 1 : index);
        }
        break;
      case "endArray":
        this.descending = false;
        this.stack.pop();
        break;
    }
    if (this.checker(this.stack, object)) {
      this.push(object);
    }
    callback();
  }
}
