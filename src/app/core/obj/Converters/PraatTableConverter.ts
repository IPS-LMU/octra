import {Converter, File} from './Converter';
import {ILevel, ISegment, OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';
import {Functions} from '../../shared/Functions';

export class PraatTableConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'Text';
    this._extension = '.Table';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): File {
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
    const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

    const content = file.content;
    const lines: string[] = content.split('\n');


    // check if filename is equal with audio file
    const filename = file.name.substr(0, file.name.indexOf('.Table'));

    console.log(`${audiofile.name} === ${filename}`);
    if (Functions.contains(audiofile.name, filename)) {
      const tiers: string[] = [];
      // get tiers
      console.log('IMPORT');
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] !== '') {
          const columns: string[] = lines[i].split('\t');
          const tmin = Number(columns[0]);
          const tier = columns[1];
          const text = columns[2];
          const tmax = Number(columns[3]);

          console.log(tier);
          if (tiers.filter((a) => {
              if (a === tier) {
                return true;
              }
            }).length === 0) {
            tiers.push(tier);
          }
        }
      }

      for (let t = 0; t < tiers.length; t++) {
        const olevel = new OLevel(tiers[t], 'SEGMENT');
        let start = 0;
        let puffer = 0;
        let id = 1;
        // start at line 0
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] !== '') {
            const columns: string[] = lines[i].split('\t');
            const tmin = Number(columns[0]);
            const tier = columns[1];
            const text = columns[2];
            const tmax = Number(columns[3]);

            length = 0;

            if (isNaN(tmax)) {
              console.error('column 4 is NaN');
              return null;
            } else {
              length = Number(tmax - tmin);
            }
            const samplerate = audiofile.samplerate;

            if (tier === tiers[t]) {
              if (isNaN(tmin)) {
                console.error('column 1 is NaN');
                return null;
              } else {
                const last = (olevel.items.length > 0 && !isNullOrUndefined(olevel.items[olevel.items.length - 1]))
                  ? olevel.items[olevel.items.length - 1] : null;
                if (last !== null && last.sampleStart + last.sampleDur === Math.round(Number(tmin))) {
                  start = tmin;
                }
              }

              if (puffer > 0) {
                // fill
                const pufferItem = new OSegment(
                  id, Math.round(start * samplerate), Math.round(puffer * samplerate), [new OLabel(tier, '')]
                );
                start = start + puffer;
                olevel.items.push(pufferItem);
                puffer = 0;
                id++;
              }
              const olabels: OLabel[] = [];
              olabels.push((new OLabel(tier, text)));
              const osegment = new OSegment(
                (id),
                Math.round(start * samplerate),
                Math.round(length * samplerate),
                olabels
              );

              olevel.items.push(osegment);
              start += length;
              id++;
            } else {
              puffer += length;
            }
          }
        }
        result.levels.push(olevel);
      }
      console.log(result);
      return result;
    } else {
      console.error('filenames for .Table extension does not match!');
    }

    return null;
  };
}
