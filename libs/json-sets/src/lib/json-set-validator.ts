import { JSONSet, JSONSetValidationError } from './interfaces';

export class JSONSetValidator {
  validate(set: unknown[], setSchema: JSONSet): JSONSetValidationError[] {
    throw new Error('Missing implementation');
  }
}
