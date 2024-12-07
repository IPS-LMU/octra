import { OAudiofile } from '@octra/media';
import { FileInfo } from '@octra/web-media';
import { OAnnotJSON } from '../annotjson';
import {
  Converter,
  ExportResult,
  IFile,
  ImportResult,
  OctraAnnotationFormatType,
} from './Converter';
import {
  BASWebservicesApplication,
  EMUWebAppApplication,
  OctraApplication
} from './SupportedApplications';

export class AnnotJSONConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'AnnotJSON';

  public constructor() {
    super();
    this._applications = [
      {
        application: new OctraApplication(),
        recommended: true,
      },
      {
        application: new EMUWebAppApplication(),
        recommended: true,
      },
      {
        application: new BASWebservicesApplication(),
        recommended: true,
      },
    ];
    this._extensions = ['_annot.json'];
    this._conversion.export = true;
    this._conversion.import = true;
  }

  public override export(annotation: OAnnotJSON): ExportResult {
    if (annotation) {
      return {
        file: {
          name: annotation.name + this._extensions[0],
          content: JSON.stringify(annotation, undefined, 2),
          encoding: 'UTF-8',
          type: 'application/json',
        },
      };
    }

    return {
      error: 'Annotation is undefined or null',
    };
  }

  override needsOptionsForImport(file: IFile, audiofile: OAudiofile): any {
    return undefined;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile) {
      let result = new OAnnotJSON(
        audiofile.name,
        FileInfo.extractFileName(file.name).name,
        audiofile.sampleRate
      );
      const content = file.content;

      if (content !== '') {
        try {
          result = JSON.parse(content);

          if (
            result.annotates !== audiofile.name &&
            result.annotates !== FileInfo.extractFileName(audiofile.name).name
          ) {
            return {
              annotjson: undefined,
              audiofile: undefined,
              error: 'The "annotates" field is not equal to the audio file.',
            };
          }

          if (result.sampleRate !== audiofile.sampleRate) {
            return {
              annotjson: undefined,
              audiofile: undefined,
              error: 'Sample rate is not equal to the audio file.',
            };
          }

          return {
            annotjson: result,
            audiofile: undefined,
            error: '',
          };
        } catch (e) {
          return {
            annotjson: undefined,
            audiofile: undefined,
            error: 'Could not read AnnotJSON (parse error).',
          };
        }
      } else {
        return {
          annotjson: undefined,
          audiofile: undefined,
          error: `Could not read AnnotJSON. (empty content)`,
        };
      }
    }

    return {
      annotjson: undefined,
      audiofile: undefined,
      error: `This AnnotJSON is not compatible.`,
    };
  }
}
