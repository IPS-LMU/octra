import { JSONSetBlueprint } from '../blueprint';
import { JSONSetValidationError } from '../error';
import { JSONSetStatement } from '../interfaces';
import { PossibleSolution } from '../possible-solution';
import { DecisionTreeExpression } from './decision-expression';
import { DecisionTreeNode } from './decision-node';

export class DecisionTreeCombination<
  T extends object,
  U extends object
> extends DecisionTreeNode<T, U> {
  combination: 'and' | 'or';
  children: DecisionTreeNode<T, U>[] = [];

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    combination: 'and' | 'or',
    parent?: DecisionTreeCombination<T, U>,
    name?: string,
    description?: string,
    children: DecisionTreeNode<T, U>[] = []
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
        `Can't insert node to decision tree. Invalid index ${index}.`
      );
    }
  }

  override validate(files: T[]) {
    for (const child of this.children) {
      child.validate(files);
    }

    if (this.combination === 'and') {
      if (this.children.some((a) => a.possibleSelections.length === 0)) {
        // one of the children does not have any solution
        this._possibleSelections = [];

        this._errors.push(
          new JSONSetValidationError(
            this.description ??
              `Logical "${this.combination}" failed for condition "${this.path}."`,
            this.path
          )
        );

        return;
      }

      const product: PossibleSolution<T, U>[][] =
        this.children[0].possibleSelections;
      const newProduct: PossibleSolution<T, U>[][] = [];
      for (let i = 1; i < this.children.length; i++) {
        const productElement = this.children[i].possibleSelections;
        newProduct.push(...this.multiplySolutions(product, productElement));
      }

      this._possibleSelections =
        this._blueprint.makeSolutionsUnique(newProduct);
    } else if (this.combination === 'or') {
      let lastRound: PossibleSolution<T, U>[][] =
        this.children[0].possibleSelections;
      let product: PossibleSolution<T, U>[][] = this.children
        .map((a) => a.possibleSelections)
        .flat();
      for (let i = 1; i < this.children.length; i++) {
        const productElement = this.children[i].possibleSelections;
        lastRound = this.multiplySolutions(lastRound, productElement);
        product.push(...lastRound);
      }

      if (product.length === 0) {
        this._errors.push(
          new JSONSetValidationError(
            this.description ??
              `Logical "${this.combination}" failed for condition "${this.path}."`,
            this.path
          )
        );
        product = [];
      }
      this._possibleSelections = product.filter((a) => a.length > 0);
      this._possibleSelections = this._blueprint.makeSolutionsUnique(
        this._possibleSelections
      );
    }

    if (this._possibleSelections.length === 0) {
      this._errors.push(
        new JSONSetValidationError(
          this.description ??
            `Logical "${this.combination}" failed for condition "${this.path}."`,
          this.path
        )
      );
      this._possibleSelections = [];
    }
  }

  override clone(recursive = true): DecisionTreeCombination<T, U> {
    return new DecisionTreeCombination(
      this._blueprint,
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

  static json2treeCombination<T extends object, U extends object>(
    blueprint: JSONSetBlueprint<T, U>,
    json: any,
    parent?: DecisionTreeCombination<T, U>
  ) {
    const root = new DecisionTreeCombination<T, U>(
      blueprint,
      json.combine.type,
      parent,
      json.name,
      json.description
    );

    for (const expression of json.combine.expressions) {
      if (Object.keys(expression).includes('combine')) {
        const set = this.json2treeCombination(blueprint, expression, root);
        root.append(set);
      } else if (JSONSetStatement) {
        const expr = new DecisionTreeExpression<T, U>(
          blueprint,
          root,
          expression
        );
        root.append(expr);
      }
    }

    return root;
  }

  override output(prepend = '') {
    let output = `${this.outputSolutions()}\n`;
    output += `${prepend}T- ${this.combination.toUpperCase()} ${
      this.description
    }\n`;
    for (const child of this.children) {
      output += `${prepend}${child.output(`${prepend}   `)}\n`;
    }
    return output;
  }
}
