const yargs = require('yargs');
const path = require('path');
const fs = require('fs-extra');
const process = require('node:child_process');
const { exec } = require('node:child_process');
const { pathExists } = require('@nx/eslint-plugin/src/utils/graph-utils');
const crypto = require('crypto');

const JSONValidator = {
  build: async function () {
    await buildLibrary('json-sets');
  },
};

async function buildLibrary(libraryName) {
  if (await pathExists(`dist/libs/${libraryName}`)) {
    await fs.rm(`dist/libs/${libraryName}`, {
      recursive: true
    })
  }
  await run(`nx build ${libraryName} --skip-nx-cache`);
  await fs.copyFile(
    `libs/${libraryName}/LICENSE.txt`,
    `dist/libs/${libraryName}/LICENSE.txt`
  );
  await fs.copyFile(
    `libs/${libraryName}/README.md`,
    `dist/libs/${libraryName}/README.md`
  );
  await fs.copyFile(
    `libs/${libraryName}/CHANGELOG.md`,
    `dist/libs/${libraryName}/CHANGELOG.md`
  );
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
    let content = await fs.readFile(`./typedocs/index.html`, 'utf-8');
    content = content.replace(/\.\/([^/]+)\/src\//g, (g0, g1) => {
      return `modules/_octra_${g1.replace(/-/g, '_')}.html`;
    });
    content = content.replace(/apps\/([^/]+)\/src\//g, (g0, g1) => {
      return `modules/_octra_${g1.replace(/-/g, '_')}.html`;
    });
    await fs.writeFile(`./typedocs/index.html`, content, {
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
  buildBetaDevUpdate: async function () {
    await run(
      'node ./build.js beta=dev isUpdate=true url=/apps/octra/octra-dev/'
    );
    await setBuildVariable();
  },
  buildBetaProdUpdate: async function () {
    await run(
      'node ./build.js beta=true isUpdate=true url=/apps/octra/octra-2/'
    );
    await setBuildVariable();
  },
  buildBetaProd: async function () {
    await run('node ./build.js beta=true isUpdate=false url=/');
    await setBuildVariable();
    await fs.rm('dist/apps/octra/media', { recursive: true });
    await fs.rm('dist/apps/octra/config/appconfig.json');
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
    await buildLibrary('ngx-components');
    await buildLibrary('ngx-utilities');
    await run(`node prepare_web-components.js`);
    await fs.copyFile(
      `apps/web-components/src/README.md`,
      `dist/libs/web-components/README.md`
    );
    await fs.copyFile(
      `apps/web-components/CHANGELOG.md`,
      `dist/libs/web-components/CHANGELOG.md`
    );
    await JSONValidator.build();
    await buildLibrary('utilities');
    await OCTRA.buildAssets();
    await buildLibrary('annotation');
    await buildLibrary('media');
    await buildLibrary('web-media');
  },
  buildAssets: async function () {
    await buildLibrary('assets');
    await fs.copyFile(
      './libs/assets/src/lib/schemata/inputs_outputs.set.json',
      './dist/libs/assets/lib/schemata/inputs_outputs.set.json'
    );
    await fs.copyFile(
      './libs/assets/src/lib/schemata/guidelines.schema.json',
      './dist/libs/assets/lib/schemata/guidelines.schema.json'
    );
    await fs.copyFile(
      './libs/assets/src/lib/schemata/logging.schema.json',
      './dist/libs/assets/lib/schemata/logging.schema.json'
    );
    await fs.copyFile(
      './libs/assets/src/lib/schemata/projectconfig.schema.json',
      './dist/libs/assets/lib/schemata/projectconfig.schema.json'
    );
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
  .command(
    'build:prod:beta',
    'Builds prod beta version of OCTRA.',
    OCTRA.buildBetaProd
  )
  .command(
    'build:prod:update:beta',
    'Builds prod beta update version of OCTRA.',
    OCTRA.buildBetaProdUpdate
  )
  .command(
    'build:dev:update:beta',
    'Builds dev beta update version of OCTRA.',
    OCTRA.buildBetaDevUpdate
  )
  .command('build:libs', 'Builds all libraries.', OCTRA.buildLibs)
  .command(
    'build:lib [library]',
    'Builds a library.',
    (yargs) =>
      yargs.positional('library', {
        describe: 'library name',
      }),
    (argv) => {
      buildLibrary(argv.library);
    }
  )
  .command('build:assets', 'Builds assets library.', OCTRA.buildAssets)
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

  await fs.writeFile('./dist/apps/octra/index.html', content, {
    encoding: 'utf-8',
  });

  console.log(`BUILD-HASH: ${hash}`);
}
