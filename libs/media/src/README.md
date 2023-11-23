# @octra/media <a href="https://www.npmjs.com/package/@octra/media"><img alt="npm" src="https://img.shields.io/npm/v/@octra/media"></a>

This library offers classes that describes data related to media (e.g. SampleUnit class that describes one point in time of type sample with conversions to other time units) used by [Octra](https://github.com/IPS-LMU/octra).
If you are looking for decoding and playback of audio files see @octra/web-media library.

## Installation

### ESM, CJS, TS definitions & UMD (optional)

````shell
npm install --save @octra/media
````

### UMD Bundle (for Vanilla JS)

You have two options to install this package und use it as UMD:

a) Install via NPM and reference local files (no internet connection needed om production).
````html
<script type="application/javascript" src="node_modules/@octra/media/bundles/OctraMedia.umd.js"></script>
````

b) Reference remote file  (internet connection needed on production).
````html
<script type="application/javascript" src="https://unpkg.com/@octra/media/bundles/OctraMedia.umd.js"></script>
````

[See full example here](../../../apps/web-components-demo/index.html)

## Use

### Import

#### ESM, Typescript

Import the classes and functions from `@octra/media`. For example

````typescript
import {SampleUnit} from "@octra/media";

const unit = new SampleUnit(123123, 22100);
````

#### UMD Bundle

All functions and classes are available via global scope `OctraMedia`. For example:

```javascript
/*
make sure that you have injected the umd bundle as described before.
 */
const validator = new OctraMedia.SampleUnit(123123, 22100);
```

### API

You can find more information about classes and functions of `@octra/media` [here](https://ips-lmu.github.io/octra/modules/_octra_media.html).

### Changelog

[Go to changelog](https://github.com/IPS-LMU/octra/blob/main/libs/media/CHANGELOG.md)
