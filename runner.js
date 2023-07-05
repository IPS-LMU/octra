const yargs = require("yargs");
const path = require("path");
const fs = require("fs-extra");
const process = require("node:child_process");
const { exec } = require("node:child_process");

const OCTRA = {
  start: async function() {
    await run("npm run modernizr", true, true);
    await run("nx serve", true, false);
  },
  buildProd: async function() {
    await run("node ./build.js dev=false isUpdate=true url=/apps/octra/octra/");
  },
  buildRelease: async function() {
    await run("node ./build.js dev=false isUpdate=false url=/");
  },
  buildDev: async function() {
    await run("node ./build.js dev=true isUpdate=true url=/apps/octra/octra-dev/");
  },
  prepareExtern: async function() {
    if (fs.pathExistsSync("extern")) {
      fs.emptydirSync("extern");
      fs.rmdirSync("extern");
    }

    fs.copySync("dist/libs", "extern/libs", { recursive: true });
  },
  buildExtern: async function() {
    await run("nx build utilities");
    await run("nx build media");
    await run("nx build annotation");
    await run("nx build ngx-components");
    await run("npm run build:assets");
    await run("npm run build:json-set-validator");
    await OCTRA.prepareExtern();
  }
};


const JSONValidator = {
  build: async function() {
    await run("nx build json-set-validator");
    await fs.mkdir("dist/libs/json-sets/src/lib/schema", { recursive: true });
    await fs.copyFile("libs/json-sets/src/lib/schema/json-set.schema.json", "dist/libs/json-sets/src/lib/schema/json-set-validator.schema.json");
  }
};

yargs.version("1.0.0").help().alias("help", "h")
  .command(
    "start", "Starts serving OCTRA.",
    OCTRA.start)
  .command(
    "build:release", "Builds release version of OCTRA.",
    OCTRA.buildRelease)
  .command(
    "build:prod", "Builds production version of OCTRA.",
    OCTRA.buildProd)
  .command(
    "build:dev", "Builds development version of OCTRA.",
    OCTRA.buildDev)
  .command(
    "build:extern", "Builds extern libraries.",
    OCTRA.buildExtern)
  .command(
    "build:json-set-validator", "Builds json-set-validator library.",
    JSONValidator.build)
  .argv;

async function run(scriptPath, showOutput = true, returnAfterExit = true) {
  return new Promise((resolve, reject) => {
    let output = "";

    const process = exec(scriptPath);

    if (process) {
      process.stdout.on("data", (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });
      process.stdout.on("error", (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });

      process.stderr.on("data", (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });

      // what to do when the command is done
      process.on("close", (code) => {
        if (showOutput && returnAfterExit) {
          console.log(output);
        }
        resolve(output);
      });

    } else {
      reject("Can't run script.");
    }
  });
}
