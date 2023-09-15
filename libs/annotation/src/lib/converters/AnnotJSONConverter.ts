import {
  Converter,
  ExportResult,
  IFile,
  ImportResult,
  OctraAnnotationFormatType,
} from './Converter';
import { OAnnotJSON } from '../annotjson';
import { OAudiofile } from '@octra/web-media';

export class AnnotJSONConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'AnnotJSON';

  public constructor() {
    super();
    this._application = 'Emu-WebApp';
    this._website.title = 'Emu-WebApp';
    this._website.url = 'http://ips-lmu.github.io/EMU-webApp/';
    this._extension = '_annot.json';
    this._conversion.export = true;
    this._conversion.import = true;
  }

  public override export(annotation: OAnnotJSON): ExportResult {
    if (annotation) {
      return {
        file: {
          name: annotation.name + this._extension,
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

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile) {
      let result = new OAnnotJSON(
        audiofile.name,
        file.name,
        audiofile.sampleRate
      );
      const content = file.content;

      if (content !== '') {
        try {
          result = JSON.parse(content);

          if (
            result.annotates === audiofile.name &&
            result.sampleRate === audiofile.sampleRate
          ) {
            return {
              annotjson: result,
              audiofile: undefined,
              error: '',
            };
          } else {
            return {
              annotjson: undefined,
              audiofile: undefined,
              error:
                'Either the "annotates" field or the sample rate are not equal to the audio file.',
            };
          }
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
