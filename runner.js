const yargs = require('yargs');
const path = require('path');
const fs = require('fs-extra');
const process = require('node:child_process');
const { exec } = require('node:child_process');
const { pathExists } = require('@nx/eslint-plugin/src/utils/graph-utils');
const crypto = require("crypto");

const JSONValidator = {
  build: async function () {
    await bundleLibrary("json-sets");
  },
};

async function preparePackageJSON(packagePath) {
  if (await fs.pathExists(packagePath)) {
    const json = await fs.readJSON(packagePath);
    if (json.main === './index.cjs.js') {
      json.main = './index.cjs';
    }
    if (json.module === './index.esm.js') {
      json.module = './index.mjs';
    }
    await fs.writeJSON(packagePath, json, {
      spaces: 2,
    });
  }
}

async function bundleLibrary(libraryName) {
  await run(`nx bundle ${libraryName}`);
  await preparePackageJSON(`./dist/libs/${libraryName}/package.json`);
}

const Project = {
  updateLicenses: async function () {
    await fs.copyFile(`./LICENSE.txt`, `./libs/annotation/src/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/assets/src/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/media/src/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/utilities/src/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./apps/web-components/src/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/json-sets/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/ngx-components/LICENSE.txt`);
    await fs.copyFile(`./LICENSE.txt`, `./libs/ngx-utilities/LICENSE.txt`);
  },
  prepareDocs: async function () {
    let content = await fs.readFile(`./docs/index.html`, 'utf-8');
    content = content.replace(/\.\/([^/]+)\/src\//g, (g0, g1) => {
      return `modules/_octra_${g1.replace(/-/g, '_')}.html`;
    });
    content = content.replace(/apps\/([^/]+)\/src\//g, (g0, g1) => {
      return `modules/_octra_${g1.replace(/-/g, '_')}.html`;
    });
    await fs.writeFile(`./docs/index.html`, content, {
      encoding: 'utf-8',
    });
  },
};

const OCTRA = {
  start: async function () {
    await run('npm run modernizr', true, true);
    await run('nx serve', true, false);
  },
  buildProd: async function () {
    await run('node ./build.js dev=false isUpdate=true url=/apps/octra/octra/');
    await setBuildVariable();
  },
  buildRelease: async function () {
    await run('node ./build.js dev=false isUpdate=false url=/');
    await setBuildVariable();
  },
  buildDev: async function () {
    await run(
      'node ./build.js dev=true isUpdate=true url=/apps/octra/octra-dev/'
    );
    await setBuildVariable();
  },
  buildBeta: async function () {
    await run(
      'node ./build.js beta=true isUpdate=true url=/apps/octra/octra-dev/'
    );
    await setBuildVariable();
  },
  prepareExtern: async function () {
    if (fs.pathExistsSync('extern')) {
      fs.emptydirSync('extern');
      fs.rmdirSync('extern');
    }

    fs.copySync('dist/libs', 'extern/libs', { recursive: true });
  },
  buildExtern: async function () {
    await OCTRA.buildLibs();
    await OCTRA.prepareExtern();
  },
  buildLibs: async function () {
    await run('nx build ngx-components');
    await run('nx build ngx-utilities');
    await run(`npm run build:web-components`);
    await JSONValidator.build();
    await bundleLibrary('utilities');
    await bundleLibrary('assets');
    await bundleLibrary('annotation');
    await bundleLibrary('media');
    await bundleLibrary('web-media');
  },
};

yargs
  .version('1.0.0')
  .help()
  .alias('help', 'h')
  .command('start', 'Starts serving OCTRA.', OCTRA.start)
  .command(
    'build:release',
    'Builds release version of OCTRA.',
    OCTRA.buildRelease
  )
  .command('build:prod', 'Builds production version of OCTRA.', OCTRA.buildProd)
  .command('build:dev', 'Builds development version of OCTRA.', OCTRA.buildDev)
  .command('build:beta', 'Builds beta version of OCTRA.', OCTRA.buildBeta)
  .command('build:libs', 'Builds all libraries.', OCTRA.buildLibs)
  .command('build:extern', 'Builds extern libraries.', OCTRA.buildExtern)
  .command('build:json-sets', 'Builds json-sets library.', JSONValidator.build)
  .command(
    'update:licenses',
    'Updates licenses with current version from root.',
    Project.updateLicenses
  )
  .command('prepare:docs', 'Prepares docs', Project.prepareDocs).argv;

async function run(scriptPath, showOutput = true, returnAfterExit = true) {
  return new Promise((resolve, reject) => {
    let output = '';

    const process = exec(scriptPath);

    if (process) {
      process.stdout.on('data', (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });
      process.stdout.on('error', (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });

      process.stderr.on('data', (data) => {
        if (showOutput) {
          if (returnAfterExit) {
            output += data;
          } else {
            console.log(data);
          }
        }
      });

      // what to do when the command is done
      process.on('close', (code) => {
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

async function setBuildVariable() {
  let content = await fs.readFile('./dist/apps/octra/index.html', {
    encoding: 'utf-8',
  });

  const pkg = await fs.readJSON('./package.json', {
    encoding: 'utf-8',
  });

  let hash = crypto.randomUUID();

  content = content.replace(/(var BUILD =)([^;]*)(;)/gs, (g0, g1, g2, g3) => {
    const build = JSON.parse(g2);
    build.version = pkg.version;
    build.timestamp = new Date().toISOString();
    build.hash = hash;

    return `${g1} ${JSON.stringify(build)}${g3}`;
  });

  await fs.writeFile('./dist/apps/octra/index.html', content, { encoding: 'utf-8' });

  console.log(`BUILD-HASH: ${hash}`);
}
