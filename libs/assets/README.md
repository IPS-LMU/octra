# @octra/assets <a href="https://www.npmjs.com/package/@octra/assets"><img alt="npm" src="https://img.shields.io/npm/v/@octra/assets"></a>

This library contains assets like JSON schema definitions.

## Installation

### ESM, CJS, TS definitions & UMD (optional)

```shell
npm install --save @octra/assets
```

### UMD Bundle (for Vanilla JS)

You have two options to install this package und use it as UMD:

a) Install via NPM and reference local files (no internet connection needed om production).

```html
<script type="application/javascript" src="node_modules/@octra/assets/index.umd.js"></script>
```

b) Reference remote file (internet connection needed on production).

```html
<script type="application/javascript" src="https://unpkg.com/@octra/assets/index.umd.js"></script>
```

[See full example here](https://github.com/IPS-LMU/octra/tree/main/apps/web-components-demo)

## Use

### Import

#### ESM, Typescript

Import the classes and functions from `@octra/assets`. For example

```typescript
import { OctraGuidelinesJSONSchema } from '@octra/assets';
```

#### UMD Bundle

All functions and classes are available via global scope `OctraAssets`. For example:

```javascript
/*
make sure that you have injected the umd bundle as described before.
 */
const guidelinesJSONSchema = OctraAssets.OctraGuidelinesJSONSchema;
```

### API

You can find more information about classes and functions of `@octra/assets` [here](https://ips-lmu.github.io/octra/modules/_octra_assets.html).
