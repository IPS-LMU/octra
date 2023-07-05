import {OAnnotJSON, OAudiofile} from '../annotjson';

export interface IFile {
  name: string;
  content: string;
  type: string;
  encoding: string;
}

export interface ImportResult {
  annotjson?: OAnnotJSON;
  audiofile?: OAudiofile;
  error?: string;
}

export interface ExportResult {
  file: IFile;
}

export abstract class Converter {
  protected _conversion = {
    import: false,
    export: false
  };

  get conversion(): { import: boolean; export: boolean } {
    return this._conversion;
  }

  protected _application = '';

  get application(): string {
    return this._application;
  }

  protected _name = '';

  get name(): string {
    return this._name;
  }

  protected _extension = '';

  get extension(): string {
    return this._extension;
  }

  protected _encoding = '';

  get encoding(): string {
    return this._encoding;
  }

  protected _website: {
    title: string,
    url: string
  } = {
    title: '',
    url: ''
  };

  get website(): {
    title: string,
    url: string
  } {
    return this._website;
  }

  protected _notice = '';

  get notice(): string {
    return this._notice;
  }

  protected _multitiers = true;
  public options: any;

  get multitiers(): boolean {
    return this._multitiers;
  }

  public abstract export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum?: number): ExportResult | undefined;

  public abstract import(file: IFile, audiofile: OAudiofile): ImportResult | undefined;
}
