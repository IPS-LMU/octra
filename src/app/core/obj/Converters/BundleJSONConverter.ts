import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {IAnnotJSON, OAnnotJSON, OAudiofile, OLevel} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';
import {Functions} from '../../shared/Functions';

export interface Bundle {
  ssffFiles: {
    fileExtension: string,
    encoding: string,
    data: string
  }[],
  mediaFile: {
    encoding: string,
    data: string
  },
  annotation: IAnnotJSON
}

export class BundleJSONConverter extends Converter {

  public constructor() {
    super();
    this._application = '';
    this._name = 'Bundle';
    this._extension = '.json';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = false;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      for (let i = 0; i < annotation.levels.length; i++) {
        const level: OLevel = annotation.levels[i];

        for (let j = 0; j < level.items.length; j++) {
          const transcript = level.items[j].labels[0].value;
          result += transcript;
          if (i < transcript.length - 1) {
            result += ' ';
          }
        }
      }

      filename = annotation.name + this._extension;

    }

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain'
      }
    };
  };

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    const content = file.content;
    const json: Bundle = JSON.parse(content);

    if (!isNullOrUndefined(json) && json.hasOwnProperty('mediaFile') && json.mediaFile.hasOwnProperty('data')
      && json.hasOwnProperty('annotation')) {
      const data = json.mediaFile.data;
      const annotation: IAnnotJSON = json.annotation;
      const buffer = Functions.base64ToArrayBuffer(data);

      const audio_result: OAudiofile = new OAudiofile();
      audio_result.name = annotation.name + '.wav';
      audio_result.size = buffer.byteLength;
      audio_result.samplerate = annotation.sampleRate;
      audio_result.arraybuffer = buffer;


      return {
        annotjson: new OAnnotJSON(annotation.name, annotation.sampleRate, annotation.levels, annotation.links),
        audiofile: audio_result
      };
    }

    return null;
  };
}
