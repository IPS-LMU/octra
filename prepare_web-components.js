const fs = require('fs-extra');
const concat = require('concat');

const build = async () => {
  const files = [
    'tmp/web-components/main.js',
    'tmp/web-components/polyfills.js',
    'tmp/web-components/runtime.js',
  ];

  await fs.ensureDir('dist/libs/web-components');
  await concat(files, 'dist/libs/web-components/web-components.js');
  await fs.copyFile(
    'apps/web-components/package.json',
    'dist/libs/web-components/package.json'
  );
  await fs.copyFile(
    'tmp/web-components/3rdpartylicenses.txt',
    'dist/libs/web-components/3rdpartylicenses.txt'
  );
  await fs.copyFile(
    'tmp/web-components/LICENSE.txt',
    'dist/libs/web-components/LICENSE.txt'
  );
  console.log('Web-Components Build OK');
};

build();
