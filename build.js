const fs = require("fs");
const { execSync, spawn } = require("child_process");

const buildDir = "dist/apps/octra/";
const targetFolder = "assets";
let baseHref = "";
let dev = "";

const excludedList = ["config", "LICENSE.txt", "media"];

let isUpdate = false;

let timeNow = getDateTimeString();
let version = "";

const packageText = fs.readFileSync("./package.json", {
  encoding: "utf8"
});
const json = JSON.parse(packageText);
version = json.version;

if (process.argv[2] === "dev=true") {
  dev = "--configuration=development";
}

if (process.argv[2] === "beta=true") {
  dev = "--configuration=beta";
}

if (process.argv[2] === "beta=dev") {
  dev = "--configuration=beta-dev";
}

if (process.argv[3] === "isUpdate=true") {
  isUpdate = true;
}

if (process.argv[4].indexOf("url=") > -1) {
  baseHref = process.argv[4].replace("url=", "");
}

console.log(`Building OCTRA with ${dev}, isUpdate=${isUpdate} for ${baseHref}`);
console.log(`Remove dist...`);
execSync(`rm -rf "./${buildDir}"`);
let command = ["./node_modules/nx/bin/nx.js", "build",  "octra", "--prod", dev, `--base-href=${baseHref}`, `--deploy-url=assets/`, "--skip-nx-cache"];

if (dev !== "") {
  command.splice(3, 1);
} else {
  command.splice(4, 1);
}
console.log(command.join(" "));

const node = spawn("node", command);
node.stdout.on("data", function(data) {
  console.log(data.toString());
});

node.stderr.on("data", function(data) {
  console.log(data.toString());
});

node.on("error", function(data) {
  console.log(data.toString());
});

node.on("exit", function(code) {
  console.log("child process exited with code " + code.toString());

  if (isUpdate) {
    execSync(`rm -rf "./${buildDir}config" "./${buildDir}media" "./${buildDir}.htaccess"`);
  }

  const items = fs.readdirSync(`./${buildDir}`, {
    encoding: "utf8"
  });

  for (const item of items) {
    let found = false;
    for (const excluded of excludedList) {
      if (excluded === item) {
        found = true;
        break;
      }
    }
    if (item !== "index.html" && item !== "ocb_info.json" && item !== targetFolder && !found) {
      execSync(`mv "./${buildDir}${item}" "./${buildDir}${targetFolder}/${item}"`);
    }
  }

  if (!isUpdate) {
    execSync(`mv "./${buildDir}assets/.htaccess" "./${buildDir}.htaccess"`);
  } else {
    execSync(`rm "./${buildDir}assets/.htaccess"`);
  }
});

function getDateTimeString() {
  const today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let h = today.getHours();
  let min = today.getMinutes();
  let sec = today.getSeconds();

  const yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  if (h < 10) {
    h = "0" + h;
  }
  if (min < 10) {
    min = "0" + min;
  }
  if (sec < 10) {
    sec = "0" + sec;
  }
  return `${yyyy}-${mm}-${dd} ${h}:${min}:${sec}`;
}
