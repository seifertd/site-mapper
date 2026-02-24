site-mapper
===========
Site Map Generation in node.js

## Requirements ##

Node.js >= 18

## Installation ##

This module is intended to be used as a dependency in a website-specific
site map building project.  Add the module to the `dependencies` section
of a package.json file:

```json
{
  "dependencies": {
    "site-mapper": ">= 4.0.0"
  }
}
```

    npm install --save site-mapper

## Running site-mapper ##

Create a directory to hold your site map generation configuration.  This
directory will hold all the files needed to tell site-mapper what to create.

### Dependencies ###

Create a package.json file similar to the following:

```json
{
  "name": "my-website-site-maps",
  "description": "sitemap generation for mysite.com",
  "version": "1.0.0",
  "dependencies": {
    "site-mapper": ">= 4.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### Configuration ###

Create a directory called `./config`.  For each environment you will generate
sitemaps for, create a JavaScript file named for the environment:

    ./config/production.js

#### Configuration Format ####

The configuration file can contain any of the following keys. The values below
are defaults that will be used unless overridden in your configuration file.

```js
const config = {};
config.sources = {};
config.sitemaps = {};
config.logConfig = {
  name: 'sitemapper',
  level: 'debug'
};
config.defaultSitemapConfig = {
  targetDirectory: `${process.cwd()}/tmp/sitemaps/${config.env}`,
  sitemapIndex: 'sitemap.xml',
  sitemapRootUrl: 'http://www.mysite.com',
  sitemapFileDirectory: '/sitemaps',
  maxUrlsPerFile: 50000,
  urlBase: 'http://www.mysite.com'
};

module.exports = config;
```

The `sitemaps` object contains named keys pointing at objects that define a
particular sitemap.  The sitemap definition can contain (and override) any of the
keys in the `config.defaultSitemapConfig` object.  The produced sitemap consists of
a sitemap index XML file referencing one or more gzipped sitemap XML files, created
from URLs produced by the `config.sources` objects.

The configuration allows for defining one or more sitemaps to create — for example,
one sitemap for the `www` subdomain and another for the `foobar` subdomain.  By
default, all sources defined in `config.sources` are used to generate URLs for all
sitemaps.  To use different sources for different sitemaps, provide a `sources` key
in each sitemap configuration object:

```js
// Specify which sources to include — all others are ignored
sources: {
  includes: ['source1', 'source2']
}
```
or
```js
// Specify which sources to exclude — all others are included
sources: {
  excludes: ['source1', 'source2']
}
```

The `sources` object contains arbitrarily named keys pointing at functions that take
a single `sitemapConfig` object and return an object with `type` and `options` keys.
The `options` key points at a source configuration object that can contain:
`input`, `options`, `siteMap`, `cached`, `ignoreErrors`.

The input parameter `sitemapConfig` is an object formed by merging
`config.defaultSitemapConfig` with the specific sitemap configuration.

`type` is either one of the built-in source type classes (see below) or a
site-specific class derived from `SitemapTransformer`.

A minimal config might look like `./config/staging.js`:

```js
const {StaticSetSource, JsonSource} = require('site-mapper');

const appConfig = {
  sitemaps: {
    main: {
      sitemapRootUrl: 'http://staging.mysite.com',
      urlBase: 'http://staging.mysite.com',
      sitemapIndex: 'sitemap_index.xml',
      targetDirectory: `${process.cwd()}/tmp/sitemaps/staging`
    }
  },
  sources: {
    staticUrls: (sitemapConfig) => ({
      type: StaticSetSource,
      options: {
        siteMap: {
          channel: 'static',
          changefreq: 'weekly',
          priority: 1
        },
        options: {
          urls: ['/', '/about', '/faq', '/jobs']
        }
      }
    }),
    serviceUrls: (sitemapConfig) => ({
      type: JsonSource,
      options: {
        siteMap: {
          changefreq: 'weekly',
          priority: 0.8,
          channel: (url) => url.category,
          urlAugmenter: (url) => {
            url.url = `http://${sitemapConfig.urlBase}/widgets/${url.category}/${url.url}`;
          }
        },
        input: {
          url: 'http://api.mysite.com/widgets'
        },
        options: {
          filter: /urls\./
        }
      }
    })
  }
};

