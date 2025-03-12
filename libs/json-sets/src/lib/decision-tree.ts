import {
  JSONSet,
  JSONSetExpression,
  JSONSetStatement,
  JSONSetValidationError,
} from './interfaces';

export class JSONSetResult {
  valid!: boolean;
  path?: string;
  error?: string;
  combinationType?: 'and' | 'or';
}

export class PossibleSolution<T, U> {
  statement!: JSONSetExpression<U>;
  path!: string;
  selection!: T;

  constructor(obj: PossibleSolution<T, U>) {
    Object.assign(this, obj);
  }
}

export class JSONSetBlueprint<T, U> {
  get validationMethods(): ((
    item: T,
    conditions: U,
    combinationType: 'and' | 'or',
    path: string,
  ) => JSONSetResult)[] {
    return this._validationMethods;
  }

  protected _validationMethods: ((
    item: T,
    conditions: U,
    combinationType: 'and' | 'or',
    path: string,
  ) => JSONSetResult)[] = [];

  constructor(
    validationMethods: ((
      item: T,
      conditions: U,
      combinationType: 'and' | 'or',
      path: string,
    ) => JSONSetResult)[] = [],
  ) {
    this._validationMethods = validationMethods;
  }

  areEqualArray(
    array: PossibleSolution<T, U>[],
    array2: PossibleSolution<T, U>[],
  ): boolean {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }

  outputTreeWithSolutions() {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }

  cleanUpSolutions(
    a: PossibleSolution<T, U>[],
    index: number,
    solutions: PossibleSolution<T, U>[][],
  ): boolean {
    throw new Error(`JSONSetBlueprint: not implemented`);
  }
}

export class DecisionTreeNode<T, U> {
  get possibleSelections(): PossibleSolution<T, U>[][] {
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
      : (this._name ?? `node[${this._id}]`);
  }

  protected readonly _id: number;
  private static id = 1;
  private readonly _description?: string;
  private readonly _name?: string;
  protected readonly _parent?: DecisionTreeCombination<T, U>;
  protected readonly blueprint: JSONSetBlueprint<T, U>;
  protected _possibleSelections: PossibleSolution<T, U>[][] = [];
  public _errors: JSONSetValidationError<T>[] = [];

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    parent?: DecisionTreeCombination<T, U>,
    name?: string,
    description?: string,
  ) {
    this._id = DecisionTreeNode.id++;
    this._description = description;
    this._name = name;
    this._parent = parent;
    this.blueprint = blueprint;
  }

  clone(): DecisionTreeNode<T, U> {
    throw new Error('Not implemented');
  }

  validate(items: T[]) {}

  static json2tree<T, U>(json: JSONSet<U>, blueprint: JSONSetBlueprint<T, U>) {
    return DecisionTreeCombination.json2treeCombination<T, U>(json, blueprint);
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

export class DecisionTreeExpression<T, U> extends DecisionTreeNode<T, U> {
  statement: JSONSetStatement<U>;
  validItem = false;

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    parent: DecisionTreeCombination<T, U> | undefined,
    statement: JSONSetStatement<U>,
  ) {
    super(blueprint, parent, statement.name, statement.description);
    this.statement = statement;
  }

  override validate(items: T[]) {
    const conditions = Array.isArray(this.statement.with)
      ? this.statement.with
      : [this.statement.with];

    const checkedConditions = conditions.map((condition) =>
      items.filter(
        (item) =>
          !this.blueprint.validationMethods
            .map(
              (m) =>
                m(item, condition, this._parent!.combination, this.path)?.valid,
            )
            .some((a) => !a),
      ),
    );

    let result = checkedConditions.filter((a) => a.length > 0).flat();
    this._possibleSelections = [];

    const parsedSelectStatement = this.parseSelectStatement(
      this.statement.select,
    );
    if (result.length > 0) {
      this._possibleSelections = this.generatePossibleSolutions(
        parsedSelectStatement.type,
        parsedSelectStatement.selectNumber,
        result,
      );
    } else if (parsedSelectStatement.type === 'max') {
      this._possibleSelections.push([]);
    }

    this.validItem = this.possibleSelections.length > 0;
  }

  private generatePossibleSolutions(
    selectType: 'exact' | 'min' | 'max',
    selectNumber: number,
    items: T[],
  ): PossibleSolution<T, U>[][] {
    if (selectNumber > items.length) {
      return []; // can't select more items than available
    }

    if (selectNumber === 0 && items.length > 0) {
      return []; // no solutions because should be 0
    }

    if (selectType === 'exact') {
      return this.powArray(items, selectNumber - 1, selectNumber - 1)
        .map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              }),
          ),
        )
        .filter(this.blueprint.cleanUpSolutions);
    }
    if (selectType === 'min') {
      return this.powArray(items, selectNumber - 1, items.length)
        .map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              }),
          ),
        )
        .filter(this.blueprint.cleanUpSolutions);
    }
    if (selectType === 'max') {
      return [[], ...this.powArray(items, 0, selectNumber - 1)]
        .map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              }),
          ),
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
      selectStatement,
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

