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
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      for (let i = 0; i < annotation.levels.length; i++) {
        const level: OLevel = annotation.levels[i];

        if (level.type === 'SEGMENT') {
          result += `LEVEL ${level.name}:\n-------\n\n`;
          for (let j = 0; j < level.items.length; j++) {
            const transcript = level.items[j].labels[0].value;
            result += transcript;
            if (i < transcript.length - 1) {
              result += ' ';
            }
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
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      const content = file.content;
      const olevel = new OLevel('Tier 1', 'SEGMENT');
      const samplerate = audiofile.samplerate;

      const olabels: OLabel[] = [];
      olabels.push((new OLabel('Tier 1', file.content)));
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
  };
}
