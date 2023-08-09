const fs = require('fs-extra');
const concat = require('concat');

const build = async () => {
  const files = [
    'dist/libs/web-components/main.js',
    'dist/libs/web-components/polyfills.js',
    'dist/libs/web-components/runtime.js',
  ];

  await fs.ensureDir('dist/libs/web-components');
  await concat(files, 'dist/libs/web-components/web-components.js');
  await fs.copyFile("apps/web-components/package.json", 'dist/libs/web-components/package.json')
  console.log('Web-Components Build OK');
};

build();
