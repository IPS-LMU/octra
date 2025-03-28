import { JSONSetStatement } from './interfaces';

export class JSONSetValidationError<U> {
  path?: string;
  message!: string;
  statement?: JSONSetStatement<U>;
  combinationType?: 'and' | 'or';

  constructor(message: string, path?: string) {
    this.message = message;
    this.path = path;
  }
}
