import { JSONSet, JSONSetExpression, JSONSetStatement } from './interfaces';

export class JSONSetResult {
  valid!: boolean;
  path?: string;
  statement?: JSONSetStatement;
  error?: string;
  combinationType?: 'and' | 'or';
}

export class PossibleSolution<T> {
  statement!: JSONSetExpression;
  path!: string;
  selection!: T;

  constructor(obj: PossibleSolution<T>) {
    Object.assign(this, obj);
  }
}

export class JSONSetBlueprint<T> {
  get validationMethods(): ((
    item: T,
    statement: JSONSetStatement,
    combinationType: 'and' | 'or',
    path: string
  ) => JSONSetResult)[] {
    return this._validationMethods;
  }

  protected _validationMethods: ((
    item: T,
    statement: JSONSetStatement,
    combinationType: 'and' | 'or',
    path: string
  ) => JSONSetResult)[] = [];

  constructor(
    validationMethods: ((
      item: T,
      statement: JSONSetStatement,
      combinationType: 'and' | 'or',
      path: string
    ) => JSONSetResult)[] = []
  ) {
    this._validationMethods = validationMethods;
  }

  areEqualArray(
    array: PossibleSolution<T>[],
    array2: PossibleSolution<T>[]
  ): boolean {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }

  outputTreeWithSolutions() {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }

  cleanUpSolutions(
    a: PossibleSolution<T>[],
    index: number,
    solutions: PossibleSolution<T>[][]
  ): boolean {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }
}

export class DecisionTreeNode<T> {
  get possibleSelections(): PossibleSolution<T>[][] {
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
  protected readonly _parent?: DecisionTreeCombination<T>;
  protected readonly blueprint: JSONSetBlueprint<T>;
  protected _possibleSelections: PossibleSolution<T>[][] = [];

  constructor(
    blueprint: JSONSetBlueprint<T>,
    parent?: DecisionTreeCombination<T>,
    name?: string,
    description?: string
  ) {
    this._id = DecisionTreeNode.id++;
    this._description = description;
    this._name = name;
    this._parent = parent;
    this.blueprint = blueprint;
  }

  clone(): DecisionTreeNode<T> {
    throw new Error('Not implemented');
  }

  validate(items: T[]) {}

  static json2tree<T>(json: JSONSet, blueprint: JSONSetBlueprint<T>) {
    return DecisionTreeCombination.json2treeCombination<T>(json, blueprint);
  }

  outputSolutions() {
    return this.blueprint.outputTreeWithSolutions();
  }

  protected powArray<T>(array: T[], start: number, end: number) {
    let result: T[][] = array.map((a) => [a]);

    for (let i = 0; i < end; i++) {
      let newArray: T[][] = [];
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
}

export class DecisionTreeExpression<T> extends DecisionTreeNode<T> {
  statement: JSONSetStatement;
  validItem = false;

  constructor(
    blueprint: JSONSetBlueprint<T>,
    parent: DecisionTreeCombination<T> | undefined,
    statement: JSONSetStatement
  ) {
    super(blueprint, parent, statement.name, statement.description);
    this.statement = statement;
  }

  override validate(items: T[]) {
    const result = items.filter((item) => {
      return !this.blueprint.validationMethods
        .map(
          (m) =>
            m(item, this.statement, this._parent!.combination, this.path)?.valid
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
    files: T[]
  ): PossibleSolution<T>[][] {
    if (selectNumber > files.length) {
      return []; // can't select more items than available
    }

    if (selectNumber === 0 && files.length > 0) {
      return []; // no solutions because should be 0
    }

    if (selectType === 'exact') {
      return this.powArray(files, selectNumber - 1, selectNumber - 1)
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
        .filter(this.blueprint.cleanUpSolutions);
    }
    if (selectType === 'min') {
      return this.powArray(files, selectNumber - 1, files.length)
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
        .filter(this.blueprint.cleanUpSolutions);
    }
    if (selectType === 'max') {
      return [[], ...this.powArray(files, 0, selectNumber - 1)]
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
        .filter(this.blueprint.cleanUpSolutions);
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

export class DecisionTreeCombination<T> extends DecisionTreeNode<T> {
  combination: 'and' | 'or';
  children: DecisionTreeNode<T>[] = [];

  constructor(
    blueprint: JSONSetBlueprint<T>,
    combination: 'and' | 'or',
    parent?: DecisionTreeCombination<T>,
    name?: string,
    description?: string,
    children: DecisionTreeNode<T>[] = []
  ) {
    super(blueprint, parent, name, description);
    this.combination = combination;
    this.children = children;
  }

  append(node: DecisionTreeNode<T>) {
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

  insert(index: number, node: DecisionTreeNode<T>) {
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

  override validate(files: T[]) {
    for (const child of this.children) {
      child.validate(files);
    }

    if (this.combination === 'and') {
      let product: PossibleSolution<T>[][] =
        this.children[0].possibleSelections;
      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => this.blueprint.areEqualArray(a, b))
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution<T>[][] = [];
          for (const firstSelect of product) {
            for (const filteredElement of filtered) {
              newProduct.push([...firstSelect, ...filteredElement]);
            }
          }
          product = newProduct;
        }
      }
      this._possibleSelections = product.filter(this.blueprint.cleanUpSolutions);
    }

    if (this.combination === 'or') {
      let product: PossibleSolution<T>[][] = [];
      product = this.children.map((a) => a.possibleSelections).flat();

      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => this.blueprint.areEqualArray(a, b))
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution<T>[][] = [];
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
        .filter(this.blueprint.cleanUpSolutions);
    }
  }

  override clone(recursive = true): DecisionTreeCombination<T> {
    return new DecisionTreeCombination(
      this.blueprint,
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

  static json2treeCombination<T>(
    json: any,
    blueprint: JSONSetBlueprint<T>,
    parent?: DecisionTreeCombination<T>
  ) {
    const root = new DecisionTreeCombination(
      blueprint,
      json.combine.type,
      parent,
      json.name,
      json.description
    );

    for (const expression of json.combine.expressions) {
      if (Object.keys(expression).includes('combine')) {
        const set = this.json2treeCombination(expression, blueprint, root);
        root.append(set);
      } else if (JSONSetStatement) {
        const expr = new DecisionTreeExpression<T>(blueprint, root, expression);
        root.append(expr);
      }
    }

    return root;
  }
}
