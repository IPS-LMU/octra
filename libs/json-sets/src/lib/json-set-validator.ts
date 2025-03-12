import {
  DecisionTreeCombination,
  DecisionTreeNode,
  JSONSetBlueprint,
} from './decision-tree';
import { JSONSet } from './interfaces';

export class JsonSetValidator<T, U> {
  get decisionTree(): DecisionTreeCombination<T, U> | undefined {
    return this._decisionTree;
  }

  private _decisionTree?: DecisionTreeCombination<T, U>;
  protected readonly blueprint!: JSONSetBlueprint<T, U>;

  constructor() {}

  protected parse(jsonSet: JSONSet<U>) {
    this._decisionTree = DecisionTreeNode.json2tree<T, U>(
      jsonSet,
      this.blueprint,
    );
  }

  validate(items: T[]) {
    if (!this._decisionTree) {
      throw new Error(`DecisionTree is undefined. Call parse() method before.`);
    }
    this._decisionTree.validate(items);
  }
}
