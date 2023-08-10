/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    "entryPoints": [
        "libs/*",
        "apps/web-components"
    ],
    "name": "Octra libraries",
    "entryPointStrategy": "packages",
    "includeVersion": true,
    "out": "docs",
    readme: "libs/README.md",
    plugin: ["typedoc-plugin-replace-text"]
};





