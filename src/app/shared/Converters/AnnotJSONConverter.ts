import {Converter, File} from './Converter';
import {OAnnotJSON, OAudiofile, OLevel} from '../../types/annotjson';
import {isNullOrUndefined} from 'util';

export class AnnotJSONConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Emu-WebApp';
    this._name = 'AnnotJSON';
    this._website.title = 'Emu-WebApp';
    this._website.url = 'http://ips-lmu.github.io/EMU-webApp/';
    this._showauthors = true;
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotJSON): File {
    if (!isNullOrUndefined(annotation)) {
      return {
        name: annotation.name + '_annot.json',
        content: JSON.stringify(annotation, null, 2),
        encoding: 'UTF-8',
        type: 'application/json'
      };
    }

    return null;
  };

  public import(file: File, audiofile: OAudiofile) {
    const result = null;

    return null;
  };
}
