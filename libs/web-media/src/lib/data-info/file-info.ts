import { DataInfo } from './data-info';

export class FileInfo extends DataInfo {
  /**
   * returns if the file is ready for processing
   */
  get available(): boolean {
    return (
      this.online || !(this._file === undefined || this._file === undefined)
    );
  }

  protected _extension: string;

  /**
   * extension including the dot. (this must contain a dot!)
   */
  get extension(): string {
    return this._extension;
  }

  protected _file: File | undefined;

  get file(): File | undefined {
    return this._file;
  }

  set file(value: File | undefined) {
    this._file = value;
  }

  protected _url?: string;

  get url(): string | undefined {
    return this._url;
  }

  set url(value: string | undefined) {
    this._url = value;
  }

  private _online = true;

  get online(): boolean {
    return this._online;
  }

  set online(value: boolean) {
    this._online = value;
  }

  public get fullname(): string {
    return `${this._name}${this._extension}`;
  }

  public set fullname(value: string) {
    const { name, extension } = FileInfo.extractFileName(value);
    this._name = name;
    this._extension = extension;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  private readonly _createdAt: number = 0;

  public constructor(
    fullname: string,
    type: string,
    size: number,
    file?: File,
    createdAt?: number
  ) {
    const extraction = FileInfo.extractFileName(fullname);
    super(extraction.name, type, size);
    this._createdAt = createdAt === undefined ? 0 : createdAt;
    this._extension = extraction.extension;
    this._file = file;
  }

  public static fromFileObject(file: File) {
    return new FileInfo(file.name, file.type, file.size, file);
  }

  /**
   * creates a FileInfo instance form a URL. It doesn't contain the file itself.
   * @param url
   * @param type
   * @param name
   * @param createdAt
   * @param size
   */
  public static fromURL(
    url: string,
    type?: string,
    name?: string,
    createdAt = 0,
    size?: number
  ) {
    const matches = /\/([^/?]*)(\.[^?]+)(?:\?|$)/g.exec(url);

    if (matches === null || matches.length < 3) {
      throw new Error("Can't read file from URL.");
    }

    const result = new FileInfo(
      name ?? `${matches[1]}${matches[2]}`,
      type ?? this.getMimeTypeByExtension(matches[2]),
      size ?? 0,
      undefined,
      createdAt
    );
    result.url = url;

    return result;
  }

  public static getMimeTypeByExtension(extension: string) {
    switch (extension.replace(/\./g, '')) {
      // audio
      case 'wav':
        return 'audio/wav';
      case 'mp3':
        return 'audio/mpeg';
      case 'ogg':
        return 'audio/ogg';
      case 'opus':
        return 'audio/opus';
      // video
      case 'mp4':
        return 'video/mp4';
      case 'png':
        return 'image/png';
      case 'jpg':
        return 'image/jpg';
      //document
      case 'pdf':
        return 'application/pdf';
    }
    return 'text/plain';
  }

  public static escapeFileName(name: string) {
    return name
      .replace(/[\s/?!%*(){}ß&:=+#'<>^;,Ââ°]/g, '_')
      .replace(/([äÄüÜöÖ])/g, (g0, g1) => {
        switch (g1) {
          case 'ä':
            return 'ae';
          case 'Ä':
            return 'Ae';
          case 'ö':
            return 'oe';
          case 'Ö':
            return 'oe';
          case 'ü':
            return 'ue';
          case 'Ü':
            return 'Ue';
        }
        return '_';
      });
  }

  public static renameFile(
    file: File,
    newName: string,
    attributes: any
  ): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (result: any) => {
        resolve(new File([result.target.result], newName, attributes));
      };
      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  public isMediaFile() {
    return (
      this.type.indexOf('audio') > -1 ||
      this.type.indexOf('video') > -1 ||
      this.type.indexOf('image') > -1
    );
  }

  public static extractFileName(fullname: string): {
    name: string;
    extension: string;
  } {
    if (fullname && fullname !== '') {
      const lastSlash = fullname.lastIndexOf('/');
      if (lastSlash > -1) {
        // if path remove all but the filename
        fullname = fullname.substr(lastSlash + 1);
      }

      let matches = /^(.*)((?:_annot)?\.[^.]+)$/g.exec(fullname);

      const result = {
        name: '',
        extension: '',
      };

      if (matches && matches.length > 2) {
        result.name = matches[1];
        result.extension = matches[2];

        matches = /^(.*)_annot$/g.exec(result.name);
        if (matches && matches.length > 1) {
          result.name = matches[1];
          result.extension = `_annot${result.extension}`;
        }
      } else {
        throw new Error(
          'invalid fullname. Fullname must contain the file extension'
        );
      }

      return result;
    } else {
      throw new Error(`Empty fullname`);
    }
  }

  public static fromAny(object: any): FileInfo {
    let file;
    if (object.content !== undefined && object.content !== '') {
      file = this.getFileFromContent(object.content, object.fullname);
    }

    const result = new FileInfo(
      object.fullname,
      object.type,
      object.size,
      file
    );
    result.attributes = object.attributes;
    result.url = object.url;
    result.hash = object.hash;
    return result;
  }

  public static getFileContent(file: File, encoding?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, encoding);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  public static getFileFromContent(
    content: string,
    filename: string,
    type?: string
  ): File {
    const properties: {
      type?: string;
    } = {
      type: '',
    };

    if (type !== undefined && type !== '') {
      properties.type = type;
    } else {
      delete properties.type;
    }

    return new File([content], filename, properties);
  }

  public toAny(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const result = {
        fullname: this.fullname,
        size: this.size,
        type: this.type,
        url: this.url,
        attributes: this.attributes,
        content: '',
        hash: this.hash,
      };

      // TODO better check mime type
      if (this._extension.indexOf('wav') < 0 && this._file !== undefined) {
        FileInfo.getFileContent(this._file)
          .then((content) => {
            result.content = content;
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        resolve(result);
      }
    });
  }

  public updateContentFromURL(httpClient: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this._url) {
        httpClient.get(this._url, { responseType: 'text' }).subscribe({
          next: (result: string) => {
            this._file = FileInfo.getFileFromContent(
              result,
              this.fullname,
              this._type
            );
            this._size = this._file.size;
            resolve(result);
          },
          error: (error: any) => reject(error),
        });
      } else {
        reject(Error('URL of this file is invalid'));
      }
    });
  }

  getBase64(file: File): any {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