module.exports = appConfig;
```

### Logging ###

site-mapper logs using [pino](https://getpino.io/). To get pretty-printed logs
while running, pipe output through `pino-pretty`:

```bash
NODE_ENV=staging ./node_modules/.bin/site-mapper | npx pino-pretty
```

### Running the Code ###

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the generator:
   ```bash
   NODE_ENV=staging ./node_modules/.bin/site-mapper
   ```

### Overriding the configuration from the command line ###

For one-off generation of sitemap(s) for a single source, the site-mapper
command line tool accepts the following arguments:

```
Usage: node_modules/.bin/site-mapper [-s SITEMAP] [-i INCLUDES] [-e EXCLUDES]

Options:
  -s, --sitemap  name of the sitemap in the sitemaps section of the config file
  -i, --include  only include specified source(s)                        [array]
  -e, --exclude  add specified source(s) to excludes                     [array]
  -h, --help     Show help                                             [boolean]
```

Using the configuration above, to generate the sitemap(s) for just the
`staticUrls` source:

```bash
NODE_ENV=staging ./node_modules/.bin/site-mapper -s main -i staticUrls
```

## Sitemap Generation ##

The site-mapper module views the sitemap generation process as follows:

SiteMapper creates one or more Source objects, pipes each one to a Sitemap,
which then pipes to one or more SitemapFile objects, depending on the number
of URLs the source produces and the configured maximum number of URLs per
SitemapFile (50,000 by default).

```
+------------+          +------------+        +--------------+       +-------------+
| SiteMapper |          |   Source   |        | Sitemap      |       | SitemapFile |
|------------| creates  |------------|creates |--------------| adds  |-------------|
|            +--------->|            |------->|              |------>|             |
|            |          |            |  urls  |              | urls  |             |
+------------+          +------------+        +--------------+       +-------------+
```

### Sources ###

Sources are Node.js Transform stream implementations that operate in object mode
and produce URL objects from data of a specific format.  The included source types are:

1. **StaticSetSource** — configured with a static list of URL strings in the config file
2. **CsvSource** — produces URLs from CSV data
3. **JsonSource** — produces URLs from JSON data
4. **XmlSource** — produces URLs from XML data

Sources are configured with an `input` that produces raw text data of the appropriate
format. Source inputs can be files, URLs, or an instantiated `Readable` stream object.

#### Source configuration details ####

```js
{
  ignoreErrors: true,   // log and continue on error instead of aborting
  input: {
    // one of:
    fileName: '/path/to/file.csv',
    url: 'https://api.mysite.com/data',
    stream: readableStream
  },
  options: {},          // source-specific options (see below)
  siteMap: {},          // per-source sitemap metadata
  cached: {}            // optional caching config (see below)
}
```

- **ignoreErrors** — set to `true` to log and skip errors instead of aborting the entire run
- **input** — one of `fileName`, `url`, or `stream`
- **options** — source-specific options (see individual source docs below)
- **siteMap** — sitemap metadata for this source: `channel`, `changefreq`, `priority`, `urlFormatter`, `urlAugmenter`, `urlFilter`, `extraUrls`
- **cached** — if present, enables caching of input data; contains `cacheFile` (path) and `maxAge` (milliseconds)

#### URL Channel ####

Each URL is associated with a channel.  The channel names individual sitemap files
and can be a static string or derived from each URL at runtime:

```js
sources: {
  staticChannel: (sitemapConfig) => ({
    siteMap: { channel: 'products' }
  }),
  dynamicChannel: (sitemapConfig) => ({
    siteMap: { channel: (url) => url.category }
  })
}
```

Sitemap files are created as `${CHANNEL}${SEQUENCE}.xml.gz` in the target directory.

**Important:** if two sources produce the same channel name, the second source's
files will overwrite the first source's. Ensure each source produces a unique channel.

### Sitemaps ###

A Sitemap is created for each URL channel.  As URLs are added, sequentially
numbered files are created: `${CHANNEL}${SEQUENCE}.xml.gz`. Each file holds up
to `maxUrlsPerFile` URLs (default: 50,000).

### Sitemap Index and Files ###

site-mapper creates a sitemap index and as many gzipped sitemap files as required.
Gzipping cannot be disabled.

### Publishing Sitemaps to Search Engines ###

It is up to you how you expose the generated sitemaps to Google and other search
engines — there are no default publishing mechanisms in site-mapper.

## Tests ##

```bash
npm test
```

## Sources ##

### StaticSetSource ###

```js
options: {
  urls: ['/', '/about', '/faq']
}
```

Produces URLs from a static array of URL strings defined in the configuration.

### CsvSource ###

```js
options: {
  columns: ['url', 'imageUrl', 'lastModified'],
  relax_column_count: true
}
```

- **columns** — names of the CSV columns (default: `['url', 'imageUrl', 'lastModified', 'comments']`)
- **relax_column_count** — `true` to suppress errors when column count differs from config

### XmlSource ###

```js
options: {
  urlTag: 'url',
  urlAttributes: {
    lastmod: 'lastModified',
    changefreq: 'changeFrequency',
    priority: 'priority',
    loc: 'url'
  }
}
```

- **urlTag** — name of the XML elements containing URL data
- **urlAttributes** — map of XML attribute/child tag names to URL object property names

Out of the box, XmlSource is configured to read `sitemap.xml` files, which is useful
for including sitemaps generated by other methods alongside site-mapper's own output.

### JsonSource ###

The JSON source expects an array in the JSON data containing objects or strings
representing URLs.

```js
options: {
  filter: /regex/,
  transformer: (obj) => ({ url: obj.href }),
  stringArray: true
}
```

- **filter** — regex specifying where the URL array(s) are within the JSON document
- **transformer** — function that converts a raw object or string from JSON into a URL-compatible object
- **stringArray** — set to `true` if the array contains plain URL strings rather than objects

## Source Input Streams ##

Sources read data from local files (`input.fileName`), from URLs (`input.url`), or
from `Readable` stream instances (`input.stream`).

site-mapper ships with two custom input stream classes for HTTP data:

### MultipleHttpInput ###

```js
const {MultipleHttpInput} = require('site-mapper');

