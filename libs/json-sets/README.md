# @octra/json-sets <a href="https://www.npmjs.com/package/@octra/json-sets"><img alt="npm" src="https://img.shields.io/npm/v/@octra/json-sets"></a>

This library allows to define sets using JSON. JSONSetValidator parses an array of objects and validates it using a JSON definition. You can extend from JSONSetValidator and create your own validator for specific object.

## Features

- Easy select statements syntax:
  - `"select": "x"`: Select exact x items
  - `"select": "> x"`: Select more than x items
  - `"select": "< x"`: Select less than x items
  - `"select": ">= x"`: Select min. x items
  - `"select": "<= x"`: Select max. x items
- Combine statements using common logic: `and`, `or` operators.
- Calculate all possible solution with a given set of objects
- Get List of failed statements on error

## Example

You can clone this repository and try the following example running `npm run start:json-sets-demo`.

```typescript
import { FileSetValidator } from '@octra/json-sets';

const validator = new FileSetValidator({
  name: 'one audio file and one text file',
  description: 'root description',
  combine: {
    type: 'and',
    expressions: [
      {
        select: '2',
        name: 'audiofile',
        description: 'Two are audiofiles',
        with: {
          mimeType: ['audio/wav', 'audio/ogg'],
        },
      },
      {
        select: '1',
        name: 'textfile',
        description: 'One is a text file',
        with: {
          mimeType: ['application/json'],
        },
      },
    ],
  },
});

validator.validate([
  {
    name: 'a.wav',
    size: 1000,
    type: 'audio/wav',
  },
  {
    name: 'b.ogg',
    size: 1000,
    type: 'audio/ogg',
  },
  {
    name: 'c.json',
    size: 1000,
    type: 'application/json',
  },
  {
    name: 'd.json',
    size: 1000,
    type: 'application/json',
  },
]);
console.log(`TREE__________`);
console.log(validator.decisionTree.output());
console.log('ERRORS');
console.log(validator.decisionTree._errors);
```

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
