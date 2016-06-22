See: https://github.com/seifertd/site-mapper/releases for latest release notes


1.2.1 / 2015-08-26
* Allow configuration to ignore source errors

1.2.0 / 2015-08-17
* Use finish events to determine when file output is done
* Change generator function to allow err and result objects on completion callback

1.1.9 / 2015-08-03
* Change sitemap generation to be serial to avoid killing cpu with large sitemaps

1.1.8 / 2015-04-03
* BUGFIX: Escape urls in sitemaps

1.1.7 / 2015-03-19
* HTML source passes on all url attributes
* Add ability to configure a url filter on a source

1.1.6 / 2015-03-19
* Add xmlns:xhtml namespace declaration

1.1.5 / 2015-03-13
* Encode link tag using xml attribute escape function

1.1.4 / 2015-03-13
* Encode link tag attributes

1.1.3 / 2015-03-13
* Remove use of link reserved word.

1.1.2 / 2015-02-26
* Make sure to add </url> close tag. Add test to make sure
  this doesn not happen again

1.1.1 / 2015-02-26
* Support xhtml:link elements in urls

1.1.0 / 2015-02-13
* Add ability to output to stream instead of stdout

1.0.2 / 2015-01-21
* Do not blow up if http request returns empty body

1.0.0 / 2014-05-29
* Allow multiple sitemap definitions per environment

0.1.0 / 2014-05-20
------------------
* Export the Source base class

0.0.13 / 2014-05-20
------------------
* Fix csv dependency to 0.3.x

0.0.12 / 2014-02-24
------------------
* Fix problem with dependency references in package.json

0.0.11 / 2014-01-13
------------------
* If a http source generates no urls, return error

0.0.10 / 2013-12-16
------------------
* Make sure sitemap files are flushed and closed

0.0.9 / 2013-11-18
------------------
* Shore up CSV and HTTP source error handling

0.0.8 / 2013-11-15
------------------
* Documentation update

0.0.7 / 2013-11-13
------------------
* Handle sitemap image urls in HTTP source

0.0.6 / 2013-11-13
------------------
* Fix missing fixture

0.0.4 / 2013-11-12
------------------
* Add CSV source

0.0.2 / 2013-11-11
------------------
* New release task

0.0.1 / 2013-11-07
------------------
* Intial release.
