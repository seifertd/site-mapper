import {escapeXmlValue} from './xml_escape';

const NOW = new Date();

export class Url {
  constructor(attributes) {
    Object.assign(this, attributes);
    if (this.lastModified && !(this.lastModified instanceof Date)) {
      this.lastModified = new Date(this.lastModified);
    } else if (!this.lastModified) {
      this.lastModified = NOW;
    }
  }
  toXml() {
    let xml = `<url><loc>${escapeXmlValue(this.url)}</loc>`;
    if (this.lastModified) {
      xml += `<lastmod>${this.lastModified.toISOString()}</lastmod>`;
    }
    if (this.changeFrequency) {
      xml += `<changefreq>${this.changeFrequency}</changefreq>`;
    }
    if (this.priority) {
      xml += `<priority>${this.priority}</priority>`;
    }
    if (this.imageUrl) {
      xml += `<image:image><image:loc>${escapeXmlValue(this.imageUrl)}</image:loc></image:image>`;
    }
    if (this.linkTags) {
      this.linkTags.forEach( (linkTag) => {
        xml += `<xhtml:link rel="${escapeXmlValue(linkTag.rel)}" href="${escapeXmlValue(linkTag.href)}"/>`;
      });
    }
    xml += "</url>";
    return xml;
  }
}
