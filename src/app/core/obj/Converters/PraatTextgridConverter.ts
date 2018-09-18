import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {ILevel, ISegment, OAnnotJSON, OAudiofile, OEvent, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';
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

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    let result = '';
    let filename = '';
    const dur_seconds = (audiofile.duration / audiofile.samplerate);

    let seg_levels = 0;

    for (let i = 0; i < annotation.levels.length; i++) {
      if (annotation.levels[i].type === 'SEGMENT') {
        seg_levels++;
      }
    }
    const addHeader = (res: string) => {
      return res + `File type = "ooTextFile"\n` +
        `Object class = "TextGrid"\n` +
        `\n` +
        `xmin = 0\n` +
        `xmax = ${dur_seconds}\n` +
        `tiers? <exists>\n` +
        `size = ${seg_levels}\n`;
    };

    const addEntry = (res: string, level: ILevel, segment: ISegment) => {
      const tmin = segment.sampleStart / annotation.sampleRate;
      const tmax = (segment.sampleStart + segment.sampleDur) / annotation.sampleRate;
      const transcript = segment.labels[0].value;

      return `${res}${tmin}\t${level.name}\t${transcript}\t${tmax}\n`;
    };

    if (!(annotation === null || annotation === undefined)) {
      result = addHeader(result);

      result += `item []: \n`;

      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];

        if (level.type === 'SEGMENT') {
          result += `    item [${i + 1}]:\n` +
            `        class = "IntervalTier" \n` +
            `        name = "${level.name}" \n` +
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
      }

      filename = annotation.name + this._extension;
    }

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-16',
        type: 'text/plain'
      }
    };
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      let content = file.content;
      // replace
      const ctrl_char = String.fromCharCode(13);
      content = content.replace(new RegExp(ctrl_char, 'g'), '');
      const lines: string[] = content.split('\n');


      let seg_num = 1;
      // check if header is first
      if (lines.length > 14) {
        if (
          Functions.contains(lines[0], 'File type = "ooTextFile"')
          && Functions.contains(lines[1], 'Object class = "TextGrid"')) {
          // is TextGrid

          let lvl_num = 0;

          if (lines[7] === 'item []:') {
            // start reading segments
            for (let i = 8; i < lines.length; i++) {
              lvl_num++;
              if (lines[i] !== '') {

                const level = '    ';
                if (lines[i] === level + `item [${lvl_num}]:`) {
                  i++;

                  // get class
                  let class_str = null;
                  let test = lines[i].match(/class = "(.*)"/);
                  if ((test === null || test === undefined)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  class_str = test[1];
                  i++;

                  // get lvl name
                  let lvl_name = null;
                  test = lines[i].match(/name = "(.*)"/);
                  if ((test === null || test === undefined)) {
                    console.error(`PraatTextGrid could not read line ${i}`);
                    return null;
                  }
                  lvl_name = test[1];
                  const olevel = (class_str === 'IntervalTier') ? new OLevel(lvl_name, 'SEGMENT') : new OLevel(lvl_name, 'EVENT');
                  i++;

                  // ignore xmin and xmax, interval size
                  i++;
                  i++;
                  i++;

                  // read items
                  let match = lines[i].match('item \\[([0-9]+)\\]:');

                  while (lines[i] !== '' && (match === null || match === undefined) && i < lines.length) {
                    let is_interval = true;
                    test = lines[i].match(new RegExp('intervals \\[[0-9]+\\]:'));
                    if ((test === null || test === undefined)) {
                      test = lines[i].match(new RegExp('points \\[[0-9]+\\]:'));
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      } else {
                        is_interval = false;
                      }
                    }
                    i++; // next line begins with 'number' (if is point) or 'xmin' (if is interval)

                    if (is_interval) {
                      test = lines[i].match(/xmin = (.*)/);
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      }
                      i++;
                      const xmin = Number(test[1]);

                      test = lines[i].match(/xmax = (.*)/);
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      }
                      i++;
                      const xmax = Number(test[1]);

                      test = lines[i].match(/text = "(.*)"/);
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      }
                      i++;
                      const text = test[1];

                      const olabels: OLabel[] = [];
                      olabels.push((new OLabel(lvl_name, text)));
                      const osegment = new OSegment(
                        (seg_num),
                        Math.round(xmin * audiofile.samplerate),
                        Math.round((xmax - xmin) * audiofile.samplerate),
                        olabels
                      );
                      olevel.items.push(osegment);
                    } else {
                      test = lines[i].match(/number = (.*)/);
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      }
                      i++;

                      const number = Number(test[1]);

                      test = lines[i].match(/mark = "(.*)"/);
                      if ((test === null || test === undefined)) {
                        console.error(`PraatTextGrid could not read line ${i}`);
                        return null;
                      }
                      i++;
                      const mark = test[1];

                      const olabels: OLabel[] = [];
                      olabels.push((new OLabel(lvl_name, mark)));
                      const oevent = new OEvent(seg_num, Math.round(number * audiofile.samplerate), olabels);
                      olevel.items.push(oevent);
                    }

                    seg_num++;
                    match = lines[i].match('item \\[([0-9]+)\\]:');
                  }
                  seg_num++;
                  i--;
                  result.levels.push(olevel);
                }
              }
            }
          }

          if (result.levels.length === 0) {
            return null;
          }

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
