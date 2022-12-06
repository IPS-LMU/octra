import {DataInfo} from './dataInfo';

export class FileInfo extends DataInfo {
  /**
   * returns if the file is ready for processing
   */
  get available(): boolean {
    return this.online || !(this._file === undefined || this._file === undefined);
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
    const point = value.lastIndexOf('.');
    const str1 = value.substr(0, point);
    const str2 = value.substr(point);
    this._name = str1;
    this._extension = str2;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  private readonly _createdAt: number = 0;

  public constructor(fullname: string, type: string, size: number, file?: File, createdAt?: number) {
    super(FileInfo.extractFileName(fullname)!.name, type, size);
    this._createdAt = (createdAt === undefined) ? 0 : createdAt;

    const extraction = FileInfo.extractFileName(fullname);
    if (!(extraction === undefined || extraction === undefined)) {
      this._extension = extraction.extension;
      this._file = file;
    } else {
      throw new Error(`could not extract file name: fullname ${fullname}`);
    }
  }

  public static fromFileObject(file: File) {
    return new FileInfo(file.name, file.type, file.size, file);
  }

  public static fromURL(url: string, type: string, name: string | undefined = undefined, createdAt = 0) {
    let fullname = '';
    if (name != undefined) {
      const extension = url.substr(url.lastIndexOf('.') + 1);
      fullname = name + '.' + extension;
    } else {
      fullname = url.substr(url.lastIndexOf('/') + 1);
    }
    const result = new FileInfo(fullname, type, 0, undefined, createdAt);
    result.url = url;

    return result;
  }

  public static escapeFileName(name: string) {
    return name.replace(/[\s/?!%*(){}ß&:=+#'<>^;,Ââ°]/g, '_').replace(/([äÄüÜöÖ])/g, (g0, g1) => {
      switch (g1) {
        case('ä'):
          return 'ae';
        case('Ä'):
          return 'Ae';
        case('ö'):
          return 'oe';
        case('Ö'):
          return 'oe';
        case('ü'):
          return 'ue';
        case('Ü'):
          return 'Ue';
      }
      return '_';
    });
  }

  public static renameFile(file: File, newName: string, attributes: any): Promise<File> {
    return new Promise<File>(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (result: any) => {
          resolve(new File([result.target.result], newName, attributes));
        };
        reader.onerror = (error) => {
          reject(error);
        };

        reader.readAsArrayBuffer(file);
      }
    );
  }

  public static extractFileName(fullname: string): { name: string, extension: string } | undefined {
    if (!(fullname === undefined || fullname === undefined) && fullname !== '') {
      const lastSlash = fullname.lastIndexOf('/');
      if (lastSlash > -1) {
        // if path remove all but the filename
        fullname = fullname.substr(lastSlash + 1);
      }

      const extensionBegin = fullname.lastIndexOf('.');
      if (extensionBegin > -1) {
        // split name and extension
        const name = fullname.substr(0, extensionBegin);
        const extension = fullname.substr(extensionBegin);

        return {
          name, extension
        };
      } else {
        throw new Error('invalid fullname. Fullname must contain the file extension');
      }
    }

    return undefined;
  }

  public static fromAny(object: any): FileInfo {
    let file;
    if (object.content !== undefined && object.content !== '') {
      file = this.getFileFromContent(object.content, object.fullname);
    }

    const result = new FileInfo(object.fullname, object.type, object.size, file);
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
      reader.onerror = error => reject(error);
    });
  }

  public static getFileFromContent(content: string, filename: string, type?: string): File {
    const properties: {
      type?: string;
    } = {
      type: ''
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
        hash: this.hash
      };

      // TODO better check mime type
      if (this._extension.indexOf('wav') < 0 && this._file !== undefined) {
        FileInfo.getFileContent(this._file).then(
          (content) => {
            result.content = content;
            resolve(result);
          }
        ).catch((err) => {
          reject(err);
        });
      } else {
        resolve(result);
      }
    });
  }

  public updateContentFromURL(httpClient: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._url !== undefined && this._url !== undefined) {
        httpClient.get(this._url, {responseType: 'text'}).subscribe({
            next: (result: any) => {
              this._file = FileInfo.getFileFromContent(result, this.fullname, this._type);
              this._size = this._file.size;
              resolve();
            },
            error: (error: any) => reject(error)
          }
        );
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
      reader.onerror = error => reject(error);
    });
  }
}
