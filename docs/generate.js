import { operations } from '../packages/web/utils/operations.js'
import { SECTION_NAMES } from '../packages/bumblebee-utils/src/index.js'

const glob = require("glob")
const path = require("path")
const fs = require('fs');

let docOperations = operations.filter(operation => operation.doc);

function getGeneratedScreenshot (name, type) {
  let files = glob.sync(`./docs/screenshots/*/${type}/${name}--0.png`)
  if (files.length) {
    var dir = path.dirname(`./docs/screenshots/*`);
    let result = `${dir}/${type}/${name}.png`;
    fs.renameSync(files[0], result);
    console.log(`Found and renamed ${type} screenshot for ${name}`)
    return result;
  }
}

function getScreenshot (name, type) {
  let generated = getGeneratedScreenshot(name, type);
  if (generated) {
    return generated;
  } else {
    let ready = glob.sync(`./docs/screenshots/${type}/${name}.png`);
    if (ready[0]) {
      console.log(`Found ${type} screenshot for ${name}`)
      return ready[0];
    }
  }
}

function createFile (name, str) {
  let fileName = `${name}.md`;
  fs.writeFile(`docs/${fileName}`, str, (err) => { if (err) throw err; });
  return `${fileName}`
}

function _summary (obj, str = '', level = 0) {
  if (typeof obj === "string") {
    str += obj;
    str += '\n';
  } else {
    for (const key in obj) {
      const element = obj[key];
      if (typeof element !== "string") {
        for (let i = 0; i < level; i++) {
          str += '  ';
        }
        str += '* ';
        str += SECTION_NAMES[key];
        str += '\n';
      }
      str = _summary(element, str, level+1);
    }
  }

  return str
}

function generateSummary (summary) {

  let str = _summary(summary);

  // for (const sectionKey in summary) {
  //   const section = summary[sectionKey];
  //   str += `* ${sectionKey}\n`;
  //   if (typeof section === "string") {
  //     str += `${section}\n`;
  //   } else {
  //     for (const itemKey in section) {
  //       const element = section[itemKey];
  //       if (typeof element === "string") {
  //         str += `${element}\n`;
  //       } else {
  //         for const
  //       }
  //     }
  //   }
  // }
  var text = fs.readFileSync('docs/_SUMMARY.md','utf8')
  text = text.replace('{{transformation}}', str)
  createFile(`SUMMARY`, text)
}

const app = function () {

  let summary = [];

  docOperations.forEach(operation => {
    let str = "";
    let doc = operation.doc;

    if (doc.title) {
      str += `# ${doc.title}`;
    }

    if (doc.description) {
      str += `\n${doc.description}`;
    }

    let location = getScreenshot(operation.command, 'location');

    if (location) {
      str += `\n## Location`;
      str += `\n![${doc.title} on the interface](../.${location})`;
    } else {
      console.warn(`No location screenshot found for ${operation.command}`)
    }

    if (doc.fields && doc.fields.length) {
      str += `\n## Fields`;
      str += `\n| Field | Type | Description |`;
      str += `\n| :--- | :--- | :--- |`;
      doc.fields.forEach(field => {
        str += `\n| ${field.name || ''} | ${field.type || ''} | ${field.description || ''} |`;
      });

    }

    let table = getScreenshot(operation.command, 'table');

    if (table) {
      str += `\n## Example`;
      let form = getScreenshot(operation.command, 'form');
      if (form) {;
        str += `\n![${doc.title} fields](../.${form})`;
      }
      str += `\n![${doc.title} example](../.${table})`;
    } else {
      console.warn(`No table screenshot found for ${operation.command}`);
    }

    if (operation.section !== 'DATASET') {
      let fileName = createFile(`transformation/${operation.command}`, str);
      summary[operation.section] = summary[operation.section] || {};
      if (operation.group) {
        summary[operation.section][operation.group] = summary[operation.section][operation.group] || {};
        summary[operation.section][operation.group][operation.command] = `    * [${doc.title}](${fileName})`;
      } else {
        summary[operation.section][operation.command] = `  * [${doc.title}](${fileName})`;
      }
    }

  });

  generateSummary(summary)

}

app();
