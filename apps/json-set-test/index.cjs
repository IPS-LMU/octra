const { FileSetValidator } = require("../../dist/libs/json-sets/");

const validator = new FileSetValidator({
  name: "one audio file and one text file",
  description: "root description",
  combine: {
    type: "and",
    expressions: [
      {
        select: "1",
        name: "audiofile",
        description: "",
        with: {
          fileSize: 2000, // - // <- oder Verbindungen          //  |- und Verbindungen
          mimeType: ["audio/wav", "audio/ogg"] // <- oder Verbindungen  // -
        }
      },
      {
        select: "1",
        name: "textfile",
        description: "",
        with: {
          fileSize: 2000,
          mimeType: ["application/json"],
          content: ["AnnotJSON"]
        }
      }
    ]
  }
});

validator.validate([
  {
    name: "test.wav",
    size: 1000,
    type: "audio/wav"
  },
  {
    name: "test.ogg",
    size: 1000,
    type: "audio/ogg"
  },
  {
    name: "test.json",
    size: 1000,
    type: "application/json"
  }
]);
console.log(`TREE__________`);
console.log(validator);
console.log(`SOLUTION__________`);
console.log(
  validator.decisionTree.possibleSelections.map(
    (a) =>
      `(${a.map((b) => `{${b.path}: ${b.selection.name}}`).join(",")})`
  )
);
console.log("ERRORS");
console.log(validator.decisionTree._errors);
