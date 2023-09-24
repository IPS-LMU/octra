module.exports = (config, b) => {
  return {
    ...config,
    output: {
      ...config.output,
      entryFileNames: () => {
        if (config.output.format === 'cjs') {
          return `index.cjs`;
        } else {
          return `index.mjs`;
        }
      },
    },
  };
};
