import { JSONSetBlueprint } from '../blueprint';
import { JSONSetValidationError } from '../error';
import { JSONSet } from '../interfaces';
import { PossibleSolution } from '../possible-solution';
import { DecisionTreeCombination } from './decision-combination';

export class DecisionTreeNode<T extends object, U extends object> {
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
      : this._name ?? `node[${this._id}]`;
  }

  protected readonly _id: number;
  private static id = 1;
  private readonly _description?: string;
  private readonly _name?: string;
  protected readonly _parent?: DecisionTreeCombination<T, U>;
  protected _possibleSelections: PossibleSolution<T, U>[][];
  public _errors: JSONSetValidationError<T>[] = [];
  protected readonly _blueprint: JSONSetBlueprint<T, U>;

  constructor(
    blueprint: JSONSetBlueprint<T, U>,
    parent?: DecisionTreeCombination<T, U>,
    name?: string,
    description?: string
  ) {
    this._id = DecisionTreeNode.id++;
    this._blueprint = blueprint;
    this._description = description;
    this._name = name;
    this._parent = parent;
    this._possibleSelections = [];
  }

  static json2tree<T extends object, U extends object>(
    blueprint: JSONSetBlueprint<T, U>,
    json: JSONSet<U>
  ) {
    return DecisionTreeCombination.json2treeCombination<T, U>(blueprint, json);
  }

  validate(files: T[]) {
    throw new Error('Not implemented');
  }

  clone(): DecisionTreeNode<T, U> {
    return new DecisionTreeNode(
      this._blueprint,
      this._parent,
      this.name,
      this.description
    );
  }

  protected multiplySolutions(
    setA: PossibleSolution<T, U>[][],
    setB: PossibleSolution<T, U>[][]
  ) {
    const result: PossibleSolution<T, U>[][] = [];
    const a = setA.length > setB.length ? setA : setB;
    const b = setB.length < setA.length ? setB : setA;

    for (const aElement of a) {
      for (const bElement of b) {
        result.push([...aElement, ...bElement]);
      }
    }

    return result;
  }

  /**
   * calculates all possible permutations from a given set
   * @param array the set of elements to generate the permutations with
   * @param start first permutation will have start + 1 elements
   * @param end last permutation will have end + 1 elements
   * @protected
   */
  protected powArray<T>(array: T[], start: number, end: number) {
    let result: T[][] = array.map((a) => [a]);
    // generates [[a], [b], [c]]

    for (let i = 1; i < end; i++) {
      const newArray: T[][] = [];
      for (const resultElement of result) {
        // foreach [x] in [[a], [b], [c]]
        for (const iFile of array) {
          // foreach x in [a, b, c]
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

  output(prepend = '') {
    return `${prepend}${this.description}: ${this.outputSolutions()}`;
  }

  outputSolutions() {
    return this._blueprint.outputSolutions(this._possibleSelections);
  }
}
