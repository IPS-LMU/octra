import { hasProperty } from "@octra/utilities";

export class SessionFile {
  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }

  constructor(private _name: string,
              private _size: number,
              private _timestamp: Date,
              private _type: string) {
  }

  public static fromAny(element: any) {
    if (element === undefined || element === undefined) {
      return undefined;
    }

    if (
      hasProperty(element, 'name')
      && hasProperty(element, 'type')
      && hasProperty(element, 'size')
    ) {
      return new SessionFile(element.name, element.size, element.timestamp, element.type);
    } else {
      console.error('Can not convert to SessionFile. Properties are not valid.');
    }
    return undefined;
  }

  public toAny() {
    return {
      name: this._name,
      type: this._type,
      size: this._size
    };
  }
}
