import {Converter, File} from './Converter';
import {ISegment, ILevel, OAnnotJSON, OAudiofile} from '../../types/annotjson';
import {isNullOrUndefined} from 'util';

export class PraatTableConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'Text';
    this._showauthors = false;
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotJSON): File {
    let result = '';
    let filename = '';

    const addHeader = (res: string) => {
      return res + 'tmin\ttier\ttext\ttmax\n';
    };

    const addEntry = (res: string, level: ILevel, segment: ISegment) => {
      const tmin = segment.sampleStart / annotation.sampleRate;
      const tmax = (segment.sampleStart + segment.sampleDur) / annotation.sampleRate;
      const transcript = segment.labels[0].value;

      return `${res}${tmin}\t${level.name}\t${transcript}\t${tmax}\n`;
    };

    if (!isNullOrUndefined(annotation)) {
      result = addHeader(result);

      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];
        for (let j = 0; j < level.items.length; j++) {
          const segment = level.items[j];
          result = addEntry(result, level, segment);
        }
      }

      filename = annotation.name + '.Table';
    }

    return {
      name: filename,
      content: result,
      encoding: 'UTF-8',
      type: 'text/plain'
    };
  };

  public import(file: File, audiofile: OAudiofile) {
    const result = null;

    return result;
  };
}
