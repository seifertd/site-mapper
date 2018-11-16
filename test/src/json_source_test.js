const {expect} = require('chai');
import {config} from '../../lib/config';
import {JsonSource} from '../../lib/sources/json_source';

describe('json file source', function() {
  this.timeout(15000);
  before(() => {
    config.addAppSpecific();
  });
  it('parses json and produces urls', (done) => {
    let urls = [];
    let source = new JsonSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'json', urlFormatter: config.defaultUrlFormatter(config.defaultSitemapConfig)},
      options: { filter: /.*/ },
      name: 'test',
      input: {fileName: `${process.cwd()}/test/config/json_input_good.json`}}).
      on('end', (args) => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://www.mysite.com/url1');
        expect(urls[1].url).to.equal('http://www.mysite.com/url2');
        expect(urls[1].imageUrl).to.equal('/image2');
        done();
      }).on('error', (err) => {
        console.log("ERROR: ", err);
        console.log(err.stack);
      }).on('data', (url) => {
        urls.push(url);
      });
    source.open();
  });
  it('parses urls from deep in objects', (done) => {
    let urls = [];
    let source = new JsonSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'json', urlFormatter: config.defaultUrlFormatter(config.defaultSitemapConfig)},
      options: {
        filter: /data\.urls\./
      },
      name: 'test',
      input: {fileName: `${process.cwd()}/test/config/json_deep_array.json`}}).
      on('end', (args) => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://www.mysite.com/url1');
        expect(urls[1].url).to.equal('http://www.mysite.com/url2');
        expect(urls[1].imageUrl).to.equal('/image2');
        done();
      }).on('error', (err) => {
        console.log("ERROR: ", err);
        console.log(err.stack);
      }).on('data', (url) => {
        urls.push(url);
      });
    source.open();
  });
  it('fails when json file is bad', (done) => {
    let source = new JsonSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'json'},
      options: {
        filter: /urls\./
      },
      name: 'test',
      input: {fileName: `${process.cwd()}/test/config/json_bad.json`}}).
    on('end', () => {
      console.log("GOT END EVENT WITHOUT ERROR");
    }).on('error', (error) => {
      expect(error).to.not.be_null;
      done();
    }).open();
  });
});
