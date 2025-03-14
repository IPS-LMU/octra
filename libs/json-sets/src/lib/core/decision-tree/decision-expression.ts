import { JSONSetBlueprint } from '../blueprint';
import { JSONSetStatement } from '../interfaces';
import { PossibleSolution } from '../possible-solution';
import { DecisionTreeCombination } from './decision-combination';
import { DecisionTreeNode } from './decision-node';

export class DecisionTreeExpression<
  T extends object,
  U extends object
> extends DecisionTreeNode<T, U> {
  statement: JSONSetStatement<U>;
  validItem = false;

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    parent: DecisionTreeCombination<T, U> | undefined,
    statement: JSONSetStatement<U>
  ) {
    super(blueprint, parent, statement.name, statement.description);
    this.statement = statement;
  }

  override validate(items: T[]) {
    const conditions = Array.isArray(this.statement.with)
      ? this.statement.with
      : [this.statement.with];

    const parsedSelectStatement = this.parseSelectStatement(
      this.statement.select
    );
    const exclude =
      parsedSelectStatement.selectNumber === 0 &&
      parsedSelectStatement.type === 'exact';

    const checkedConditions = conditions.map((condition) =>
      items.filter(
        (item) =>
          this._blueprint
            .validateItem(item, condition, this._parent!.combination, this.path)
            .some((a) => !a.valid) === exclude
      )
    );

    let result = checkedConditions.filter((a) => a.length > 0).flat();
    this._possibleSelections = [];

    if (result.length > 0) {
      this._possibleSelections = this.generatePossibleSolutions(
        parsedSelectStatement.type,
        parsedSelectStatement.selectNumber,
        result
      );
    } else if (
      parsedSelectStatement.type === 'max' ||
      (parsedSelectStatement.type === 'min' &&
        parsedSelectStatement.selectNumber === 0)
    ) {
      this._possibleSelections.push([]);
    }

    this.validItem = this._possibleSelections.length > 0;
  }

  private generatePossibleSolutions(
    selectType: 'exact' | 'min' | 'max',
    selectNumber: number,
    items: T[]
  ): PossibleSolution<T, U>[][] {
    if (selectNumber > items.length) {
      return []; // can't select more items than available
    }

    if (selectType === 'exact') {
      // we need all permutations with exact selectNumber elements
      // => powArray from selectNumber - 1 to selectNumber - 1
      const result = this.powArray(items, selectNumber, selectNumber).map((a) =>
        a.map(
          (b) =>
            new PossibleSolution({
              path: this.path,
              statement: this.statement,
              selection: b,
            })
        )
      );

      const result2 = this._blueprint.makeSolutionsUnique(result);
      return result2;
    }
    if (selectType === 'min') {
      // we need all permutations with minimum selectNumber - 1 length
      const result = this.powArray(items, selectNumber - 1, items.length).map(
        (a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              })
          )
      );

      return [
        ...(selectNumber === 0 ? [[]] : []),
        ...this._blueprint.makeSolutionsUnique(result),
      ];
    }
    if (selectType === 'max') {
      if (selectNumber === 0 && items.length === 0) {
        return [[]];
      }

      // we need all permutations with maximum selectNumber - 1 length
      return this._blueprint.makeSolutionsUnique(
        [[], ...this.powArray(items, 0, selectNumber - 1)].map((a) =>
          a.map(
            (b) =>
              new PossibleSolution({
                path: this.path,
                statement: this.statement,
                selection: b,
              })
          )
        )
      );
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
