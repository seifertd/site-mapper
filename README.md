site-mapper
===========
Site Map Generation in node.js

## Installation ##

This module is intended to be used as a dependency in a website specific 
site map building project.  Add the module to the "dependencies" section
of a package.json file:

```json
{
  "dependencies": {
    "site-mapper": ">= 2.0.1"
  }
}
```

There is nothing stopping you from installing it locally and editing the embedded
configuration files, but that is not the intent.

    npm install --save site-mapper

## Running site-mapper ##

Create a directory to hold your site map generation configuration.  This
directory will hold all the files needed to tell site-mapper what to
create.

### Dependencies ###
Create a package.json file similar to the following:

```json
{
  "author": {
    "name": "YOUR NAME HERE",
    "email": "YOUR EMAIL HERE"
  },
  "name": "my-website-site-maps",
  "description": "sitemap generation for mysite.com",
  "version": "0.0.1",
  "homepage": "",
  "keywords": [
    "sitemap"
  ],
  "dependencies": {
    "site-mapper": ">= 2.0.1"
  },
  "engines": {
    "node": "*"
  }
}
```

### Configuration ###

Create a directory called ./config.  For each environment you will generate sitemaps
for (possibly you only have one, production), create a javascript or
coffeescript file in the config directory named for the environment:

    ./config/production.js, ./config/production.coffee or ./config/production.es6

#### ES6 Configuration Files ####
If you wish to use es6 for your configuration, save the configuration using the .es6 
file extension:

    ./config/production.es6

And add the following to your package.json as dependencies:

```json
{
  "dependencies": {
    "babel-register": "^6.9.0",
    "babel-preset-es2015": "^6.6.0",
    "babel-preset-stage-0": "^6.5.0"
  }
}
```

You will also have to create a .babelrc file in the root of your project with the
following contents:

```
{
  "presets": ["es2015", "stage-0"]
}
```

At this time, any es6 configuration file should export the configuration object
using module.exports instead of es6 export statements.

#### Coffeescript Configuration Files ####

If you want to use coffeescript for configuration, you will have to add 
the coffee script module as a dependency:

```json
{
  "dependencies": {
    "coffee-script": "^1.10.0"
  }
}
```

#### Configuration Format ####

The configuration file can contain any of the following keys.  The
values below are defaults that will be used unless overridden in your
configuration file.

```coffee
config = {}
config.sources = {}
config.sitemaps = {}
config.defaultSitemapConfig = {
  targetDirectory: "#{process.cwd()}/tmp/sitemaps/#{config.env}"
  sitemapIndex: "sitemap.xml"
  sitemapRootUrl: "http://www.mysite.com"
  sitemapFileDirectory: "/sitemaps"
  maxUrlsPerFile: 50000
  urlBase: "http://www.mysite.com"
}
config.sitemapIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
config.sitemapHeader = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9/">'
config.defaultUrlFormatter = (options) ->
  (href) ->
    if '/' == href
      options.urlBase
    else if href && href.length && href[0] == '/'
      "#{options.urlBase}#{href}"
    else if href && href.length && href.match(/^https?:\/\//)
      href
    else
      if href.length
        "#{options.urlBase}/#{href}"
      else
        options.urlBase
```

The sitemaps object contains named keys pointing at objects that define a 
particular sitemap.  The sitemap definition can contain (and override) any
of the keys in the config.defaultSitemapConfig object.
The produced sitemap consists of a sitemap index xml file referencing one or
more gzipped sitemap xml files, created from urls produced by the config.sources objects.
The configuration allows for defining 1 or more sitemaps to create, for example,
you might configure one sitemap for the http version of a site and another sitemap
for the https version of the site.  Or you might define one sitemap for the
www subdomain and another for the foobar subdomain.  By default, all sources
defined in config.sources are used to generate urls for all sitemaps.  To use
different sources for different sitemaps, provide in each sitemap configuration object
a sources key like one of the following:

```coffee
# Specify which sources to include. All others are ignored
sources:
  includes: ['source1', 'source2', ...]
```
or
```coffee
# Specify which sources to exclude. All others are included
sources:
  excludes: ['source1', 'source2', ...]
```

