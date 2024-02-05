const {FileJSONSetValidator} = require("../../dist/libs/json-sets/index");

const validator = new FileJSONSetValidator();

const result = validator.validate(
  [
    {
      name: 'test.wav',
      size: 1000,
      type: 'audio/wav',
    },
    {
      name: 'test.json',
      size: 1000,
      type: 'application/json',
      content: 'AnnotJSON',
    },
  ],
  {
    group: 'root',
    description: 'root description',
    combine: {
      type: 'and',
      expressions: [
        {
          select: 1,
          name: 'audiofile',
          description: '',
          with: {
            fileSize: 2000, // - // <- oder Verbindungen          //  |- und Verbindungen
            mimeType: ['audio/wav'], // <- oder Verbindungen  // -
          },
        },
        {
          select: 1,
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
  }
)

console.log("RESULT:");
console.log(result);
