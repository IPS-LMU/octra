import {Converter, File} from './Converter';
import {ILevel, ISegment, OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../annotjson';
import {isNullOrUndefined} from 'util';
import {Functions} from '../../shared/Functions';

export class PraatTextgridConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'TextGrid';
    this._extension = '.TextGrid';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
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

      result += `item []: \n`;

      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];

        result += `    item [1]:\n` +
          `        class = "IntervalTier" \n` +
          `        name = "Orthographic" \n` +
          `        xmin = 0 \n` +
          `        xmax = ${dur_seconds} \n` +
          `        intervals: size = ${level.items.length} \n`;

        for (let j = 0; j < level.items.length; j++) {
          const segment = level.items[j];

          const seconds_start = segment.sampleStart / audiofile.samplerate;
          const seconds_end = (segment.sampleStart + segment.sampleDur) / audiofile.samplerate;

          result += `        intervals [${j + 1}]:\n` +
            `            xmin = ${seconds_start} \n` +
            `            xmax = ${seconds_end} \n` +
            `            text = "${segment.labels[0].value}" \n`;
        }
      }

      filename = annotation.name + this._extension;
    }

    return {
      name: filename,
      content: result,
      encoding: 'UTF-16',
      type: 'text/plain'
    };
  };

  public import(file: File, audiofile: OAudiofile): OAnnotJSON {
    const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

    // TODO Does this work?
    let content = file.content;
    // replace
    const ctrl_char = String.fromCharCode(13);
    content = content.replace(new RegExp(ctrl_char, 'g'), '');
    const lines: string[] = content.split('\n');


    // check if header is first

    if (lines.length > 14) {
      if (
        Functions.contains(lines[0], 'File type = "ooTextFile"')
        && Functions.contains(lines[1], 'Object class = "TextGrid"')) {
        // is TextGrid

        const olevel = new OLevel('Orthographic', 'SEGMENT');

        let lvl_num = 1;

        if (lines[7] === 'item []: ') {
                    // start reading segments
          for (let i = 8; i < lines.length; i++) {
            if (lines[i] !== '') {

              let level = '    ';

              if (lines[i] === level + `item [${lvl_num}]:`) {
                i++;

                // get class
                let class_str = null;
                let test = lines[i].match(/class = "(.*)"/);
                if (isNullOrUndefined(test)) {
                  console.error(`PraatTextGrid could not read line ${i}`);
                  return null;
                }
                class_str = test[1];
                i++;

                // get lvl name
                let lvl_name = null;
                test = lines[i].match(/name = "(.*)"/);
                if (isNullOrUndefined(test)) {
                  console.error(`PraatTextGrid could not read line ${i}`);
                  return null;
                }
                lvl_name = test[1];
                i++;

                // ignore xmin and xmax, interval size
                i++;
                i++;
                i++;


                // read segments
                let seg_num = 1;
                while (lines[i] !== '' && isNullOrUndefined(lines[i].match('item \\[(.*)\\]:')) && i < lines.length) {
                  test = lines[i].match(new RegExp('intervals \\[[0-9]+\\]:'));
                  if (isNullOrUndefined(test)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  i++;

                  test = lines[i].match(/xmin = (.*) /);
                  if (isNullOrUndefined(test)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  i++;
                  const xmin = Number(test[1]);

                  test = lines[i].match(/xmax = (.*) /);
                  if (isNullOrUndefined(test)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  i++;
                  const xmax = Number(test[1]);

                  test = lines[i].match(/text = "(.*)" /);
                  if (isNullOrUndefined(test)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  i++;
                  const text = test[1];

                  const samplerate = audiofile.samplerate;

                  const olabels: OLabel[] = [];
                  olabels.push((new OLabel('Orthographic', text)));
                  const osegment = new OSegment(
                    (seg_num),
                    Math.round(xmin * samplerate),
                    Math.round((xmax - xmin) * samplerate),
                    olabels
                  );

                  olevel.items.push(osegment);

                  seg_num++;
                }

                result.levels.push(olevel);
                return result;
              }
            }
          }
        }
      }
    }

    return null;
  };
}
