import {
  ConstraintsChecks,
  JSONSetConstraints,
  JSONSetDefinition,
  JSONSetStatement,
  JSONValidationResult,
} from './interfaces';

export class JSONSetValidator<T extends object, C extends JSONSetConstraints> {
  validate(set: T[], setSchema: JSONSetDefinition): JSONValidationResult {
    throw new Error('Not implemented');
  }

  protected _validate(
    statement: JSONSetStatement,
    elem: T,
    constr: C,
    path: string
  ): ConstraintsChecks {
    throw new Error('Not implemented');
  }
}
