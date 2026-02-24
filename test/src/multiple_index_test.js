const {expect} = require('chai');
const {generateSitemaps, config, CsvSource} = require('../../lib/main');
const libxmljs = require('libxmljs2');
const zlib = require('zlib');
const concat = require('concat-stream');
const fs = require('fs');
const util = require('util');

describe('multiple index sitemap generator', function() {
  this.timeout(5000);
  this.logOutput = null;
  before(async () => {
    const res = await fetch("http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd");
    const body = await res.text();
    this.xsdSchema = libxmljs.parseXml(body);
  });
  it('exists', () => {
    expect(generateSitemaps).to.exist;
  });

  it('creates per source index files if so configured', (done) => {
    const overrideConfig = require("../config/multiple_index_files.js");
    generateSitemaps(overrideConfig, (err, results) => {
      expect(err).to.be.null;
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

      expect(Object.keys(results[0].indexFiles).length).to.equal(2);
      Object.keys(results[0].indexFiles).forEach( indexName => {
        expect(results[0].indexFiles[indexName].name).to.match(/channel[12]Index\.xml/);
        expect(parseXml(fs.readFileSync(results[0].indexFiles[indexName].name))).to.not.throw(Error);
      });

      let gzipOut = concat((xmlData) => {
        expect(parseXml(xmlData)).to.not.throw(Error);
        let doc = parseXml(xmlData)();
        expect(doc.validate(this.xsdSchema)).to.be.true;
        let againGzipOut = concat((xmlData) => {
          expect(parseXml(xmlData)).to.not.throw(Error);
          let doc = parseXml(xmlData)();
          expect(doc.validate(this.xsdSchema)).to.be.true;
          done();
        });
        fs.createReadStream(sitemap1Files[0].fileName).pipe(zlib.createGunzip()).pipe(againGzipOut);
      });
      fs.createReadStream(sitemap2Files[0].fileName).pipe(zlib.createGunzip()).pipe(gzipOut);
    });
  });
});
