import {OAnnotation} from '../../types/annotation';

export interface File {
  name: string;
  content: string;
  type: string;
  encoding: string;
}

export abstract class Converter {
  get conversion(): { import: boolean; export: boolean } {
    return this._conversion;
  }

  get showauthors(): boolean {
    return this._showauthors;
  }

  get authors(): string {
    return this._authors;
  }

  protected _conversion = {
    import: false,
    export: false
  };
  protected _authors = '';
  protected _showauthors = false;

  constructor() {

  }

  public abstract convert(data: any, filename: string): any;

  public abstract export(annotation: OAnnotation): File;

  public abstract import(file: File): OAnnotation;
}
