const xml2js = require('xml2js');
const fs = require('fs').promises;

class SpringXMLParser {
  constructor() {
    this.parser = new xml2js.Parser({ 
      explicitArray: false,
      mergeAttrs: true 
    });
  }

  async parseFile(filePath) {
    try {
      const xmlContent = await fs.readFile(filePath, 'utf-8');
      return await this.parseXML(xmlContent);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  async parseXML(xmlContent) {
    try {
      const result = await this.parser.parseStringPromise(xmlContent);
      return this.extractJobs(result);
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  extractJobs(parsedXML) {
    const jobs = [];
    const beans = parsedXML?.beans?.bean || [];
    const beanArray = Array.isArray(beans) ? beans : [beans];

    beanArray.forEach(bean => {
      if (bean.class && (
        bean.class.includes('Job') || 
        bean.class.includes('Step') ||
        bean.class.includes('Tasklet')
      )) {
        const job = {
          id: bean.id,
          name: bean.id || 'unnamed',
          class: bean.class,
          type: this.determineJobType(bean.class),
          dependencies: this.extractDependencies(bean),
          properties: this.extractProperties(bean)
        };
        jobs.push(job);
      }
    });

    return jobs;
  }

  determineJobType(className) {
    if (className.includes('Job')) return 'job';
    if (className.includes('Step')) return 'step';
    if (className.includes('Tasklet')) return 'tasklet';
    return 'unknown';
  }

  extractDependencies(bean) {
    const dependencies = [];
    
    // Check for property references
    if (bean.property) {
      const properties = Array.isArray(bean.property) ? bean.property : [bean.property];
      properties.forEach(prop => {
        if (prop.ref) {
          dependencies.push(prop.ref);
        }
        if (prop.value && prop.value.includes('ref:')) {
          const refMatch = prop.value.match(/ref:(\w+)/);
          if (refMatch) {
            dependencies.push(refMatch[1]);
          }
        }
      });
    }

    // Check for constructor-arg references
    if (bean['constructor-arg']) {
      const args = Array.isArray(bean['constructor-arg']) ? 
        bean['constructor-arg'] : [bean['constructor-arg']];
      args.forEach(arg => {
        if (arg.ref) {
          dependencies.push(arg.ref);
        }
      });
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  extractProperties(bean) {
    const properties = {};
    
    if (bean.property) {
      const props = Array.isArray(bean.property) ? bean.property : [bean.property];
      props.forEach(prop => {
        if (prop.name) {
          properties[prop.name] = prop.value || prop.ref || '';
        }
      });
    }

    return properties;
  }
}

module.exports = SpringXMLParser;
