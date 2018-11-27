const {expect} = require('chai');
const {config} = require('../../lib/config');
const CsvSource = require('../../lib/sources/csv_source');
const fs = require('fs');

describe('cached source', function() {
  before( () => {
    config.addAppSpecific();
    this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
    this.cacheFile = `${process.cwd()}/tmp/cachefile.txt`;
    let tmpDir = `${process.cwd()}/tmp`;
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
  });
  after( () => {
    fs.unlinkSync(this.cacheFile);
  });
  it('saves a cache file', (done) => {
    let urls = [];
    let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
      urlFormatter: this.urlFormatter}, input: {cached: {cacheFile: this.cacheFile, maxAge: 86000000}, fileName: `${process.cwd()}/test/config/test.csv`}}).
      on('end', (args) => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://test.com/url1');
        expect(urls[1].url).to.equal('http://test.com/url2');
        expect(urls[1].imageUrl).to.equal('/image2');
        expect(fs.existsSync(this.cacheFile));
        done();
      }).on('error', (err) => {
        console.log("ERROR: ", err);
        console.log(err.stack);
      }).on('data', (url) => {
        urls.push(url);
      });
    source.open();
  });
  describe('with existing cached data', function() {
    before( () => {
      config.addAppSpecific();
      this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
      this.cacheFile = `${process.cwd()}/tmp/cachefile.txt`;
      fs.writeFileSync(this.cacheFile, fs.readFileSync(`${process.cwd()}/test/config/preexisting_cache.txt`));
    });
    it('reads cached data', (done) => {
      let urls = [];
      let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
        urlFormatter: this.urlFormatter}, input: {cached: {cacheFile: this.cacheFile, maxAge: 86000000}, fileName: `${process.cwd()}/test/config/test.csv`}}).
        on('end', (args) => {
          expect(urls.length).to.equal(5);
          expect(urls[0].url).to.equal('http://test.com/url1_cached');
          expect(urls[1].url).to.equal('http://test.com/url2_cached');
          expect(urls[1].imageUrl).to.equal('/image2_cached');
          expect(fs.existsSync(this.cacheFile));
          expect(fs.statSync(this.cacheFile).size).to.be.above(0);
          done();
        }).on('error', (err) => {
          console.log("ERROR: ", err);
          console.log(err.stack);
        }).on('data', (url) => {
          urls.push(url);
        });
      source.open();
    });
  });
  describe('with existing zero length cache', function() {
    before( () => {
      config.addAppSpecific();
      this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
      this.cacheFile = `${process.cwd()}/tmp/cachefile.txt`;
      fs.writeFileSync(this.cacheFile, "");
    });
    it('reads uncached data', (done) => {
      let urls = [];
      let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
        urlFormatter: this.urlFormatter}, input: {cached: {cacheFile: this.cacheFile, maxAge: 86000000}, fileName: `${process.cwd()}/test/config/test.csv`}}).
        on('end', (args) => {
          expect(urls.length).to.equal(5);
          expect(urls[0].url).to.equal('http://test.com/url1');
          expect(urls[1].url).to.equal('http://test.com/url2');
          expect(urls[1].imageUrl).to.equal('/image2');
          expect(fs.existsSync(this.cacheFile));
          expect(fs.statSync(this.cacheFile).size).to.be.above(0);
          done();
        }).on('error', (err) => {
          console.log("ERROR: ", err);
          console.log(err.stack);
        }).on('data', (url) => {
          urls.push(url);
        });
      source.open();
    });
  });
  describe('with existing expired cache data', function() {
    before( () => {
      config.addAppSpecific();
      this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
      this.cacheFile = `${process.cwd()}/tmp/cachefile.txt`;
      fs.writeFileSync(this.cacheFile, fs.readFileSync(`${process.cwd()}/test/config/preexisting_cache.txt`));
      let d = new Date(Date.now() - 86400000);
      fs.utimesSync(this.cacheFile, d, d);
    });
    it('reads uncached data', (done) => {
      let urls = [];
      let source = new CsvSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'csv',
        urlFormatter: this.urlFormatter}, input: {cached: {cacheFile: this.cacheFile, maxAge: 86000000}, fileName: `${process.cwd()}/test/config/test.csv`}}).
        on('end', (args) => {
          expect(urls.length).to.equal(5);
          expect(urls[0].url).to.equal('http://test.com/url1');
          expect(urls[1].url).to.equal('http://test.com/url2');
          expect(urls[1].imageUrl).to.equal('/image2');
          expect(fs.existsSync(this.cacheFile));
          expect(fs.statSync(this.cacheFile).size).to.be.above(0);
          done();
        }).on('error', (err) => {
          console.log("ERROR: ", err);
          console.log(err.stack);
        }).on('data', (url) => {
          urls.push(url);
        });
      source.open();
    });
  });
});
