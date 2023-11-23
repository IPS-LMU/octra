module.exports = (config, b) => {
  return {
    ...config,
    output: {
      ...config.output
    },
    external: ["@octra/media", "@octra/utilities"]
  };
};
