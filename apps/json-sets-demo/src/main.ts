import {
  FileJSONSetValidator,
  IFile,
  JSONFileSetDefinition,
} from '@octra/json-sets';

const validator = new FileJSONSetValidator();
const testJSON: JSONFileSetDefinition = {
  name: 'test',
  statements: [
    {
      name: 'is audio pair',
      constraints: [
        {
          take: 'x > 1',
          name: 'is audiofile',
          extension: ['.wav', '.ogg'],
          mimeType: ['audio/wav'],
        },
        {
          take: 'x <= 1',
          name: 'is textfile',
          extension: ['.txt'],
          mimeType: ['text/plain'],
        },
      ],
    },
  ],
};
const testFiles: IFile[] = [
  {
    name: 'audiofile.wav',
    size: 234324,
    type: 'audio/wav',
  },
  {
    name: 'audiofile2.wav',
    size: 234324,
    type: 'audio/wav',
  },
  {
    name: 'audiofile3.wav',
    size: 234324,
    type: 'audio/ogg',
  },
  {
    name: 'text.txt',
    size: 234324,
    type: 'text/plain',
  },
];

const validation = validator.validate(testFiles, testJSON);
validation.results
  .map((a) => a.validationResults)
  .flat()
  .map((b) => {
    console.log('ERROR:' + b.errors.map((c) => c.message).join('\n'));
  })

console.log(validation.isValid);
