import {
  IFile,
  JSONSet,
  JSONSetExpression,
  JSONSetStatement,
} from '@octra/json-sets';

export class JSONSetResult {
  valid!: boolean;
  path?: string;
  statement?: JSONSetStatement;
  error?: string;
  combinationType?: 'and' | 'or';
}

export class PossibleSolution {
  statement!: JSONSetExpression;
  path!: string;
  selection!: IFile;

  constructor(obj: PossibleSolution) {
    Object.assign(this, obj);
  }
}

const validationMethods: ((
  file: IFile,
  statement: JSONSetStatement,
  combinationType: 'and' | 'or',
  path: string
) => JSONSetResult)[] = [validateMimeType, validateContent, validateFileSize];

export class DecisionTreeNode {
  get possibleSelections(): PossibleSolution[][] {
    return this._possibleSelections;
  }

  get id(): number {
    return this._id;
  }

  get description(): string | undefined {
    return this._description;
  }

  get name(): string | undefined {
    return this._name;
  }

  get path(): string {
    return this._parent
      ? `${this._parent.path}.${this._name}`
      : this._name ?? `node[${this._id}]`;
  }

  protected readonly _id: number;
  private static id = 1;
  private readonly _description?: string;
  private readonly _name?: string;
  protected readonly _parent?: DecisionTreeCombination;
  protected _possibleSelections: PossibleSolution[][] = [];

  constructor(
    parent?: DecisionTreeCombination,
    name?: string,
    description?: string
  ) {
    this._id = DecisionTreeNode.id++;
    this._description = description;
    this._name = name;
    this._parent = parent;
  }

  clone(): DecisionTreeNode {
    throw new Error('Not implemented');
  }

  validate(file: IFile[]) {}
}

export class DecisionTreeExpression extends DecisionTreeNode {
  statement: JSONSetStatement;
  validItem = false;

  constructor(parent: DecisionTreeCombination, statement: JSONSetStatement) {
    super(parent, statement.name, statement.description);
    this.statement = statement;
  }

  override validate(files: IFile[]) {
    const result = files.filter((file) => {
      return !validationMethods
        .map(
          (m) =>
            m(file, this.statement, this._parent!.combination, this.path)?.valid
        )
        .some((a) => !a);
    });
    this._possibleSelections = [];

    if (result.length > 0) {
      const parsedSelectStatement = this.parseSelectStatement(
        this.statement.select
      );

      this._possibleSelections = this.generatePossibleSolutions(
        parsedSelectStatement.type,
        parsedSelectStatement.selectNumber,
        result
      );
    }

    this.validItem = this.possibleSelections.length > 0;
  }

  private generatePossibleSolutions(
    selectType: 'exact' | 'min' | 'max',
    selectNumber: number,
    files: IFile[]
  ): PossibleSolution[][] {
    if (selectNumber > files.length) {
      return []; // can't select more items than available
    }

    if (selectNumber === 0 && files.length > 0) {
      return []; // no solutions because should be 0
    }

    if (selectType === 'exact') {
      return powArray(files, selectNumber - 1, selectNumber - 1)
        .map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              })
          )
        )
        .filter(cleanUpSolutions);
    }
    if (selectType === 'min') {
      console.log('MIN TRUE');
      return powArray(files, selectNumber - 1, files.length)
        .map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              })
          )
        )
        .filter(cleanUpSolutions);
    }
    if (selectType === 'max') {
      console.log('MAX TRUE');
      return [
        [],
        ...powArray(files, 0, selectNumber - 1),
      ].map((a) =>
        a.map(
          (b) =>
            new PossibleSolution({
              path: this.path,
              statement: this.statement,
              selection: b,
            })
        )
      ).filter(cleanUpSolutions);
    }

    throw new Error('Not working');
  }

  private parseSelectStatement(selectStatement: string): {
    type: 'min' | 'max' | 'exact';
    selectNumber: number;
  } {
    const matches = /^((?:>=)|(?:<=)|(?:=))?\s*([0-9]+)$/g.exec(
      selectStatement
    );
    if (!matches) {
      throw new Error(`JSONSetValidationError: Invalid select statement.`);
    }

    if (matches) {
      if (matches[1] === undefined || matches[1] === '=') {
        // exact
        return {
          type: 'exact',
          selectNumber: Number(matches[2]),
        };
      }

      if (matches[1] === '>=') {
        // min
        return {
          type: 'min',
          selectNumber: Number(matches[2]),
        };
      }

      if (matches[1] === '<=') {
        // max
        return {
          type: 'max',
          selectNumber: Number(matches[2]),
        };
      }
    }

    throw new Error(`JSONSetValidationError: Invalid select statement.`);
  }
}

