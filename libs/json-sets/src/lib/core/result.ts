export class JSONSetResult {
  valid!: boolean;
  path?: string;
  error?: string;
  combinationType?: 'and' | 'or';

  constructor(partial: Partial<JSONSetResult>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
