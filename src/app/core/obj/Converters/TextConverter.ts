import {Converter, File} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../annotjson';
import {isNullOrUndefined} from 'util';

export class TextConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Text Editor';
    this._name = 'Text';
    this._extension = '.txt';
    this._website.title = 'WebMaus';
    this._website.url = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/#/services/WebMAUSBasic';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): File {
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
      name: filename,
      content: result,
      encoding: 'UTF-8',
      type: 'text/plain'
    };
  };

  public import(file: File, audiofile: OAudiofile) {
    const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

    const content = file.content;
    const olevel = new OLevel('Orthographic', 'SEGMENT');
    const samplerate = audiofile.samplerate;

    const olabels: OLabel[] = [];
    olabels.push((new OLabel('Orthographic', file.content)));
    const osegment = new OSegment(
      1, 0, Math.round(audiofile.duration * samplerate), olabels
    );

    olevel.items.push(osegment);
    result.levels.push(olevel);

    return result;
  };
}
