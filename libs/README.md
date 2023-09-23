# OCTRA libraries

**OCTRA 2.0 and its libraries are still in development.**

This sections shows an overview of all custom libraries used by OCTRA. All Angular-specific libraries start with "ngx".


- [utilities](./utilities/src/): library with custom functions used in the  other libraries or apps like OCTRA (Browser, NodeJS)
- [media](./media/src/): all media related classes without dependencies to dom library (Browser, NodeJS).
- [web-media](./web-media/src/): all media related classes (for now audio only: audio playback a.s.o) (Browser)
- [assets](./assets/src/): library with shared assets in octra applications e.g. JSON schemata (Browser, NodeJS)
- [annotation](./annotation/src/): Objects and other classes used to handle annotation tasks (Browser, NodeJS)
- [ngx-components](./ngx-components/): Angular components e.g. for the signal displays.
- [ngx-utilities](./ngx-utilities/): library with custom functions used in angular projects
- [web-components](../apps/web-components/src/): library with web-components containing components from ngx-components. These components can be used in other frameworks or Vanilla JS. [See demo](../apps/web-components-demo/).

## API reference

You find more information about all classes and functions of each library [here](https://ips-lmu.github.io/octra).

## Dependency graph

Run `npm run dep-graph` to view the interactive dependency graph:

![octra_dependency_graph.png](../images/octra_dependency_graph.png)
