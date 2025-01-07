# @octra/json-sets <a href="https://www.npmjs.com/package/@octra/json-sets"><img alt="npm" src="https://img.shields.io/npm/v/@octra/json-sets"></a>

This library allows to define sets using JSON. JSONSetValidator parsed an array of objects and validates it using the JSON definition.

## Installation

### ESM, CJS, TS definitions & UMD (optional)

```shell
npm install --save @octra/json-sets
```

### UMD Bundle (for Vanilla JS)

You have two options to install this package und use it as UMD:

a) Install via NPM and reference local files (no internet connection needed om production).

```html
<script type="application/javascript" src="node_modules/@octra/json-sets/index.umd.js"></script>
```

b) Reference remote file (internet connection needed on production).

```html
<script type="application/javascript" src="https://unpkg.com/@octra/json-sets/index.umd.js"></script>
```

[See full example here](https://github.com/IPS-LMU/octra/tree/main/apps/web-components-demo)

## Use

### Import

#### ESM, Typescript

Import the classes and functions from `@octra/json-sets`. For example

```typescript
import { JsonSetValidator } from '@octra/json-sets';
```

#### UMD Bundle

All functions and classes are available via global scope `OctraJSONSets`. For example:

```javascript
/*
make sure that you have injected the umd bundle as described before.
 */
const validator = new OctraJSONSets.JSONSetValidator();
```

### API

You can find more information about classes and functions of `@octra/json-sets` [here](https://ips-lmu.github.io/octra/modules/_octra_json_sets.html).

### Changelog

[Go to changelog](https://github.com/IPS-LMU/octra/blob/main/libs/json-sets/CHANGELOG.md)
