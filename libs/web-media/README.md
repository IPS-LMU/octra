# @octra/web-media <a href="https://www.npmjs.com/package/@octra/web-media"><img alt="npm" src="https://img.shields.io/npm/v/@octra/web-media"></a>

This library offers classes and functions for handling audio files in web browsers (e.g. chunked decoding etc.) used by [Octra](https://github.com/IPS-LMU/octra).

## Installation

### ESM, CJS, TS definitions & UMD (optional)

````shell
npm install --save @octra/web-media
````

### UMD Bundle (for Vanilla JS)

You have two options to install this package und use it as UMD:

a) Install via NPM and reference local files (no internet connection needed om production).
````html
<script type="application/javascript" src="node_modules/@octra/web-media/index.js"></script>
````

b) Reference remote file  (internet connection needed on production).
````html
<script type="application/javascript" src="https://unpkg.com/@octra/web-media/index.umd.js"></script>
````

[See full example here](https://github.com/IPS-LMU/octra/blob/main/apps/web-components-demo/index.html)

## Use

### Import

#### ESM, Typescript

Import the classes and functions from `@octra/web-media`. For example

````typescript
import {SampleUnit} from "@octra/web-media";

const unit = new SampleUnit(123123, 22100);
````

#### UMD Bundle

All functions and classes are available via global scope `OctraWebMedia`. For example:

```javascript
/*
make sure that you have injected the umd bundle as described before.
 */
const validator = new OctraWebMedia.SampleUnit(123123, 22100);
```

### API

You can find more information about classes and functions of `@octra/web-media` [here](https://ips-lmu.github.io/octra/modules/_octra_web_media.html).

### Changelog

[Go to changelog](https://github.com/IPS-LMU/octra/blob/main/libs/web-media/CHANGELOG.md)
