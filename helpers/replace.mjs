import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

function replacePreTags(children) {
  for (const domElement of children) {
    if (domElement.tagName === 'PRE') {
      console.log(`REMOVED PRE!`);
      domElement.remove();
    } else {
      replacePreTags(domElement.children);
    }
  }
}

async function main() {
  let html = await readFile("replace.html", "utf8");

  console.log("read html");
  const dom = new JSDOM(html);

  replacePreTags(dom.window.document.body.children);

  await writeFile("replace_result.html", dom.serialize(), "utf8");
}

main();
