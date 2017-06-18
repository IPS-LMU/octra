import {Converter, File} from './Converter';
import {OAnnotJSON, OAudiofile} from '../../types/annotjson';
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

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): File {
    if (!isNullOrUndefined(annotation)) {
      return {
        name: annotation.name + this._extension,
        content: JSON.stringify(annotation, null, 2),
        encoding: 'UTF-8',
        type: 'application/json'
      };
    }

    return null;
  };

  public import(file: File, audiofile: OAudiofile) {
    let result = new OAnnotJSON(audiofile.name, audiofile.samplerate);
    const content = file.content;

    if (content !== '') {
      result = JSON.parse(content);

      return result;
    }

    return null;
  };
}
