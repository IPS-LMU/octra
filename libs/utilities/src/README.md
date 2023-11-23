# @octra/utilities <a href="https://www.npmjs.com/package/@octra/utilities"><img alt="npm" src="https://img.shields.io/npm/v/@octra/utilities"></a>

This library offers JS functions and classes to make some parts of app development easier. This library is used by [Octra](https://github.com/IPS-LMU/octra) and Octra-Backend.

## Installation

### ESM, CJS, TS definitions & UMD (optional)

````shell
npm install --save @octra/utilities
````

### UMD Bundle (for Vanilla JS)

You have two options to install this package und use it as UMD:

a) Install via NPM and reference local files (no internet connection needed om production).
````html
<script type="application/javascript" src="node_modules/@octra/utilities/bundles/OctraUtilities.umd.js"></script>
````

b) Reference remote file  (internet connection needed on production).
````html
<script type="application/javascript" src="https://unpkg.com/@octra/utilities/bundles/OctraUtilities.umd.js"></script>
````

[See full example here](../../../apps/web-components-demo/index.html)

## Use

### Import

#### ESM, Typescript

Import the classes and functions from `@octra/utilities`. For example

````typescript
import {getFileSize} from "@octra/utilities";
````

#### UMD Bundle

All functions and classes are available via global scope `OctraUtilities`. For example:

```javascript
/*
make sure that you have injected the umd bundle as described before.
 */
const bytes = 738246364782
const sizeInMb = OctraUtilities.getFileSize(bytes);
```

### API

You can find more information about classes and functions of `@octra/utilities` [here](https://ips-lmu.github.io/octra/modules/_octra_utilities.html).

### Changelog

[Go to changelog](https://github.com/IPS-LMU/octra/blob/main/libs/utilities/CHANGELOG.md)
