var {expect} = require('chai');
const {config} = require('../../lib/config');

describe('config', function() {
  it('knows the environment', () => {
    expect(config.env).to.equal('test');
  });

  it('can read config in the module', () => {
    expect(config.testing).to.be.true;
  });

  it('can read the default configuration', () => {
    expect(config.defaultSitemapConfig.targetDirectory).to.equal(`${process.cwd()}/tmp/sitemaps/test`);
  });

  describe('app specific', () => {
    before( () => {
      config.addAppSpecific();
    });

    it('can be found', () => {
      expect(config.foo).to.equal('bar');
    });

    it('sets sitemap configurations', () => {
      expect(config.sitemaps["test.com"].urlBase).to.equal("http://test.com");
    });
  });
});
