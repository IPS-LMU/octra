/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  extends: ['../../typedoc.base.config.cjs'],
  entryPoints: ['src/index.ts'],
  out: './docs',
  readme: 'README.md',
};
