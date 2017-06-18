import {Converter, File} from './Converter';
import {ILevel, ISegment, OAnnotJSON, OAudiofile} from '../../types/annotjson';
import {isNullOrUndefined} from 'util';

export class PraatTextgridConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'Textgrid';
    this._extension = '.Textgrid';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): File {
    let result = '';
    let filename = '';
    const dur_seconds = (audiofile.duration / audiofile.samplerate);

    const addHeader = (res: string) => {
      return res + `File type = "ooTextFile"\n` +
        `Object class = "TextGrid"\n` +
        `\n` +
        `xmin = 0\n` +
        `xmax = ${dur_seconds}\n` +
        `tiers? <exists>\n` +
        `size = 1\n`;
    };

    const addEntry = (res: string, level: ILevel, segment: ISegment) => {
      const tmin = segment.sampleStart / annotation.sampleRate;
      const tmax = (segment.sampleStart + segment.sampleDur) / annotation.sampleRate;
      const transcript = segment.labels[0].value;

      return `${res}${tmin}\t${level.name}\t${transcript}\t${tmax}\n`;
    };

    if (!isNullOrUndefined(annotation)) {
      result = addHeader(result);

      result += `item []:\n`;

      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];

        result += `    item [1]:\n` +
          `        class = "IntervalTier"\n` +
          `        name = "Orthographic"\n` +
          `        xmin = 0\n` +
          `        xmax = ${dur_seconds}\n` +
          `        intervals: size = ${level.items.length}\n`;

        for (let j = 0; j < level.items.length; j++) {
          const segment = level.items[j];

          const seconds_start = segment.sampleStart / audiofile.samplerate;
          const seconds_end = (segment.sampleStart + segment.sampleDur) / audiofile.samplerate;

          result += `        intervals [${j + 1}]:\n` +
            `            xmin = ${seconds_start}\n` +
            `            xmax = ${seconds_end}\n` +
            `            text = "${segment.labels[0].value}\n"`;
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

  public import(file: File, audiofile: OAudiofile): OAnnotJSON {
    return null;
  };
}
