const fs = require("fs");
let json = "";

function generate(filename, variableName) {
  json = fs.readFileSync(`libs/assets/src/lib/schemata/${filename}.schema.json`, {encoding: "utf-8"}).replace(/"/g, "'");
  fs.writeFileSync(`libs/assets/src/lib/schemata/${filename}.schema.ts`, `/*
  ! This file is automatically generated using its json variant. Change only the json file.
*/

  export const ${variableName} = ${json};`);
}

generate("projectconfig", "OctraProjectConfigJSONSchema");
generate("guidelines", "OctraGuidelinesJSONSchema");
generate("logging", "OctraLoggingJSONSchema");
