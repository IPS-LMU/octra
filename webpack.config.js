// https://webpack.js.org/configuration/output/#outputlibrarytype
// possible libraryTargets in webpack 5: 'var', 'module', 'assign', 'assign-properties', 'this', 'window', 'self', 'global', 'commonjs', 'commonjs2', 'commonjs-module', 'amd', 'amd-require', 'umd', 'umd2', 'jsonp' and 'system'

// type:name collection used in file names
const libraryTypesWithNames = {
  var: 'var',
  module: 'esm',
  assign: 'assign',
  'assign-properties': 'assign-properties',
  this: 'this',
  window: 'window',
  self: 'self',
  global: 'global',
  commonjs: 'commonjs',
  commonjs2: 'commonjs2',
  'commonjs-module': 'commonjs-module',
  amd: 'amd',
  'amd-require': 'amd-require',
  umd: 'umd',
  umd2: 'umd2',
  jsonp: 'jsonp',
  system: 'system',
};

const getLibraryName = (type) => libraryTypesWithNames[type];

const getLibrary = (type, name) => {
  const unsetNameLibraries = ['module', 'amd-require']; // these libraries cannot have a name
  if (unsetNameLibraries.includes(type)) name = undefined;
  return { name, type, umdNamedDefine: true };
};

const modifyEntries = (config, libraryName, libraryTarget) => {
  const mainEntryPath = config.entry.main;
  try {
    delete config.entry.main;
  } catch (error) {
    console.warn(`Could not delete entry.main: ${error}`);
  }

  if (libraryTarget.includes('module')) {
    // https://webpack.js.org/configuration/output/#librarytarget-module
    // for esm library name must be unset and config.experiments.outputModule = true - This is experimental and might result in empty umd output
    config.experiments.outputModule = true;
    config.experiments = {
      ...config.experiments,
      outputModule: true,
    };
  }

  libraryTarget.forEach((type) => {
    config.entry[`${libraryName}.${getLibraryName(type)}`] = {
      import: mainEntryPath,
      library: getLibrary(type, libraryName),
    };
  });

  // @nx/web:webpack runs webpack 2 times with es5 and esm configurations
  const outputFilename = config.output.filename.includes('es5')
    ? config.output.filename
    : '[name].js';
  config.output = {
    ...config.output,
    filename: outputFilename,
  };
};

module.exports = (config, { options }) => {
  const libraryTargets = options.libraryTargets ?? [
    'global',
    'commonjs',
    'amd',
    'umd',
  ];
  const libraryName = options.libraryName;

  config.optimization.runtimeChunk = false;
  modifyEntries(config, libraryName, libraryTargets);

  return config;
};
