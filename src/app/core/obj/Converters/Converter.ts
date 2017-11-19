import {OAnnotJSON, OAudiofile} from '../Annotation/AnnotJSON';

export interface IFile {
  name: string;
  content: string;
  type: string;
  encoding: string;
}

export interface ImportResult {
  annotjson: OAnnotJSON;
  audiofile: OAudiofile;
}

export interface ExportResult {
  file: IFile;
}

export abstract class Converter {
  get multitiers(): boolean {
    return this._multitiers;
  }

  get notice(): string {
    return this._notice;
  }

  get encoding(): string {
    return this._encoding;
  }

  get extension(): string {
    return this._extension;
  }

  get website(): {
    title: string,
    url: string
  } {
    return this._website;
  }

  get name(): string {
    return this._name;
  }

  get conversion(): { import: boolean; export: boolean } {
    return this._conversion;
  }

  get application(): string {
    return this._application;
  }

  protected _conversion = {
    import: false,
    export: false
  };

  protected _application = '';
  protected _name = '';
  protected _extension = '';
  protected _encoding = '';
  protected _website: {
    title: string,
    url: string
  } = {
    title: '',
    url: ''
  };
  protected _notice = '';
  protected _multitiers = true;

  constructor() {

  }

  public abstract export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum?: number): ExportResult;

  public abstract import(file: IFile, audiofile: OAudiofile): ImportResult;
}
