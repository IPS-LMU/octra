# OCTRA libraries

**OCTRA 2.0 and its libraries are still in development.**

This sections shows an overview of all custom libraries used by OCTRA. All Angular-specific libraries start with "ngx".

- [ngx-components](https://github.com/IPS-LMU/octra/tree/main/libs/ngx-components): Angular components e.g. for the
  signal displays.
- [annotation](https://github.com/IPS-LMU/octra/tree/main/libs/annotation): Objects and other classes used to handle
  annotation tasks
- [media](https://github.com/IPS-LMU/octra/tree/main/libs/media): all media related classes (for now audio only: audio
  playback a.s.o)
- [ngx-utilities](https://github.com/IPS-LMU/octra/tree/main/libs/ngx-utilities): library with custom functions used in
  angular projects
- [utilities](https://github.com/IPS-LMU/octra/tree/main/libs/utilities): library with custom functions used in the
  other libraries or apps like OCTRA
- [assets](https://github.com/IPS-LMU/octra/tree/main/libs/assets): library with shared assets in octra applications
  e.g. JSON schemata

# Installation

Currently the libraries are not published to npm because Octra 2.0 and the libraries are still in development. If you
want to use the libraries in your project you have to manually install these.

1. Clone the OCTRA repository next to the project folder you want to use the libraries for.
2. In Terminal go to Octra directory and run

  ````shell
  npm install --legacy-peer-deps && npm run build
  ````

3. Now go to you project folder and run

  ````shell
  npm install --legacy-peer-deps "../octra/dist/libs/<library_name>"
  ````

If you change something in the libraries and run `npm run build` again, the changes are automatically available in your project.

# Dependency graph

Run `npm run dep-graph` to view the interactive dependency graph:

![octra_dependency_graph.png](../images/octra_dependency_graph.png)