export class DecisionTreeCombination extends DecisionTreeNode {
  combination: 'and' | 'or';
  children: DecisionTreeNode[] = [];

  constructor(
    combination: 'and' | 'or',
    parent?: DecisionTreeCombination,
    name?: string,
    description?: string,
    children: DecisionTreeNode[] = []
  ) {
    super(parent, name, description);
    this.combination = combination;
    this.children = children;
  }

  append(node: DecisionTreeNode) {
    this.children.push(node);
  }

  remove(index: number) {
    if (index < this.children.length) {
      this.children.splice(index, 1);
    } else {
      throw new Error(
        `Can't remove node from decision tree. Node with index ${index} not found.`
      );
    }
  }

  removeById(id: number) {
    const index = this.children.findIndex((a) => a.id === id);
    if (index < this.children.length) {
      this.children.splice(index, 1);
    } else {
      throw new Error(
        `Can't remove node from decision tree. Node with id ${id} not found.`
      );
    }
  }

  insert(index: number, node: DecisionTreeNode) {
    if (index < this.children.length) {
      this.children = [
        ...this.children.slice(0, index),
        node,
        ...this.children.slice(index),
      ];
    } else if (index === this.children.length) {
      this.children.push(node);
    } else {
      throw new Error(
        `Can't insert node to decision tree. Invalid index ${index}.`
      );
    }
  }

  override validate(files: IFile[]) {
    for (const child of this.children) {
      child.validate(files);
    }

    if (this.combination === 'and') {
      let product: PossibleSolution[][] = this.children[0].possibleSelections;
      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => areEqualArray(a, b))
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution[][] = [];
          for (const firstSelect of product) {
            for (const filteredElement of filtered) {
              newProduct.push([...firstSelect, ...filteredElement]);
            }
          }
          product = newProduct;
        }
      }
      this._possibleSelections = product.filter(cleanUpSolutions);
    }

    if (this.combination === 'or') {
      let product: PossibleSolution[][] = [];
      product = this.children.map((a) => a.possibleSelections).flat();

      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => areEqualArray(a, b))
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution[][] = [];
          for (const firstSelect of product) {
            for (const filteredElement of filtered) {
              newProduct.push([...firstSelect, ...filteredElement]);
            }
          }
          product.push(...newProduct);
        }
      }
      this._possibleSelections = product
        .filter((a) => a.length > 0)
        .filter(cleanUpSolutions);
    }
  }

  override clone(recursive = true): DecisionTreeCombination {
    return new DecisionTreeCombination(
      this.combination,
      this._parent,
      this.name,
      this.description,
      recursive
        ? this.children.map((a) => {
            if (a instanceof DecisionTreeCombination) {
              return a.clone(true);
            }
            return a.clone();
          })
        : []
    );
  }

  private convertFileString(fileString: string) {
    const matches =
      /\s*([0-9]+(?:\.?[0-9]+)?)\s?((?:B)|(?:KB)|(?:MB)|(?:TB))$/g.exec(
        fileString
      );
    if (!matches || matches.length < 3) {
      return undefined;
    }
    try {
      const size = Number(matches[1]);
      const label = matches[2];

      switch (label) {
        case 'KB':
          return 1000 * size;
        case 'MB':
          return 1000000 * size;
        case 'GB':
          return 1000000000 * size;
        case 'TB':
          return 1000000000000 * size;
      }
    } catch (e) {
      return undefined;
    }

    return undefined;
  }

  static json2treeCombination(json: any, parent?: DecisionTreeCombination) {
    const root = new DecisionTreeCombination(
      json.combine.type,
      parent,
      json.group,
      json.description
    );

    for (const expression of json.combine.expressions) {
      if (Object.keys(expression).includes('combine')) {
        const set = this.json2treeCombination(expression, root);
        root.append(set);
      } else if (JSONSetStatement) {
        const expr = new DecisionTreeExpression(root, expression);
        root.append(expr);
      }
    }

    return root;
  }
}