new MultipleHttpInput({
  urls: ['https://api.mysite.com/page1', 'https://api.mysite.com/page2'],
  format: 'json',   // wraps all responses in a JSON array: [response1, response2, ...]
  httpOptions: {}   // optional headers etc.
})
```

Fetches each URL in sequence and concatenates the responses.  When `format: 'json'`,
the individual responses are wrapped in a JSON array so the combined output can be
parsed by `JsonSource`.  Pass it as `input.stream` to a source:

```js
sources: {
  mySource: (sitemapConfig) => ({
    type: JsonSource,
    options: {
      input: {
        stream: new MultipleHttpInput({
          urls: ['https://api.mysite.com/a', 'https://api.mysite.com/b'],
          format: 'json'
        })
      },
      options: { filter: /.*/ },
      siteMap: { channel: 'products', changefreq: 'daily', priority: 0.8 }
    }
  })
}
```

### PaginatedHttpInput ###

```js
const {PaginatedHttpInput} = require('site-mapper');

new PaginatedHttpInput({
  url: 'https://api.mysite.com/items',
  format: 'json',           // wraps pages in a JSON array
  pagination: {
    page: 'page',           // query param name for the page number (default: 'page')
    per: 'per',             // query param name for page size (default: 'per')
    perPage: 100,           // page size value (default: 100)
    increment: 1,           // amount to increment page number per request (default: 1)
    start: 1                // starting page number (default: 1)
  },
  stop: {
    string: '"done"'        // stop fetching when this string appears in a response
  },
  httpOptions: {}           // optional headers etc.
})
```

Fetches pages from a paginated HTTP API, incrementing the page parameter with each
request.  Pagination stops when `stop.string` is found in a response body.  When
`format: 'json'`, all page responses are wrapped in a JSON array so the combined
output can be parsed by `JsonSource`.
