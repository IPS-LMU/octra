# assets

This library contains assets like JSON schema definitions.

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
npm install --legacy-peer-deps "../octra/libs/assets"
```

### UMD Bundle (Vanilla JS)

Do steps 1 and 2 from the previous chapter and reference it in an HTML file ([see full example here](../../../apps/web-components-demo/index.html)).

````html
    <head>
        <!-- ... -->
        <script type="application/javascript" src="../octra/libs/assets/bundles/OctraAssets.umd.js"></script>
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

Import the classes and functions from `@octra/assets`. For example

````typescript
import {OctraGuidelinesJSONSchema} from "@octra/assets";
````

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
