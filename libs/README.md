# OCTRA libraries

**OCTRA 2.0 and its libraries are still in development.**

This sections shows an overview of all custom libraries used by OCTRA. All Angular-specific libraries start with "ngx".


- [utilities](./utilities/src/): library with custom functions used in the
  other libraries or apps like OCTRA
- [media](./media/src/): all media related classes (for now audio only: audio
  playback a.s.o)
- [assets](./assets/src/): library with shared assets in octra applications
  e.g. JSON schemata
- [annotation](./annotation/src/): Objects and other classes used to handle
  annotation tasks
- [ngx-components](./ngx-components/): Angular components e.g. for the
  signal displays.
- [ngx-utilities](./ngx-utilities/): library with custom functions used in
  angular projects
- [web-components](../apps/web-components/): library with web-components containing components from ngx-components. These components can be used in other frameworks or Vanilla JS. [See demo](../apps/web-components-demo/).

# Installation

Currently, the libraries are not published to npm because Octra 2.0 and the libraries are still in development. If you
want to use the libraries in your project you have to manually install these.

1. Clone the OCTRA repository next to the project folder you want to use the libraries for.
2. In Terminal go to Octra directory and run

```shell
npm install --legacy-peer-deps && npm run build:libs
```

3. Now go to your project folder and run

```shell
npm install --legacy-peer-deps "../octra/dist/libs/<library_name>"
```

If you change something in the libraries and run `npm run build:libs` again, the changes are automatically available in your project.

# Dependency graph

Run `npm run dep-graph` to view the interactive dependency graph:

![octra_dependency_graph.png](../images/octra_dependency_graph.png)
