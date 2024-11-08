# OCTRA libraries

**OCTRA 2.0 and its libraries are still in development.**

This sections shows an overview of all custom libraries used by OCTRA. All Angular-specific libraries start with "ngx".

<table>
<thead>
<tr>
<th>Package</th>
<th>Compatibility</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<a href="./utilities/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Futilities?label=utilities"></a>
</td>
<td>
Browser, NodeJS
</td>
<td>
library with custom functions used in the  other libraries or apps like OCTRA
</td>
</tr>
<tr>
<td>
<a href="./media/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fmedia?label=media"></a>
</td>
<td>
Browser, NodeJS
</td>
<td>
all media related classes without dependencies to dom library
</td>
</tr>
<tr>
<td>
<a href="./web-media/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fweb-media?label=web-media"></a>
</td>
<td>
Browser
</td>
<td>
all media related classes (for now audio only: audio playback a.s.o)
</td>
</tr>
<tr>
<td>
<a href="./assets/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fassets?label=assets"></a>
</td>
<td>
Browser, NodeJS
</td>
<td>
library with shared assets in octra applications e.g. JSON schemata
</td>
</tr>
<tr>
<td>
<a href="./json-sets/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fjson-sets?label=json-sets"></a>
</td>
<td>
Browser, NodeJS
</td>
<td>
This library allows to define a set of valid objects using JSON and valid these.
</td>
</tr>
<tr>
<td>
<a href="./annotation/"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fannotation?label=annotation"></a>
</td>
<td>
Browser, NodeJS
</td>
<td>
Objects and other classes used to handle annotation tasks
</td>
</tr>
<tr>
<td>
<a href="./ngx-components"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fngx-components?label=ngx-components"></a>
</td>
<td>
Angular
</td>
<td>
Angular components e.g. for the signal displays
</td>
</tr>
<tr>
<td>
<a href="./ngx-utilities"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40octra%2Fngx-utilities?label=ngx-utilities"></a>
</td>
<td>
Angular
</td>
<td>
library with custom functions used in angular projects
</td>
</tr>
<tr>
<td>
<a href="../apps/web-components/">web-components</a>
</td>
<td>
Browser
</td>
<td>
library with web-components containing components from ngx-components. These components can be used in other frameworks or Vanilla JS. <a href="../apps/web-components-demo/">See demo</a>.
</td>
</tr>
</tbody>
</table>

## API reference

You find more information about all classes and functions of each library [here](https://ips-lmu.github.io/octra).

## Dependency graph

Run `npm run dep-graph` to view the interactive dependency graph:

![octra_dependency_graph.png](../images/octra_dependency_graph.png)