The sources object contains arbitrarily named keys pointing at functions that take
a single sitemapConfig object and return an object with the
following keys: type, options.  The options key points at a source configuration object
that can contain the following keys: input, options, siteMap, cached, ignoreErrors

The input parameter, sitemapConfig, is an object
formed by merging the config.defaultSitemapConfig object with the specific sitemap
configuration (more about this later).

In the returned object, the type is either one of the built in source
type classes (see below) or a site specific class derived from the SitemapTransformer base class.

A minimal config might be:

```coffee
{StaticSetSource, JsonSource} = require 'site-mapper'
appConfig =
  sitemaps:
    main:
      sitemapRootUrl: "http://staging.mysite.com"
      urlBase: "http://staging.mysite.com"
      sitemapIndex: "sitemap_index.xml"
      targetDirectory: "#{process.cwd()}/tmp/sitemaps/#{config.env}/http"
  sources:
    staticUrls: (sitemapConfig) ->
      type: StaticSetSource
      options:
        siteMap:
          channel: 'static'
          changefreq: 'weekly'
          priority: 1
        options:
          urls: [
            '/',
            '/about',
            '/faq',
            '/jobs'
          ]
    serviceUrls: (sitemapConfig) ->
      type: JsonSource
      options:
        siteMap:
          changefreq: 'weekly'
          priority: 0.8
          channel: (url) -> url.category
          urlAugmenter: (url) ->
            url.url = "http://www.mysite.com/widgets/#{url.category}/#{url.url}"
        input:
          url: "http://api.mysite.com/widgets"
        options:
          filter: /urls\./

module.exports = appConfig
```

### Logging ###
site-mapper logs using bunyan format. To get pretty printed logs while running, just pipe
the site-mapper output through the bunyan command line tool.

### Running the Code ###

Finally, putting it all together, you can generate the sitemaps as follows:

  1. Install all the dependencies:
         ```
         rm -rf node_modules;
         npm install
         ```
  1. Run the generator:
         ```
         NODE_ENV=staging ./node_modules/.bin/site-mapper | ./node_modules/site-mapper/node_modules/.bin/bunyan
         ```

Below is a make file that encapsulates the above recipe.  It can be run
by running:

    make setup generate

```make
usage :
	@echo ''
	@echo 'Core tasks                       : Description'
	@echo '--------------------             : -----------'
	@echo 'make setup                       : Install dependencies'
	@echo 'make generate                    : Generate the sitemaps'
	@echo ''

SITEMAPPER=./node_modules/.bin/site-mapper
NPM_ARGS=
NODE_ENV=staging

setup :
	@rm -rf node_modules
	@echo npm $(NPM_ARGS) install
	@npm $(NPM_ARGS) install

generate :
	@rm -rf tmp
	@NODE_ENV=$(NODE_ENV) $(SITEMAPPER)
```

## Sitemap Generation ##

The site-mapper module views the sitemap generation process as follows:

SiteMapper creates one or more Source objects, pipes it to a Sitemap, which
then pipes to one or more SitemapFile objects.


    +------------+          +------------+        +--------------+       +-------------+
    | SiteMapper |          |   Source   |        | Sitemap      |       | SitemapFile |
    |------------| creates  |------------| sends  |--------------| adds  |-------------|
    |            +--------->|            |------->|              |------>|             |
    |            |          |            |  urls  |              | urls  |             |
    +------------+          +------------+        +--------------+       +-------------+

### Sources ###

Sources are Javascript streaming API Transform implementation that operate in object mode
and produce url objects from data of a specific format.  There are three included Source implementations:

  1.  StaticSetSource - This source is configured with a static list of urls strings
      in a configuration file.
  1.  CsvSource - Produces urls from CSV data.
  1.  JsonSource - Produces urls from JSON data.

Sources are configured with an input that produces raw text data of the right format. Source inputs can
be either files, urls or an instantiated Readable stream object.  The source reads the input
and converts it into Url objects. The Url objects may then be filtered based on the url
object properies and then are provided for upstream consumers in the Transform implementation.

#### Source configuration details ####

