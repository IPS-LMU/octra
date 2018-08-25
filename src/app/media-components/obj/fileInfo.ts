import {DataInfo} from './dataInfo';
import {isNullOrUndefined} from 'util';
import {unescape} from 'querystring';
import {HttpClient} from '@angular/common/http';

export class FileInfo extends DataInfo {
  get online(): boolean {
    return this._online;
  }

  set online(value: boolean) {
    this._online = value;
  }

  /**
   * returns if the file is ready for processing
   * @returns {boolean}
   */
  get available(): boolean {
    return this.online || !(this._file === undefined || this._file === null);
  }

  set file(value: File) {
    this._file = value;
  }

  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
  }

  get file(): File {
    return this._file;
  }

  /**
   * extension including the dot. (this must contain a dot!)
   * @returns {string}
   */
  get extension(): string {
    return this._extension;
  }

  protected _extension: string;
  protected _file: File;
  protected _url: string;
  private _online = true;

  public get fullname(): string {
    return `${this._name}${this._extension}`;
  }

  public set fullname(value: string) {
    const point = value.lastIndexOf('.');
    const str1 = value.substr(0, point);
    const str2 = value.substr(point + 1);
    this._name = str1;
    this._extension = str2;
  }

  public constructor(fullname: string, type: string, size: number, file?: File) {
    super(FileInfo.extractFileName(fullname).name, type, size);
    const extraction = FileInfo.extractFileName(fullname);
    if (!isNullOrUndefined(extraction)) {
      this._extension = extraction.extension;
      this._file = file;
    } else {
      throw Error('could not extract file name.')
    }
  }

  public static fromFileObject(file: File) {
    return new FileInfo(file.name, file.type, file.size, file);
  }

  public static fromURL(url: string, name: string = null, type: string) {
    let fullname = '';
    if (name != null) {
      const extension = url.substr(url.lastIndexOf('.') + 1);
      fullname = name + '.' + extension;
    } else {
      fullname = url.substr(url.lastIndexOf('/') + 1);
    }
    const result = new FileInfo(fullname, type, 0);
    result.url = url;

    return result;
  }

  public static escapeFileName(name: string) {
    return name.replace(/[\s\/\?\!%\*\(\)\{}&:=\+#'<>\^;,Ââ°]/g, '_');
  }

  public static renameFile(file: File, new_name: string, attributes: any): Promise<File> {
    return new Promise<File>(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (result: any) => {
          resolve(new File([result.target.result], new_name, attributes));
        };
        reader.onerror = (error) => {
          reject(error);
        };

        reader.readAsArrayBuffer(file);
      }
    );
  }

  public static extractFileName(fullname: string): { name: string, extension: string } {
    if (!isNullOrUndefined(fullname) && fullname !== '') {
      let lastslash;
      if ((lastslash = fullname.lastIndexOf('/')) > -1) {
        // if path remove all but the filename
        fullname = fullname.substr(lastslash + 1);
      }

      let extension_begin;
      if ((extension_begin = fullname.lastIndexOf('.')) > -1) {
        // split name and extension
        const name = fullname.substr(0, extension_begin);
        const extension = fullname.substr(extension_begin);

        return {
          name: name,
          extension: extension
        }
      } else {
        throw new Error('invalid fullname. Fullname must contain the file extension');
      }
    }

    return null;
  }

  public toAny(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const result = {
        fullname: this.fullname,
        size: this.size,
        type: this.type,
        url: this.url,
        attributes: this.attributes,
        content: ''
      };

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

  public static fromAny(object): FileInfo {
    let file = undefined;
    if (object.content !== undefined && object.content !== '') {
      file = this.getFileFromContent(object.content, object.fullname);
    }

    const result = new FileInfo(object.fullname, object.type, object.size, file);
    result.attributes = object.attributes;
    result.url = object.url;
    return result;
  }

  public static getFileContent(file: File, encoding?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, encoding);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  public updateContentFromURL(httpClient: HttpClient): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._url !== undefined && this._url !== null) {
        httpClient.get(this._url, {responseType: 'text'}).subscribe(
          result => {
            this._file = FileInfo.getFileFromContent(result, this.fullname, this._type);
            this._size = this._file.size;
            resolve();
          },
          error => reject(error)
        );
      } else {
        reject(Error('URL of this file is invalid'));
      }
    });
  }

  public static getFileFromContent(content: string, filename: string, type?: string): File {
    let properties = {};

    if (type !== undefined && type !== '') {
      properties['type'] = type;
    }

    return new File([content], filename, properties);
  }


  getBase64(file: File): any {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }


  public static getFileFromBase64(base64: string, filename: string) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (base64.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(base64.split(',')[1]);
    else
      byteString = unescape(base64.split(',')[1]);

    // separate out the mime component
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ia], {type: mimeString});
    return new File([blob], filename, {type: mimeString});
  }
}