function validateFileSize(
  file: IFile,
  statement: JSONSetStatement,
  combinationType: 'and' | 'or',
  path: string
): JSONSetResult {
  if (statement.with.fileSize && file.size > statement.with.fileSize) {
    return {
      valid: false,
      error: `File size must be less than ${statement.with.fileSize}B.`,
      path,
      statement,
      combinationType,
    };
  }
  return {
    valid: true,
    path,
    statement,
    combinationType,
  };
}

function validateContent(
  file: IFile,
  statement: JSONSetStatement,
  combinationType: 'and' | 'or',
  path: string
): JSONSetResult {
  if (
    statement.with.content &&
    statement.with.content.length > 0 &&
    file.content !== undefined &&
    !statement.with.content.includes(file.content)
  ) {
    return {
      valid: false,
      error: `File content type must be one of ${statement.with.content.join(
        ','
      )}.`,
      path,
      statement,
      combinationType,
    };
  }

  return {
    valid: true,
    path,
    statement,
    combinationType,
  };
}

function validateMimeType(
  file: IFile,
  statement: JSONSetStatement,
  combinationType: 'and' | 'or',
  path: string
): JSONSetResult {
  if (
    statement.with.mimeType &&
    statement.with.mimeType.length > 0 &&
    file.type !== undefined &&
    !statement.with.mimeType.includes(file.type)
  ) {
    return {
      valid: false,
      error: `File type must be one of ${statement.with.mimeType.join(',')}.`,
      path,
      statement,
      combinationType,
    };
  }
  return {
    valid: true,
    path,
    statement,
    combinationType,
  };
}

export class DecisionTree {
  root!: DecisionTreeCombination;

  constructor(root: DecisionTreeCombination) {
    this.root = root;
  }

  validate(files: IFile[]) {
    this.root.validate(files);
  }

  static json2tree(json: JSONSet) {
    const root = DecisionTreeCombination.json2treeCombination(json);
    return new DecisionTree(root);
  }

  outputTreeWithSolutions() {
    const build = (node: DecisionTreeNode, acc: any = {}): any => {
      if (node instanceof DecisionTreeCombination) {
        acc[node.combination] = [];
        for (const child of node.children) {
          acc[node.combination].push(build(child, acc));
        }
        return acc;
      } else {
        return node.possibleSelections.map((a) =>
          a.map((b) => `{${b.path}: ${b.selection.name}`).join(',')
        );
      }
    };
    const result = build(this.root);

    console.log(JSON.stringify(result, null, 2));
  }
}

function areEqualArray(array: PossibleSolution[], array2: PossibleSolution[]) {
  if (array.length === array2.length) {
    for (const solution of array) {
      if (
        !array2.find(
          (a) =>
            a.path === solution.path &&
            a.selection.name === solution.selection.name &&
            a.selection.type === solution.selection.type &&
            a.selection.size === solution.selection.size &&
            a.selection.content === solution.selection.content
        )
      ) {
      }
    }
  }

  return false;
}

export function powArray(array: IFile[], start: number, end: number) {
  let result: IFile[][] = array.map((a) => [a]);

  for (let i = 0; i < end; i++) {
    let newArray: IFile[][] = [];
    for (const resultElement of result) {
      for (const iFile of array) {
        newArray.push([...resultElement, iFile]);
      }
    }
    if (i < start) {
      result = newArray;
    } else {
      result.push(...newArray);
    }
  }

  return result;
}

export function cleanUpSolutions(a: PossibleSolution[], index: number, solutions: PossibleSolution[][]) {
  const anyDuplicate = a.some(
    (b, i, so) => so.findIndex((c) => c.selection.name === b.selection.name) !== i
  );

  return (
    !anyDuplicate &&
    solutions.findIndex((b) => {
      for (const iFile of a) {
        const i = b.findIndex((c) => c.path === iFile.path && c.selection.name === iFile.selection.name);
        if (i < 0) {
          return false;
        }
      }
      return true;
    }) === index
  );
}
