const { FileSetValidator } = require("../../dist/libs/json-sets/");

const validator = new FileSetValidator({
  name: 'root',
  description: 'root description',
  combine: {
    type: 'and',
    expressions: [
      {
        name: 'g1',
        combine: {
          type: 'and',
          expressions: [
            {
              select: '1',
              name: 'audiofile',
              description: '',
              with: {
                fileSize: 2000, // - // <- oder Verbindungen          //  |- und Verbindungen
                mimeType: ['audio/wav'], // <- oder Verbindungen  // -
              },
            },
            {
              select: '<= 1',
              name: 'textfile',
              description: '',
              with: {
                fileSize: 2000,
                mimeType: ['application/json'],
                content: ['AnnotJSON'],
              },
            },
          ],
        },
      },
    ],
  },
});

validator.validate([
  {
    name: 'a',
    size: 1000,
    type: 'audio/wav',
  },
  {
    name: 'c',
    size: 1000,
    type: 'application/json',
    content: 'AnnotJSON',
  },
]);
console.log(`TREE__________`);
console.log(validator);
console.log(`SOLUTION__________`);
console.log(
  validator.decisionTree.possibleSelections.map(
  (a) =>
    `(${a.map((b) => `{${b.path}: ${b.selection.name}}`).join(',')})`
)
);

