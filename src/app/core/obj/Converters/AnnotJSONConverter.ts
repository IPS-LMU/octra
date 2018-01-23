import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';

export class AnnotJSONConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Emu-WebApp';
    this._name = 'AnnotJSON';
    this._website.title = 'Emu-WebApp';
    this._website.url = 'http://ips-lmu.github.io/EMU-webApp/';
    this._extension = '_annot.json';
    this._conversion.export = true;
    this._conversion.import = true;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    if (!isNullOrUndefined(annotation)) {
      return {
        file: {
          name: annotation.name + this._extension,
          content: JSON.stringify(annotation, null, 2),
          encoding: 'UTF-8',
          type: 'application/json'
        }
      };
    }

    return null;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      let result = new OAnnotJSON(audiofile.name, audiofile.samplerate);
      const content = file.content;

      if (content !== '') {
        result = JSON.parse(content);

        if (result.annotates === audiofile.name) {
          return {
            annotjson: result,
            audiofile: null
          };
        }
      }
    }

    return null;
  }
}
