import { OAudiofile } from '@octra/media';
import { FormGeneratorJSONSchema } from '@octra/utilities';
import { OAnnotJSON } from '../annotjson';
import { SupportedApplication } from './SupportedApplications';

export type OctraAnnotationFormatType =
  'AnnotJSON' | 'BundleJSON' | 'CTM' | 'ELAN' | 'BASPartitur' | 'PraatTextTable' | 'SRT' | 'PlainText' | 'TextGrid' | 'WhisperJSON' | 'WebVTT';

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

export abstract class Converter<I extends object = object, O extends object = object> {
  protected _conversion = {
    import: false,
    export: false,
  };

  get conversion(): { import: boolean; export: boolean } {
    return this._conversion;
  }

  protected _applications: {
    application: SupportedApplication;
    recommended?: boolean;
  }[] = [];

  public defaultImportOptions: any;

  get applications(): {
    application: SupportedApplication;
    recommended?: boolean;
  }[] {
    return this._applications;
  }

  protected _name!: OctraAnnotationFormatType;

  get name(): OctraAnnotationFormatType {
    return this._name;
  }

  protected _extensions: string[] = [];

  get extensions(): string[] {
    return this._extensions;
  }

  protected _encoding = '';

  get encoding(): string {
    return this._encoding;
  }

  protected _notice = '';

  get notice(): string {
    return this._notice;
  }

  protected _multitiers = true;

  get multitiers(): boolean {
    return this._multitiers;
  }

  /**
   * exports AnnotJSON to another annotation format considering an audio file and a level number (optional).
   * @param annotation the AnnotJSON
   * @param audiofile information about the audio file
   * @param options Options for this converter
   * returns resulted file or error.
   */
  public abstract export(annotation: OAnnotJSON, audiofile: OAudiofile, options?: O): ExportResult;

  /**
   * converts an file to AnnotJSON considering the audio file. The audio file must be the one used for this transcript file.
   * @param file the transcript file
   * @param audiofile information about the audio file.
   * returns object with an annotjson or an error.
   */
  public abstract import(file: IFile, audiofile: OAudiofile, options?: I): ImportResult;

  /**
   * checks if the converter needs further options to import the file.
   * @param file the transcript file
   * @param audiofile information about the audio file.
   */
  public abstract needsOptionsForImport(file: IFile, audiofile: OAudiofile): FormGeneratorJSONSchema | undefined;

  /**
   * checks if the converter needs further options to export a file.
   * @param file the transcript file
   * @param audiofile information about the audio file.
   */
  public abstract needsOptionsForExport(annotation: OAnnotJSON, audiofile: OAudiofile): FormGeneratorJSONSchema | undefined;
}
