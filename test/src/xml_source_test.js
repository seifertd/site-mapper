const {expect} = require('chai');
const {config} = require('../../lib/config');
const {XmlSource} = require('../../lib/sources');

describe('xml source', function() {
  before(() => {
    config.addAppSpecific();
    this.urlFormatter = config.defaultUrlFormatter({urlBase: "http://test.com"});
  });
  it('parses xml and produces urls', (done) => {
    let urls = [];
    let source = new XmlSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'xml',
      urlFormatter: this.urlFormatter}, input: {fileName: `${process.cwd()}/test/config/sitemap.xml`}, 
      options: {urlTag: 'url'}}).on('end', () => {
        expect(urls.length).to.equal(15);
        done();
      }).on('error', (err) => {
        console.log("ERROR: ", err);
        console.log(err.stack);
      }).on('data', (url) => {
        urls.push(url);
      });
    source.open();
  });
  it('generates an error when xml is bad', (done) => {
    const source = new XmlSource({siteMap: {changefreq: 'foo', priority: 1, channel: 'xml',
      urlFormatter: this.urlFormatter}, input: {fileName: `${process.cwd()}/test/config/sitemap_bad.xml`}, 
      options: {urlTag: 'url'}}).on('error', (err) => {
        expect(err).to.not.be.null;
        done();
    });
    source.open();
  });
});
