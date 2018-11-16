const {expect} = require('chai');
import {config} from '../../lib/config';
import {CsvSource} from '../../lib/sources/csv_source';

describe('csv file source', function() {
  before( () => {
    config.addAppSpecific();
    this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
  });
  it('parses csv and produces urls', (done) => {
    let urls = [];
    let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
      urlFormatter: this.urlFormatter}, input: {fileName: `${process.cwd()}/test/config/test.csv`}}).
      on('end', (args) => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://test.com/url1');
        expect(urls[1].url).to.equal('http://test.com/url2');
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
  it('fails when csv file is bad', (done) => {
    let urls = [];
    let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
      urlFormatter: this.urlFormatter}, input: {fileName: `${process.cwd()}/test/config/error.csv`}}).
      on('error', (error) => {
        expect(error).to.not.be_null;
        done();
      }).on('data', (url) => {
        urls.push(url);
      }).open();
  });
});
