console.log("postinstall...");

console.log("check if it's a mac");
const isMac = /^darwin/.test(process.platform);
if (isMac === true) {
  const process = require('child_process');
  console.log(`install macos fix...`);
  console.log(`npm install fsevents --no-save`);
  process.execSync('npm install fsevents --no-save');
  console.log(`macos fix installed`);
}
