import { JSONSetBlueprint } from './blueprint';
import { DecisionTreeCombination, DecisionTreeNode } from './decision-tree';
import { JSONSet } from './interfaces';

export abstract class JsonSetValidator<T extends object, U extends object> {
  protected readonly _blueprint: JSONSetBlueprint<T, U>;

  get decisionTree(): DecisionTreeCombination<T, U> | undefined {
    return this._decisionTree;
  }

  protected _decisionTree?: DecisionTreeCombination<T, U>;

  protected parse(jsonSet: JSONSet<U>) {
    this._decisionTree = DecisionTreeNode.json2tree<T, U>(
      this._blueprint,
      jsonSet
    );
  }

  validate(items: T[]) {
    if (!this._decisionTree) {
      throw new Error(`DecisionTree is undefined. Call parse() method before.`);
    }
    this._decisionTree.validate(items);
  }

  constructor(jsonSet: JSONSet<U>, blueprint: JSONSetBlueprint<T, U>) {
    this._blueprint = blueprint;
    this.parse(jsonSet);
  }
}
