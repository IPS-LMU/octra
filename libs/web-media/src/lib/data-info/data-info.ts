export class DataInfo<T extends object = any> {
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

  protected _attributes?: T;

  get attributes(): T | undefined {
    return this._attributes;
  }

  set attributes(value: T | undefined) {
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
    this._size = size !== undefined ? size : 0;
  }

  clone(): DataInfo<T> {
    return new DataInfo<T>(this.name, this.type, this.size);
  }
}
