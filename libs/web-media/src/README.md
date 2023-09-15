# web-media

This library offers classes and functions for handling audio files in web browsers (e.g. chunked decoding etc.).

## Installation

### ESM, CJS & TS definitions
Currently, the libraries are not published on npm because Octra 2.0 and the libraries are still in development. If you
want to use the libraries in your project you have to manually install.

1. Clone the OCTRA repository next to the project folder you want to use the libraries for.
2. Switch tu branch "static".

```shell
git checkout static
```

3. Now go to your project folder and run

```shell
npm install --legacy-peer-deps "../octra/libs/web-media"
```

### UMD Bundle (Vanilla JS)

Do steps 1 and 2 from the previous chapter and reference it in an HTML file ([see full example here](../../../apps/web-components-demo/index.html)).

````html
    <head>
        <!-- ... -->
        <script type="application/javascript" src="../octra/libs/web-media/bundles/OctraWebMedia.umd.js"></script>
        <!-- ... -->
    </head>
````

## Update

1. Go to the cloned octra repository. Make sure you are in branch `static`.
2. Update directory:

```shell
git pull
```


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
