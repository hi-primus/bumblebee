import { operations } from '../packages/web/utils/operations.js'

const glob = require("glob")
const path = require("path")
const fs = require('fs');

let docOperations = operations.filter(operation => operation.doc)

function getGeneratedScreenshot (name, type) {
  let files = glob.sync(`./docs/screenshots/*/${type}/${name}--*.png`)
  if (files.length) {
    var dir = path.dirname(`./docs/screenshots/*`);
    let result = `${dir}/${type}/${name}.png`;
    fs.renameSync(files[0], result);
    console.log(`Found and renamed ${type} screenshot for ${name}`)
    return result;
  }
}

function getScreenshot (name, type) {
  let ready = glob.sync(`./docs/screenshots/${type}/${name}.png`);
  if (!ready[0]) {
    return getGeneratedScreenshot(name, type);
  } else {
    console.log(`Found ${type} screenshot for ${name}`)
    return ready[0];
  }
}

function createFile (name, str) {
  fs.writeFile(`docs/transformations/${name}.md`, str, (err) => { if (err) throw err; });
}

const app = function () {

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
      str += `\n![${operation.command} location](../.${location})`
    }

    if (doc.fields && doc.fields.length) {
      str += `\n## Fields`;
      str += `\nField | Type | Description`;
      str += `\n----- | ---- | -----------`;
      doc.fields.forEach(field => {
        str += `\n${field.name || ''} | ${field.type || ''} | ${field.description || ''}`;
      });

    }

    let table = getScreenshot(operation.command, 'table');
    if (table) {
      str += `\n## Example`;
      let form = getScreenshot(operation.command, 'form');
      if (form) {
        str += `\n### Fields`;
        str += `\n![${operation.command} form](../.${form})`
      }
      str += `\n### Preview`;
      str += `\n![${operation.command} table](../.${table})`
    }
    createFile(operation.command, str)
  });

}

app();
