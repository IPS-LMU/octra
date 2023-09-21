/** @type { import('typedoc').TypeDocOptionMap & import('typedoc-plugin-replace-text').Config } */
module.exports = {
  extends: ['../../typedoc.base.config.cjs'],
  entryPoints: ['src/index.ts'],
  out: './docs',
  readme: 'src/README.md',
};
