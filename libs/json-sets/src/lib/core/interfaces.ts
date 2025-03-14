export class JSONSetStatement<U> {
  select: string;
  with: U | U[];
  name?: string;
  description?: string;

  constructor(partial: JSONSetStatement<U>) {
    this.select = partial.select;
    this.with = partial.with;
    this.name = partial.name;
    this.description = partial.description;
  }
}

export class JSONSetCombination<U> {
  type: 'and' | 'or';
  expressions: JSONSetExpression<U>[];

  constructor(partial: JSONSetCombination<U>) {
    this.type = partial.type;
    this.expressions = partial.expressions;
  }
}

export class JSONSet<U> {
  name?: string;
  description?: string;
  combine!: JSONSetCombination<U>;
}

export type JSONSetExpression<U> = JSONSetStatement<U> | JSONSet<U>;
