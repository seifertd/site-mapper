import {expect} from 'chai';
import request from 'request';
import {generateSitemaps, config, CsvSource} from '../../lib/main';
import libxmljs from 'libxmljs';
import zlib from 'zlib';
import concat from 'concat-stream';
import fs from 'fs';
import util from 'util';

describe('sitemap generator', function() {
  this.timeout(5000);
  this.logOutput = null;
  before((done) => {
    let xsd = request("http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd", (error, response, body) => {
      this.xsdSchema = libxmljs.parseXml(body);
      done();
    });
  });
  it('exists', () => {
    expect(generateSitemaps).to_exist;
  });

  it('works with the test configuration', (done) => {
    generateSitemaps((err, results) => {
      expect(err).to.be_null
      expect(results.length).to.equal(1);
      expect(results[0].sitemaps.length).to.equal(2);

      let sitemap1Files = results[0].sitemaps[0].allFiles();
      expect(sitemap1Files.length).to.equal(2);
      expect(sitemap1Files[0].fileName).to.match(/channel10/);
      expect(sitemap1Files[0].urlCount).to.equal(2);
      expect(sitemap1Files[1].urlCount).to.equal(2);
      let sitemap2Files = results[0].sitemaps[1].allFiles();
      expect(sitemap2Files.length).to.equal(2);
      expect(sitemap2Files[0].fileName).to.match(/channel20/);
      expect(sitemap2Files[0].urlCount).to.equal(2);
      expect(sitemap1Files[1].urlCount).to.equal(2);

      // Check that sitemaps are well formed xml
      let parseXml = (xmlData) => {
        return () => {
          return new libxmljs.parseXml(xmlData);
        }
      };

      expect(results[0].indexFiles.default.name).to.match(/testSitemap\.xml/);
      expect(parseXml(fs.readFileSync(results[0].indexFiles.default.name))).to.not.throw(Error);

      let gzipOut = concat((xmlData) => {
        expect(parseXml(xmlData)).to.not.throw(Error);
        let doc = parseXml(xmlData)();
        expect(doc.validate(this.xsdSchema)).to.be_true;
        let againGzipOut = concat((xmlData) => {
          expect(parseXml(xmlData)).to.not.throw(Error);
          let doc = parseXml(xmlData)();
          expect(doc.validate(this.xsdSchema)).to.be_true;
          done();
        });
        fs.createReadStream(sitemap1Files[0].fileName).pipe(zlib.createGunzip()).pipe(againGzipOut);
      });
      fs.createReadStream(sitemap2Files[0].fileName).pipe(zlib.createGunzip()).pipe(gzipOut);
    });
  });
  it('will override the config if asked to', (done) => {
    generateSitemaps({sitemaps: { "test.com": { sources: { includes: ['source1'] } } } }, (err, results) => {
      expect(err).to.be_null
      expect(results.length).to.equal(1);
      expect(results[0].sitemaps.length).to.equal(1);

      let sitemap1Files = results[0].sitemaps[0].allFiles();
      expect(sitemap1Files.length).to.equal(1);
      expect(sitemap1Files[0].fileName).to.match(/channel10/);
      expect(sitemap1Files[0].urlCount).to.equal(4);
      done();
    });
  });
  describe('with a source with error', () => {
    before( () => {
      this.sourceOptions = {
        type: CsvSource,
        options: {
          input: { noValidKeys: ""},
          options: {},
          siteMap: {}
        }
      };
      if (!config.sources) {
        config.sources = {}
      }
      config.sources.errorSource = (sitemapConfig) => {
        return this.sourceOptions;
      };
    });
    describe('with default config', () => {
      it('fails', (done) => {
        generateSitemaps((err, results) => {
          expect(err).to.not.be_null;
          done();
        });
      });
    });

    describe('with config to ignore errors', () => {
      before(() => {
        this.sourceOptions.options.ignoreErrors = true;
      });
      it('works', (done) => {
        generateSitemaps((err, results) => {
          expect(err).to.be_null;
          expect(results.length).to.equal(1);
          // The errored source does not result in a sitemap, hence only 2 sitemaps
          expect(results[0].sitemaps.length).to.equal(2);
          done();
        });
      });
    });
  });
});
