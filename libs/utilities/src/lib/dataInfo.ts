export class DataInfo {
  protected _type: string;

  get type(): string {
    return this._type;
  }

  protected _name: string;

  get name(): string {
    return this._name;
  }

  protected _size: number;

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }

  private _attributes = {};

  get attributes(): any {
    return this._attributes;
  }

  set attributes(value: any) {
    this._attributes = value;
  }

  protected _hash?: string;

  get hash(): string | undefined {
    return this._hash;
  }

  set hash(value: string | undefined) {
    this._hash = value;
  }

  public constructor(name: string, type: string, size?: any) {
    this._name = name;
    this._type = type;
    this._size = (size !== undefined) ? size : 0;
  }
}
