import { JSONSetExpression } from './interfaces';

export class PossibleSolution<T extends object, U extends object> {
  statement!: JSONSetExpression<U>;
  path!: string;
  selection!: T;

  constructor(obj: Partial<PossibleSolution<T, U>>) {
    Object.assign(this, obj);
  }
}
