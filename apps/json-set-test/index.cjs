const { DecisionTree, powArray, filterEqualFiles } = require("../../dist/libs/json-sets");

const tree = DecisionTree.json2tree({
  group: "root",
  description: "root description",
  combine: {
    type: "and",
    expressions: [
      {
        select: 1,
        name: "audiofile",
        description: "",
        with: {
          fileSize: 2000, // - // <- oder Verbindungen          //  |- und Verbindungen
          mimeType: ["audio/wav"] // <- oder Verbindungen  // -
        }
      },
      {
        select: 1,
        name: "textfile",
        description: "",
        with: {
          fileSize: 2000,
          mimeType: ["application/json"],
          content: ["AnnotJSON"]
        }
      },
      {
        select: 1,
        name: "image",
        description: "",
        with: {
          mimeType: ["image"]
        }
      }
    ]
  }
});

tree.validate([
  {
    name: "a",
    size: 1000,
    type: "audio/wav"
  },
  {
    name: "b",
    size: 1000,
    type: "audio/wav"
  },
  {
    name: "c",
    size: 1000,
    type: "application/json",
    content: "AnnotJSON"
  },
  {
    name: "d",
    size: 1000,
    type: "image",
    content: "AnnotJSON"
  },
  {
    name: "e",
    size: 1000,
    type: "image",
    content: "AnnotJSON"
  }
]);
console.log(`TREE__________`);
console.log(tree);
console.log(`SOLUTION__________`);
tree.outputTreeWithSolutions();

