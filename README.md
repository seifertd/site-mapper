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
    "site-mapper": ">= 0.0.7"
  }
}
```

There is nothing stopping you from installing it locally and editing the embedded
configuration files, but that is not the intent.

    npm install site-mapper

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
    "site-mapper": ">= 0.0.7"
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

    ./config/production.coffee

or

    ./config/production.js

If you want to use coffeescript for configuration, you will have to add 
the coffee script module as a dependency:

```json
{
  "dependencies": {
    "site-mapper": ">= 0.0.7"
    ,"coffee-script-redux": ">0"
  }
}
```

The configuration file can contain any of the following keys.  The
values below are defaults that will be used unless overridden in your
configuration file.

```coffee
config = {}
config.sources = {}
config.targetDirectory = "#{process.cwd()}/tmp/sitemaps/#{config.env}"
config.sitemapIndex = "sitemap.xml"
config.sitemapRootUrl = "http://www.mysite.com"
config.sitemapFileDirectory = "/sitemaps"
config.sitemapIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
config.sitemapHeader = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9/">'
config.maxUrlsPerFile = 50000
config.urlBase = "http://www.mysite.com"
config.defaultUrlFormatter = (href) ->
  if '/' == href
    config.urlBase
  else if href && href.length && href[0] == '/'
    "#{config.urlBase}#{href}"
  else if href && href.length && href.match(/^https?:\/\//)
    href
  else
    if href.length
      "#{config.urlBase}/#{href}"
    else
      config.urlBase

module.exports = config
```

The sources object contains arbitrarily named keys pointing at objects with the
following keys: type, options.  The type is either one of the built in Source
types (see below) or a site specific class derived from the Source base class.
See the test suite for examples of creating Source subclasses.

A minimal config might be:

```coffee
{StaticSetSource, HttpSource} = require 'site-mapper'
appConfig =
  sitemapRootUrl: "http://staging.mysite.com"
  urlBase: "http://staging.mysite.com"
  sitemapIndex: "sitemap_index.xml"
  sources:
    staticUrls:
      type: StaticSetSource
      options:
        channel: 'static'
        changefreq: 'weekly'
        priority: 1
        urls: [
          '/',
          '/about',
          '/faq',
          '/jobs'
        ]
    serviceUrls:
      type: HttpSource
      options:
        changefreq: 'weekly'
        priority: 0.8
        serviceUrl: "http://api.mysite.com/widgets"
      channelForUrl: (url) ->
        url.category
      bodyProcessor: (body) ->
        urls = JSON.parse(body)
        map urls, (url) ->
          {permalink: url.permalink, updatedAt: url.updated_at, category: url.category}
      urlFormatter: (url) ->
        "http://www.mysite.com/widgets/#{url.category}/#{url.permalink}"

module.exports = appConfig
```

### Running the Code ###

Finally, putting it all together, you can generate the sitemaps as follows:

  1. Install all the dependencies:
         ```
         rm -rf node_modules;
         npm install
         ```
  1. Run the generator:
         ```
         NODE_ENV=staging ./node_modules/.bin/site-mapper
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

COFFEE=./node_modules/.bin/coffee
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


    +--------+          +------------+        +--------------+       +---------+
    | Source |          | SiteMapper |        | SitemapGroup |       | Sitemap |
    |--------|produces  |------------|  adds  |--------------| adds  |---------|
    |        +--------->|            |------->|              |------>|         |
    |        |  urls    |            |  urls  |              | urls  |         |
    +--------+          +------------+        +--------------+       +---------+

### Sources ###

There are three included Source implementations:

  1.  StaticSetSource - This source is configured with a static list of urls
      in a configuration file.
  1.  CsvFileSource - Reads a list of urls from a CSV file.
  1.  HttpSource - Reads urls from a HTTP service

The urls produced by Source objects can be simple strings or objects, if finer 
grained control of sitemap.xml tag values is required.

### URL Channel ###

Each url is associated with a channel.  The channel can be set per source, derived from
the url path or set explicitly if the url is an object.  The channel is used to 
name individual sitemap files.  The default behavior is to take the first path
segment as the channel.  Thus, the url

    /stuff/path/to/stuff.html

would be assigned to the 'stuff' channel and would be put in sitemaps named
stuff0.xml.gz, stuff1.xml.gz, etc.

### Sitemap Groups ###

A sitemap group is created for each URL channel.  As urls are added to their corresponding
SitemapGroup, the group will create sequentially numbered Sitemap files, each containing a
configurable number of urls, 50,000 by default.  The name of the sitemap files is of
the form

    ${CHANNEL}${SEQUENCE}.xml.gz

### Sitemap Index and Files ###

site-mapper will create a sitemap index and as many sitemap files as are required.  The
sitemap files are gzipped.  There is no way to turn gzipping off.

### Publishing Sitemaps to Search Engines ###

It is up to you how you expose the site maps generated by site mapper to Google and other 
search engines.  Each company does this differently, so there are no default publishing
mechanisms in site-mapper.

## Tests ##

make test

This should install all dependencies, compile the coffeescript files into
javascript and run the test suite
