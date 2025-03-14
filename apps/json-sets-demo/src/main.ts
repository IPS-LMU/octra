import { FileSetValidator } from '@octra/json-sets';

const validator = new FileSetValidator({
  name: 'one audio file and one text file',
  description: 'root description',
  combine: {
    type: 'and',
    expressions: [
      {
        select: '1',
        name: 'audiofile',
        description: 'Two are audiofiles',
        with: {
          size: '<= 1KB',
          mimeType: ['audio/wav', 'audio/ogg'],
        },
      },
      {
        select: '>= 1',
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
