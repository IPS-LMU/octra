import { SourceType } from './types';

/***
 * this class represents a media file
 */
export class MediaResource {
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

  private _url?: string;

  get url(): string | undefined {
    return this._url;
  }

  /***
   * initializes an MediaResource object
   * @param fullName file name including extension
   * @param sourceType type of media source
   * @param buffer arrayBuffer
   * @param fileSize file size
   * @param url
   */
  constructor(
    fullName: string,
    sourceType: SourceType,
    buffer?: ArrayBuffer,
    fileSize?: number,
    url?: string,
  ) {
    if (
      sourceType !== SourceType.URL &&
      (buffer === undefined || buffer === null)
    ) {
      throw new Error(
        'MediaResource of type File or ArrayBuffer must have content',
      );
    } else if (fullName.lastIndexOf('.') === -1) {
      throw new Error(
        'fullName parameter needs to consist of an file extension',
      );
    } else {
      const extensionStart = fullName.lastIndexOf('.');
      this._name = fullName.substring(0, extensionStart);
      this._extension = fullName.substring(extensionStart);
      this._size = fileSize;
      this.source = sourceType;
      this._arraybuffer = buffer;
      this._url = url;
    }
  }
}
