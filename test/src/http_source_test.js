const http = require('http');
const {expect} = require('chai');
const {config} = require('../../lib/config');
const CsvSource = require('../../lib/sources/csv_source');
const JsonSource = require('../../lib/sources/json_source');
const MultipleHttpInput = require('../../lib/sources/multiple_http_input');
const PaginatedHttpInput = require('../../lib/sources/paginated_http_input');

// CSV data matching test/config/test.csv format
const CSV_DATA = `/url1,
/url2,/image2
/url3,/image3
/url4,/image4
/url5,`;

// JSON data matching test/config/json_input_good.json format
const JSON_DATA = JSON.stringify([
  {url: '/url1'},
  {url: '/url2', imageUrl: '/image2'},
  {url: '/url3', imageUrl: '/image3'},
  {url: '/url4', imageUrl: '/image4'},
  {url: '/url5'}
]);

// Individual JSON objects served per URL for MultipleHttpInput
const MULTI_DATA = [
  JSON.stringify({url: '/multi1', imageUrl: '/image1'}),
  JSON.stringify({url: '/multi2', imageUrl: '/image2'}),
  JSON.stringify({url: '/multi3'})
];

// Individual JSON objects served per page for PaginatedHttpInput
// Page 3 contains the stop string '"done"' as a JSON key
const PAGINATED_DATA = [
  JSON.stringify({url: '/page1'}),
  JSON.stringify({url: '/page2'}),
  JSON.stringify({url: '/page3', done: true})
];

describe('http source tests', function() {
  this.timeout(5000);

  let server;
  let port;

  before((done) => {
    config.addAppSpecific();
    server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, 'http://127.0.0.1');
      const pathname = reqUrl.pathname;

      if (pathname === '/test.csv') {
        res.writeHead(200, {'Content-Type': 'text/csv'});
        res.end(CSV_DATA);
      } else if (pathname === '/test.json') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON_DATA);
      } else if (pathname === '/multi/1') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(MULTI_DATA[0]);
      } else if (pathname === '/multi/2') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(MULTI_DATA[1]);
      } else if (pathname === '/multi/3') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(MULTI_DATA[2]);
      } else if (pathname === '/paginated') {
        const page = parseInt(reqUrl.searchParams.get('page') || '1', 10);
        const data = PAGINATED_DATA[page - 1];
        if (data) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(data);
        } else {
          res.writeHead(404);
          res.end('');
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  describe('CsvSource with url input', () => {
    it('fetches csv from url and produces urls', (done) => {
      const urlFormatter = config.defaultUrlFormatter({urlBase: 'http://test.com'});
      const urls = [];
      const source = new CsvSource({
        siteMap: {changefreq: 'daily', priority: 0.5, channel: 'csv', urlFormatter},
        input: {url: `http://127.0.0.1:${port}/test.csv`}
      }).on('end', () => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://test.com/url1');
        expect(urls[1].url).to.equal('http://test.com/url2');
        expect(urls[1].imageUrl).to.equal('/image2');
        done();
      }).on('error', done).on('data', (url) => {
        urls.push(url);
      });
      source.open();
    });
  });

  describe('JsonSource with url input', () => {
    it('fetches json from url and produces urls', (done) => {
      const urlFormatter = config.defaultUrlFormatter({urlBase: 'http://test.com'});
      const urls = [];
      const source = new JsonSource({
        siteMap: {changefreq: 'daily', priority: 0.5, channel: 'json', urlFormatter},
        options: {filter: /.*/},
        input: {url: `http://127.0.0.1:${port}/test.json`}
      }).on('end', () => {
        expect(urls.length).to.equal(5);
        expect(urls[0].url).to.equal('http://test.com/url1');
        expect(urls[1].url).to.equal('http://test.com/url2');
        expect(urls[1].imageUrl).to.equal('/image2');
        done();
      }).on('error', done).on('data', (url) => {
        urls.push(url);
      });
      source.open();
    });
  });

  describe('MultipleHttpInput with JsonSource', () => {
    it('fetches multiple urls and produces urls', (done) => {
      const urlFormatter = config.defaultUrlFormatter({urlBase: 'http://test.com'});
      const urls = [];
      const multiInput = new MultipleHttpInput({
        urls: [
          `http://127.0.0.1:${port}/multi/1`,
          `http://127.0.0.1:${port}/multi/2`,
          `http://127.0.0.1:${port}/multi/3`
        ],
        format: 'json'
      });
      const source = new JsonSource({
        siteMap: {changefreq: 'daily', priority: 0.5, channel: 'json', urlFormatter},
        options: {filter: /.*/},
        input: {stream: multiInput}
      }).on('end', () => {
        expect(urls.length).to.equal(3);
        expect(urls[0].url).to.equal('http://test.com/multi1');
        expect(urls[0].imageUrl).to.equal('/image1');
        expect(urls[1].url).to.equal('http://test.com/multi2');
        expect(urls[2].url).to.equal('http://test.com/multi3');
        done();
      }).on('error', done).on('data', (url) => {
        urls.push(url);
      });
      source.open();
    });
  });

  describe('PaginatedHttpInput with JsonSource', () => {
    it('fetches paginated urls and stops on stop string', (done) => {
      const urlFormatter = config.defaultUrlFormatter({urlBase: 'http://test.com'});
      const urls = [];
      const paginatedInput = new PaginatedHttpInput({
        url: `http://127.0.0.1:${port}/paginated`,
        format: 'json',
        stop: {string: '"done"'},
        pagination: {page: 'page', per: 'per', perPage: 10, increment: 1, start: 1}
      });
      const source = new JsonSource({
        siteMap: {changefreq: 'daily', priority: 0.5, channel: 'json', urlFormatter},
        options: {filter: /.*/},
        input: {stream: paginatedInput}
      }).on('end', () => {
        expect(urls.length).to.equal(3);
        expect(urls[0].url).to.equal('http://test.com/page1');
        expect(urls[1].url).to.equal('http://test.com/page2');
        expect(urls[2].url).to.equal('http://test.com/page3');
        done();
      }).on('error', done).on('data', (url) => {
        urls.push(url);
      });
      source.open();
    });
  });
});