export class DecisionTreeCombination<T, U> extends DecisionTreeNode<T, U> {
  combination: 'and' | 'or';
  children: DecisionTreeNode<T, U>[] = [];

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    combination: 'and' | 'or',
    parent?: DecisionTreeCombination<T, U>,
    name?: string,
    description?: string,
    children: DecisionTreeNode<T, U>[] = [],
  ) {
    super(blueprint, parent, name, description);
    this.combination = combination;
    this.children = children;
  }

  append(node: DecisionTreeNode<T, U>) {
    this.children.push(node);
  }

  remove(index: number) {
    if (index < this.children.length) {
      this.children.splice(index, 1);
    } else {
      throw new Error(
        `Can't remove node from decision tree. Node with index ${index} not found.`,
      );
    }
  }

  removeById(id: number) {
    const index = this.children.findIndex((a) => a.id === id);
    if (index < this.children.length) {
      this.children.splice(index, 1);
    } else {
      throw new Error(
        `Can't remove node from decision tree. Node with id ${id} not found.`,
      );
    }
  }

  insert(index: number, node: DecisionTreeNode<T, U>) {
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
        `Can't insert node to decision tree. Invalid index ${index}.`,
      );
    }
  }

  override validate(files: T[]) {
    for (const child of this.children) {
      child.validate(files);
    }

    if (this.combination === 'and') {
      let product: PossibleSolution<T, U>[][] =
        this.children[0].possibleSelections;
      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => this.blueprint.areEqualArray(a, b)),
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution<T, U>[][] = [];
          for (const firstSelect of product) {
            for (const filteredElement of filtered) {
              newProduct.push([...firstSelect, ...filteredElement]);
            }
          }
          product = newProduct;
        }
      }

      this._possibleSelections = product.filter(
        this.blueprint.cleanUpSolutions,
      );
    }

    if (this.combination === 'or') {
      let product: PossibleSolution<T, U>[][] = [];
      product = this.children.map((a) => a.possibleSelections).flat();

      for (let i = 1; i < this.children.length; i++) {
        const child = this.children[i];
        const filtered = child.possibleSelections.filter(
          (a) => !product.find((b) => this.blueprint.areEqualArray(a, b)),
        );
        if (filtered.length === 0) {
          product = [];
          break;
        } else {
          const newProduct: PossibleSolution<T, U>[][] = [];
          for (const firstSelect of product) {
            for (const filteredElement of filtered) {
              newProduct.push([...firstSelect, ...filteredElement]);
            }
          }
          product.push(...newProduct);
        }
      }

      if (product.length === 0) {
        this._errors.push(
          new JSONSetValidationError(
            this.description ??
              `Logical "${this.combination}" failed for condition "${this.path}."`,
            this.path,
          ),
        );
        product = [];
      }
      this._possibleSelections = product
        .filter((a) => a.length > 0)
        .filter(this.blueprint.cleanUpSolutions);
    }

    if (this._possibleSelections.length === 0) {
      this._errors.push(
        new JSONSetValidationError(
          this.description ??
            `Logical "${this.combination}" failed for condition "${this.path}."`,
          this.path,
        ),
      );
      this._possibleSelections = [];
    }
  }

  override clone(recursive = true): DecisionTreeCombination<T, U> {
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
        : [],
    );
  }

  static json2treeCombination<T, U>(
    json: any,
    blueprint: JSONSetBlueprint<T, U>,
    parent?: DecisionTreeCombination<T, U>,
  ) {
    const root = new DecisionTreeCombination(
      blueprint,
      json.combine.type,
      parent,
      json.name,
      json.description,
    );

    for (const expression of json.combine.expressions) {
      if (Object.keys(expression).includes('combine')) {
        const set = this.json2treeCombination(expression, blueprint, root);
        root.append(set);
      } else if (JSONSetStatement) {
        const expr = new DecisionTreeExpression<T, U>(
          blueprint,
          root,
          expression,
        );
        root.append(expr);
      }
    }

    return root;
  }
}
