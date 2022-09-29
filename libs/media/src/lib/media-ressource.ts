import {SourceType} from './types';

export class MediaRessource {
  private source: SourceType;
  private readonly _extension: string;

  get extension(): string {
    return this._extension;
  }

  private _arraybuffer: ArrayBuffer | undefined;

  get arraybuffer(): ArrayBuffer | undefined {
    return this._arraybuffer;
  }

  set arraybuffer(value: ArrayBuffer | undefined) {
    this._arraybuffer = value;
  }

  private readonly _name: string;

  get name(): string {
    return this._name;
  }

  private readonly _size: number | undefined;

  get size(): number | undefined {
    return this._size;
  }

  constructor(fullname: string, source: SourceType, buffer?: ArrayBuffer, size?: number) {
    if (source !== SourceType.URL && (buffer === undefined || buffer === undefined)) {
      throw new Error('MediaRessource of type File or ArrayBuffer must have content');
    } else if (fullname.lastIndexOf('.') === -1) {
      throw new Error('fullname parameter needs to consist of an file extension');
    } else {
      const extensionstart = fullname.lastIndexOf('.');
      this._name = fullname.substr(0, extensionstart);
      this._extension = fullname.substr(extensionstart);
      this._size = size;
      this.source = source;
      this._arraybuffer = buffer;
    }
  }
}
