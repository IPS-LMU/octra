import { OAnnotJSON } from '../annotjson';
import { OAudiofile } from '@octra/media';

export type OctraAnnotationFormatType =
  | 'AnnotJSON'
  | 'BundleJSON'
  | 'CTM'
  | 'ELAN'
  | 'BASPartitur'
  | 'PraatTextTable'
  | 'SRT'
  | 'PlainText'
  | 'TextGrid'
  | 'WhisperJSON'
  | 'WebVTT';

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
  file?: IFile;
  error?: string;
}

export abstract class Converter {
  protected _conversion = {
    import: false,
    export: false,
  };

  get conversion(): { import: boolean; export: boolean } {
    return this._conversion;
  }

  protected _application = '';

  get application(): string {
    return this._application;
  }

  protected _name!: OctraAnnotationFormatType;

  get name(): OctraAnnotationFormatType {
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
    title: string;
    url: string;
  } = {
    title: '',
    url: '',
  };

  get website(): {
    title: string;
    url: string;
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

  /**
   * exports AnnotJSON to another annotation format considering an audio file and a level number (optional).
   * @param annotation the AnnotJSON
   * @param audiofile information about the audio file
   * @param levelnum the level number for export
   * returns resulted file or error.
   */
  public abstract export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile,
    levelnum?: number
  ): ExportResult;

  /**
   * converts an file to AnnotJSON considering the audio file. The audio file must be the one used for this transcript file.
   * @param file the transcript file
   * @param audiofile information about the audio file.
   * returns object with an annotjson or an error.
   */
  public abstract import(file: IFile, audiofile: OAudiofile): ImportResult;
}
