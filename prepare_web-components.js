const fs = require('fs-extra');
const concat = require('concat');

const build = async () => {
  const files = [
    'dist/apps/web-components/main.js',
    'dist/apps/web-components/polyfills.js',
    'dist/apps/web-components/runtime.js',
  ];

  await fs.ensureDir('dist/build/web-components');
  await concat(files, 'dist/build/web-components/web-components.js');
  await fs.copyFile("apps/web-components/package.json", 'dist/build/web-components/package.json')
  console.log('Web-Components Build OK');
};

build();
