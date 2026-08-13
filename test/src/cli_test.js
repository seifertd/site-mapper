const {expect} = require('chai');
const {execFile} = require('child_process');
const fs = require('fs');
const path = require('path');

const cli = path.join(process.cwd(), 'bin', 'sitemapper');
const targetDir = path.join(process.cwd(), 'tmp', 'sitemaps', 'test');

// The CLI is a separate entry point from the library, so it only gets covered
// by actually running it. A require-time failure in bin/sitemapper shipped in
// three releases because nothing here spawned it.
const runCli = (args, done) => {
  execFile(process.execPath, [cli].concat(args), {
    cwd: process.cwd(),
    env: Object.assign({}, process.env, {
      CONFIG_DIR: path.join(process.cwd(), 'test'),
      NODE_ENV: 'test'
    }),
    timeout: 30000
  }, done);
};

const generatedFiles = () => {
  return fs.existsSync(targetDir) ? fs.readdirSync(targetDir).sort() : [];
};

describe('sitemapper cli', function() {
  this.timeout(30000);
  beforeEach( () => {
    fs.rmSync(targetDir, {recursive: true, force: true});
  });
  it('loads and prints usage', (done) => {
    runCli(['--help'], (err, stdout) => {
      if (err) { return done(err); }
      expect(stdout).to.contain('Usage:');
      expect(stdout).to.contain('--sitemap');
      expect(stdout).to.contain('--include');
      expect(stdout).to.contain('--exclude');
      done();
    });
  });
  it('generates sitemaps with no arguments', (done) => {
    runCli([], (err) => {
      if (err) { return done(err); }
      const files = generatedFiles();
      expect(files).to.contain('channel10.xml.gz');
      expect(files).to.contain('channel20.xml.gz');
      done();
    });
  });
  it('restricts sources with --include', (done) => {
    runCli(['-s', 'test.com', '-i', 'source1'], (err) => {
      if (err) { return done(err); }
      const files = generatedFiles();
      expect(files.some((f) => f.startsWith('channel1'))).to.be.true;
      expect(files.some((f) => f.startsWith('channel2'))).to.be.false;
      done();
    });
  });
  it('drops sources with --exclude', (done) => {
    runCli(['-s', 'test.com', '-e', 'source2'], (err) => {
      if (err) { return done(err); }
      const files = generatedFiles();
      expect(files.some((f) => f.startsWith('channel1'))).to.be.true;
      expect(files.some((f) => f.startsWith('channel2'))).to.be.false;
      done();
    });
  });
});
