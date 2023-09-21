# ngx-components

This library contains audio components for Angular used in Octra.

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
npm install --legacy-peer-deps "../octra/libs/ngx-components"
```

### UMD Bundle (Vanilla JS)

See web-components library.

## Update

1. Go to the cloned octra repository. Make sure you are in branch `static`.
2. Update directory:

```shell
git pull
```