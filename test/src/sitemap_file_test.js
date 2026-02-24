const {expect} = require('chai');
const SitemapFile = require('../../lib/sitemapFile');
const Url = require('../../lib/url');
const concat = require('concat-stream');
describe('sitemap', function() {
  it('class exists', () => {
    expect(SitemapFile).to.exist;
  });
  describe('instances', () => {
    let setupSitemap = (done, regexes) => {
      this.outStream = concat((sitemapOutput) => {
        expect(sitemapOutput).to.exist;
        regexes.forEach( (regex) => {
          expect(sitemapOutput).to.match(regex);
        });
        done();
      });
      this.sitemap = new SitemapFile({location: "sitemap.xml.gz", fileName: "sitemap.xml.gz"});
      this.sitemap.pipe(this.outStream);
    };

    it("can be created", () => {
      setupSitemap();
      expect(this.sitemap).to.exist;
    });

    it("consumes urls and emits xml", (done) => {
      setupSitemap(done, [
        /<loc>http:\/\/foo.com\/foo\.html<\/loc>/,
        /<priority>42<\/priority>/,
        /<changefreq>sniggly<\/changefreq>/
      ]);
      this.sitemap.write(new Url({url: "http://foo.com/foo.html", lastModified: new Date(), changeFrequency: 'sniggly', priority: 42}));
      this.sitemap.end();
    });

    it("can put image tags in sitemaps", (done) => {
      setupSitemap(done, [
        /<image:image><image:loc>http:\/\/foo.com\/image.png/
      ]);
      this.sitemap.write(new Url({url:"http://foo.com/foo.html", lastModified: new Date(), changeFrequency: 'daily', priority: 1, imageUrl: "http://foo.com/image.png"}));
      this.sitemap.end();
    });

    it("can put xhtml link tags in sitemaps", (done) => {
      setupSitemap(done, [
        /<xhtml:link.*href="http:\/\/foo.com\/link"\/>/
      ]);
      this.sitemap.write(new Url({url:"http://foo.com/foo.html", lastModified: new Date(), changeFrequnecy: 'daily', priority: 1, linkTags: [{rel: 'alternate', href: "http://foo.com/link"}]}));
      this.sitemap.end();
    });
  });
});
