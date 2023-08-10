# @octra/utilities

This library offers JS functions and classes to make some parts of app development easier. This library is used by Octra and Octra-Backend.

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
npm install --legacy-peer-deps "../octra/libs/utilities"
```

### UMD Bundle (Vanilla JS)

Do steps 1 and 2 from the previous chapter and reference it in an HTML file ([see full example here](../../../apps/web-components-demo/index.html)).

````html
    <head>
        <!-- ... -->
        <script type="application/javascript" src="../octra/libs/utilities/bundles/OctraUtilities.umd.js"></script>
        <!-- ... -->
    </head>
````

## Update

1. Go to the cloned octra repository. Make sure you are in branch `static`.
2. Update directory:

```shell
git pull
```
