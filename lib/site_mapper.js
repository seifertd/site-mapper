const {config} = require('./config');
const fs = require('fs');
const {finished} = require('stream/promises');
const Sitemap = require('./sitemap');

module.exports = class SiteMapper {
  constructor(sitemapConfig) {
    this.sitemapConfig = Object.assign({}, config.defaultSitemapConfig, sitemapConfig);
    config.log.info('Site mapper config ', this.sitemapConfig);
    let buildDir = (parentPath, nextPath) => {
      let fullPath;
      if (parentPath.length > 0 && parentPath != "/") {
        fullPath = `${parentPath}/${nextPath}`;
      } else {
        fullPath = `${parentPath}${nextPath}`;
      }
      if (fullPath != "." && fullPath != "") {
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath);
        }
      } else if (fullPath == "") {
        fullPath = "/";
      }
      return fullPath;
    };

    this.sitemapConfig.targetDirectory.split('/').reduce(buildDir, '');
    this.sources = this.initializeSources();
    this.sitemaps = [];
  }
  initializeSources() {
    let sources = [];
    let buildSource = (sourceDefinition, sourceName) => {
      let sourceConfig = sourceDefinition(this.sitemapConfig);
      let sourceClass = sourceConfig.type;
      let sourceOptions = sourceConfig.options;
      config.log.trace(`Building source ${sourceName} with options `, sourceOptions);
      if (!sourceOptions.siteMap.urlFormatter) {
        sourceOptions.siteMap.urlFormatter = config.defaultUrlFormatter(this.sitemapConfig);
      }
      sourceOptions.name = sourceName;
      return new sourceClass(sourceOptions);
    };
    config.log.info("Initializing sources");
    let includes = this.sitemapConfig.sources && this.sitemapConfig.sources.includes;
    let excludes = this.sitemapConfig.sources && this.sitemapConfig.sources.excludes;
    for (const [sourceName, sourceDefinition] of Object.entries(config.sources)) {
      if (includes && includes.length > 0) {
        // If there is an explicit includes list, only include sources in this list
        if (includes.indexOf(sourceName) >= 0) {
          config.log.info(` -> Explicit include of source ${sourceName}`);
          sources.push(buildSource(sourceDefinition, sourceName));
        }
      } else {
        if (excludes && excludes.indexOf(sourceName) >= 0) {
          config.log.info(` -> Explicit exclude of source ${sourceName}`);
          continue;
        }
        config.log.info(` -> Including ${sourceName} since it is not explicitly excluded`);
        sources.push(buildSource(sourceDefinition, sourceName));
      }
    }
    if (sources.length <= 0) {
      throw new Error(`No sitemap source definitions matched includes: ${includes}`);
    }
    config.log.info(`Initialized ${sources.length} sources`);
    return sources;
  }
  async generateSitemap(done) {
    try {
      await this.generateFiles();
      await this.generateIndices();
      if (done) done(null);
    } catch (err) {
      if (done) done(err);
      else throw err;
    }
  }
  async generateIndices() {
    this.indexFiles = {};
    config.log.info('Creating sitemap index files ...');
    const openIndex = fileName => {
      const indexStream = fs.createWriteStream(fileName);
      indexStream.write(config.sitemapIndexHeader);
      return indexStream;
    }
    const closeIndex = fileStream => {
      fileStream.write("</sitemapindex>");
      fileStream.end();
    }
    this.sitemaps.forEach((sitemap) =>{
      const sitemapIndexName = sitemap.source.indexFile || 'default';
      if (!this.indexFiles[sitemapIndexName]) {
        const sitemapFile = `${this.sitemapConfig.targetDirectory}/${sitemapIndexName === 'default' ? this.sitemapConfig.sitemapIndex : sitemapIndexName}`;
        this.indexFiles[sitemapIndexName] = {
          name: sitemapFile,
          file: openIndex(sitemapFile)
        }
      }
      sitemap.allFiles().forEach( file => this.indexFiles[sitemapIndexName].file.write(file.toIndexXml()) );
    });
    await Promise.all(Object.keys(this.indexFiles).map(indexFile => {
      return new Promise((resolve, reject) => {
        this.indexFiles[indexFile].file.once("finish", resolve);
        this.indexFiles[indexFile].file.once("error", reject);
        closeIndex(this.indexFiles[indexFile].file);
      });
    }));
  }
  async generateFiles() {
    for (const source of this.sources) {
      config.log.info(`Generating sitemap(s) for source ${source.name}`);
      const sitemap = new Sitemap({source: source, sitemapConfig: this.sitemapConfig});

      await new Promise((resolve, reject) => {
        sitemap.on('error', (err) => {
          if (source.ignoreErrors) {
            config.log.warn(`Ignoring error by configuration`, err);
            resolve();
          } else {
            reject(err);
          }
        });
        sitemap.once('finish', async () => {
          try {
            sitemap.closeRemaining();
            await Promise.all(sitemap.allFiles().map(f => finished(f.file)));
            this.sitemaps.push(sitemap);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        sitemap.open();
      });
    }
  }
}
