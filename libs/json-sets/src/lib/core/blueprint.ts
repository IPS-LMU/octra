import { PossibleSolution } from './possible-solution';
import { JSONSetResult } from './result';

export abstract class JSONSetBlueprint<T extends object, U extends object> {
  abstract validateItem(
    item: T,
    conditions: U,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult[];

  abstract areSolutionsEqual(
    solutionsA: PossibleSolution<T, U>,
    solutionsB: PossibleSolution<T, U>
  ): boolean;

  outputSolutions(possibleSolutions: PossibleSolution<T, U>[][]) {
    return `${possibleSolutions.length} solutions`;
  }

  areSolutionSetsEqual(
    solutionsA: PossibleSolution<T, U>[],
    solutionsB: PossibleSolution<T, U>[]
  ) {
    if (solutionsA.length !== solutionsB.length) {
      return false;
    }

    const lastFounds: number[] = [];
    for (const solutionA of solutionsA) {
      const found = solutionsB.findIndex((solutionB) =>
        this.areSolutionsEqual(solutionB, solutionA)
      );

      if (found < 0 || lastFounds.includes(found)) {
        return false;
      }
      lastFounds.push(found);
    }
    return true;
  }

  makeSolutionsUnique(solutions: PossibleSolution<T, U>[][]) {
    // remove duplicated arrays
    const filteredA = [...solutions].filter(
      (set, j) =>
        solutions.findIndex((a, i) => this.areSolutionSetsEqual(a, set)) === j
    );

    const filtered = filteredA.filter((set) => {
      const puffer: PossibleSolution<T, U>[] = [];
      for (const x of set) {
        if (!puffer.find((a) => this.areSolutionsEqual(x, a))) {
          puffer.push(x);
        } else {
          return false;
        }
      }
      return true;
    });
    return filtered;
  }

  areSolutionListsEqual(
    listA: PossibleSolution<T, U>[][],
    listB: PossibleSolution<T, U>[][]
  ): boolean {
    if (listA.length !== listB.length) {
      return false;
    }

    for (const solutionsA of listA) {
      const found = listB.findIndex((solutionsB) =>
        this.areSolutionSetsEqual(solutionsA, solutionsB)
      );
      if (!found) {
        return false;
      }
    }

    return false;
  }
}
