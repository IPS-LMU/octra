import {OAnnotJSON, OAudiofile} from '../../types/annotjson';

export interface File {
  name: string;
  content: string;
  type: string;
  encoding: string;
}

export abstract class Converter {
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

  get showauthors(): boolean {
    return this._showauthors;
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
  protected _website: {
    title: string,
    url: string
  } = {
    title: '',
    url: ''
  };

  protected _showauthors = false;

  constructor() {

  }

  public abstract export(annotation: OAnnotJSON): File;

  public abstract import(file: File, audiofile: OAudiofile): OAnnotJSON;
}
