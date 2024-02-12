import {
  DecisionTreeCombination,
  DecisionTreeNode,
  JSONSetBlueprint,
  JSONSetResult,
  PossibleSolution,
} from './decision-tree';
import { JSONSet, JSONSetStatement } from './interfaces';

export class JSONSetDefaultBluePrint extends JSONSetBlueprint<any> {
  constructor(
    validationMethods: ((
      item: any,
      statement: JSONSetStatement,
      combinationType: 'and' | 'or',
      path: string
    ) => JSONSetResult)[] = []
  ) {
    super(validationMethods);
    this._validationMethods = [];
  }

  override areEqualArray(
    array: PossibleSolution<any>[],
    array2: PossibleSolution<any>[]
  ): boolean {
    throw new Error(`JSONSetValidator: not implemented`);
  }
}

export class JsonSetValidator<T> {
  get decisionTree(): DecisionTreeCombination<T> | undefined {
    return this._decisionTree;
  }

  private _decisionTree?: DecisionTreeCombination<T>;
  protected readonly blueprint!: JSONSetBlueprint<T>;

  constructor() {}

  parse(jsonSet: JSONSet) {
    this._decisionTree = DecisionTreeNode.json2tree<T>(jsonSet, this.blueprint);
  }

  validate(items: T[]) {
    if (!this._decisionTree) {
      throw new Error(`DecisionTree is undefined. Call parse() method before.`);
    }
    this._decisionTree.validate(items);
  }
}
