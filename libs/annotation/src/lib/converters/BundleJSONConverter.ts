import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {base64ToArrayBuffer, contains} from '@octra/utilities';
import {IAnnotJSON, OAnnotJSON, OAudiofile} from '../annotjson';

export interface Bundle {
  ssffFiles: {
    fileExtension: string,
    encoding: string,
    data: string
  }[];
  mediaFile: {
    encoding: string,
    data: string
  };
  annotation: IAnnotJSON;
}

export class BundleJSONConverter extends Converter {

  public constructor() {
    super();
    this._application = '';
    this._name = 'Bundle';
    this._extension = '_bndl.json';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = false;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._notice = 'Export to Bundle is currenty not possible';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    let result = '';
    let filename = '';

    if (!(annotation === null || annotation === undefined)) {
      const bundle = {
        ssffFiles: [],
        mediaFile: {
          encoding: 'BASE654',
          data: btoa(
            new Uint8Array(audiofile.arraybuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
        }, annotation
      };
      result = JSON.stringify(bundle, null, 2);
      filename = annotation.name + this._extension;

      return {
        file: {
          name: filename,
          content: result,
          encoding: 'UTF-8',
          type: 'application/json'
        }
      };
    }

    return null;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    const content = file.content;
    let json: Bundle;
    try {
      json = JSON.parse(content);
    } catch (e) {
      return {
        annotjson: null,
        audiofile: null,
        error: `This BundleJSON file is not compatible with this audio file.`
      };
    }

    if (!(json === null || json === undefined) && json['mediaFile'] && json.mediaFile['data']
      && json['annotation']) {
      const data = json.mediaFile.data;
      const annotation: IAnnotJSON = json.annotation;
      const buffer = base64ToArrayBuffer(data);

      const audioResult: OAudiofile = new OAudiofile();
      audioResult.name = annotation.name + annotation.annotates.substr(annotation.annotates.lastIndexOf('.'));

      if (contains(audioResult.name, '.wav') || contains(audioResult.name, '.ogg')) {
        audioResult.size = buffer.byteLength;
        audioResult.sampleRate = annotation.sampleRate;
        audioResult.arraybuffer = buffer;

        return {
          annotjson: new OAnnotJSON(annotation.name, annotation.sampleRate, annotation.levels, annotation.links),
          audiofile: audioResult,
          error: ''
        };
      } else {
        return {
          annotjson: null,
          audiofile: null,
          error: `Could not read mediaFile attribute.`
        };
      }
    }

    return {
      annotjson: null,
      audiofile: null,
      error: `This BundleJSON file is not compatible with this audio file.`
    };
  }
}