The configuration object for sources has the following form:

```coffee
config =
  ignoreErrors: true|false
  input: {},
  options: {},
  siteMap: {}
  cached: {}
```

ignoreErrors
: Set to true if you want to log and ignore errors. If set to false (default) an error in
the input stream aborts the entire process.
input object
: This object can have one of the following keys: 1) fileName 2) url or 3) stream
options object
: Defines source specific options (see below)
siteMap object
: Defines sitemap information specific to the source, like the priority of urls it produces.
cached object
: If present, turns on caching of the data produced by the input so that subsequent runs or
  even other sources in the configuration can use it. Contains the cacheFile attribute pointing
  at the path for the cached data and maxAge attribute, a time in milliseconds the cached data
  should be considered fresh.

#### URL Channel ####

Each url is associated with a channel.  The channel can be a static string or
derived from the url at runtime. In either case, the channel is specified by setting
the channel attribute on the source configuration object's siteMap object. It can
be either a string (static channel) or a function taking a Url object and returning
a string.

```coffee
sources =
  staticChannel: (sitemapConfig) ->
    siteMap:
      channel: 'foo'
  dynamicChannel: (sitemapConfig) ->
    siteMap:
      channel: (url) -> url.category
```

The channel is used to name individual sitemap files where urls produced by the sources will
end up. Files of the form ${CHANNEL}${SEQUENCE}.xml.gz will be created in the target directory.

### Sitemaps ###

A Sitemap is created for each URL channel.  As urls are added to their corresponding
Sitemap, the group will create sequentially numbered Sitemap files, each containing a
configurable number of urls, 50,000 by default.  The name of the sitemap files is of
the form

    ${CHANNEL}${SEQUENCE}.xml.gz

The Channel is produced as described above

IMPORTANT: If two sources are configured with the same channel, or they use a dynamic channel function
that produces the same channel, the second source will overwrite sitemaps created by the first
source. It is up to the user to ensure that different sources produce different channels.

### Sitemap Index and Files ###

site-mapper will create a sitemap index and as many sitemap files as are required.  The
sitemap files are gzipped.  There is no way to turn gzipping off.

### Publishing Sitemaps to Search Engines ###

It is up to you how you expose the site maps generated by site mapper to Google and other 
search engines.  Each company does this differently, so there are no default publishing
mechanisms in site-mapper.

## Tests ##

npm run test

This should install all dependencies and run the test suite


## Sources ##

CsvSource

options.options =
  columns: ['url', 'imageUrl', 'lastModified]
  relax\_column\_count: true|false

columns: Specify the names of the columns. 
relax\_column\_count: true if you don't want an error raised if the number of columns
in the csv data is different from what is configured.

JsonSource
The JSON source expects an array to exist in the json data that contains objects or
strings representing urls.

options.options = 
  filter: /regex/
  transformer: (obj) -> 
  stringArray: true|false

filter: A regex that is used to specify where the array(s) of urls are in the json document.
See https://www.npmjs.com/package/stream-json#filter for how this works
transformer: A function taking the raw url object or string from the json document and turning it
into an object suitable to construct Url objects
stringArray: Set to true if the array contains string urls rather than objects.

## Source Input Streams ##
Sources can read data from local files (input: fileName: ''), from urls: (input: url: '') or
from Streaming API Readable object instances (input: stream: new Foo()).

site-mapper ships with the following custom input stream classes:

MultipleHttpInput({urls: ['url1', 'url2', ...]});
Each url is called and it's data parsed by the underlying Source. Really only works with CSV data right now.

PaginatedHttpInput({url, pagination, format, stop})
  url: base url for http requests
  pagination:
    page: 'page' - the name of the paging parameter
    per: 'per' - the name of the limit or per page parameter
    perPage: 100 - the value of the limit or per page parameter
    increment: 1 - the amount to increase the page parameter value for each request
    start: 1 - the value of the page parameter for the first request
  format: 'json' -- if 'json', the paginated responses are wrapped in a json array [ {page1response}, {page2response}, ...]
  stop:
    string: 'foo' - the string to look for in a response that indicates the pagination is over, ie there is no more data. 
