export class DataInfo {
  get attributes(): any {
    return this._attributes;
  }

  set attributes(value: any) {
    this._attributes = value;
  }

  set size(value: number) {
    this._size = value;
  }

  get size(): number {
    return this._size;
  }

  get name(): string {
    return this._name;
  }

  get type(): string {
    return this._type;
  }

  protected _type: string;
  protected _name: string;
  protected _size: number;
  private _attributes = {};

  public constructor(name: string, type: string, size?: any) {
    this._name = name;
    this._type = type;
    this._size = (size != undefined) ? size : 0;
  }
}
