import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';

export class TextConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Text Editor';
    this._name = 'Plain Text';
    this._extension = '.txt';
    this._website.title = 'WebMaus';
    this._website.url = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/#/services/WebMAUSBasic';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(levelnum) && levelnum < annotation.levels.length) {
      const level: OLevel = annotation.levels[levelnum];

      if (level.type === 'SEGMENT') {
        for (let j = 0; j < level.items.length; j++) {
          const transcript = level.items[j].labels[0].value;
          result += transcript;
          if (j < level.items.length - 1) {
            result += ' ';
          }
        }
        result += '\n';
      }

      filename = `${annotation.name}-${level.name}${this._extension}`;

    } else {
      console.error('TextConverter needs a level number');
      return null;
    }

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain'
      }
    };
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      const content = file.content;
      const olevel = new OLevel('Tier_1', 'SEGMENT');
      const samplerate = audiofile.samplerate;

      const olabels: OLabel[] = [];
      olabels.push((new OLabel('Tier_1', file.content)));
      const osegment = new OSegment(
        1, 0, Math.round(audiofile.duration * samplerate), olabels
      );

      olevel.items.push(osegment);
      result.levels.push(olevel);

      return {
        annotjson: result,
        audiofile: null
      };
    }

    return null;
  }
}
