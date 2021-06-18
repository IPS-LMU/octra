import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {contains} from '@octra/utilities';
import {OAnnotJSON, OAudiofile, OEvent, OLabel, OLevel, OSegment} from '../annotjson';

export class PraatTextgridConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'TextGrid';
    this._extension = '.TextGrid';
    this._website.title = 'Praat';
    this._website.url = 'http://www.fon.hum.uva.nl/praat/';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    if (!(annotation === null || annotation === undefined)) {
      let result = '';
      const durSeconds = (audiofile.duration / audiofile.sampleRate);

      let segLevels = 0;

      for (const level of annotation.levels) {
        if (level.type === 'SEGMENT') {
          segLevels++;
        }
      }

      const addHeader = (res: string) => {
        return res + `File type = "ooTextFile"\n` +
          `Object class = "TextGrid"\n` +
          `\n` +
          `xmin = 0\n` +
          `xmax = ${durSeconds}\n` +
          `tiers? <exists>\n` +
          `size = ${segLevels}\n`;
      };

      result = addHeader(result);

      result += `item []: \n`;

      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];

        if (level.type === 'SEGMENT') {
          result += `    item [${i + 1}]:\n` +
            `        class = "IntervalTier" \n` +
            `        name = "${level.name}" \n` +
            `        xmin = 0 \n` +
            `        xmax = ${durSeconds} \n` +
            `        intervals: size = ${level.items.length} \n`;

          for (let j = 0; j < level.items.length; j++) {
            const segment = level.items[j];

            const secondsStart = segment.sampleStart / audiofile.sampleRate;
            const secondsEnd = (segment.sampleStart + segment.sampleDur) / audiofile.sampleRate;

            result += `        intervals [${j + 1}]:\n` +
              `            xmin = ${secondsStart} \n` +
              `            xmax = ${secondsEnd} \n` +
              `            text = "${segment.labels[0].value}" \n`;
          }
        }
      }

      const filename = annotation.name + this._extension;

      return {
        file: {
          name: filename,
          content: result,
          encoding: 'UTF-16',
          type: 'text/plain'
        }
      };
    }
    return null;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== undefined) {
      const name = audiofile.name.substr(0, audiofile.name.lastIndexOf('.'));
      const fileName = (file.name.indexOf('.') > -1) ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name
      if (name === fileName) {
        const result = new OAnnotJSON(audiofile.name, audiofile.sampleRate);

        let content = file.content;
        // replace
        const ctrlChar = String.fromCharCode(13);
        content = content.replace(new RegExp(ctrlChar, 'g'), '');
        const lines: string[] = content.split('\n');

        let segNum = 1;
        // check if header is first
        if (lines.length > 14) {
          if (
            contains(lines[0], 'File type = "ooTextFile"')
            && contains(lines[1], 'Object class = "TextGrid"')) {
            // is TextGrid

            let lvlNum = 0;
            const found = lines[7].match(/item\s\[]:\s*/);

            if (found !== null) {
              // start reading segments
              for (let i = 8; i < lines.length; i++) {
                lvlNum++;
                if (lines[i] !== '') {
                  const level = '    ';
                  if (lines[i] === level + `item [${lvlNum}]:`) {
                    i++;

                    // get class
                    let classStr = null;
                    let test = lines[i].match(/class = "(.*)"/);
                    if ((test === null || test === undefined)) {
                      return {
                        annotjson: null,
                        audiofile: null,
                        error: `PraatTextGrid could not read line ${i}.`
                      };
                    }
                    classStr = test[1];
                    i++;

                    // get lvl name
                    let lvlName = null;
                    test = lines[i].match(/name = "(.*)"/);
                    if ((test === null || test === undefined)) {
                      return {
                        annotjson: null,
                        audiofile: null,
                        error: `PraatTextGrid could not read line ${i}.`
                      };
                    }
                    lvlName = test[1];
                    const olevel = (classStr === 'IntervalTier') ? new OLevel(lvlName, 'SEGMENT') : new OLevel(lvlName, 'EVENT');
                    i++;

                    // ignore xmin and xmax, interval size
                    i++;
                    i++;
                    i++;

                    // read items
                    let match = lines[i].match(/item \[([0-9]+)]:/);

                    while (lines[i] !== '' && (match === null || match === undefined) && i < lines.length) {
                      let isActive = true;
                      test = lines[i].match(/intervals \[[0-9]+]:/);
                      if ((test === null || test === undefined)) {
                        test = lines[i].match(/points \[[0-9]+]:/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        } else {
                          isActive = false;
                        }
                      }
                      i++; // next line begins with 'number' (if is point) or 'xmin' (if is interval)

                      if (isActive) {
                        test = lines[i].match(/xmin = (.*)/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        }
                        i++;
                        const xmin = Number(test[1]);

                        test = lines[i].match(/xmax = (.*)/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        }
                        i++;
                        const xmax = Number(test[1]);

                        test = lines[i].match(/text = "(.*)"/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        }
                        i++;
                        const text = test[1];

                        const olabels: OLabel[] = [];
                        olabels.push((new OLabel(lvlName, text)));
                        const osegment = new OSegment(
                          (segNum),
                          Math.round(xmin * audiofile.sampleRate),
                          Math.round((xmax - xmin) * audiofile.sampleRate),
                          olabels
                        );
                        olevel.items.push(osegment);
                      } else {
                        test = lines[i].match(/number = (.*)/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        }
                        i++;

                        const numberStr = Number(test[1]);

                        test = lines[i].match(/mark = "(.*)"/);
                        if ((test === null || test === undefined)) {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `PraatTextGrid could not read line ${i}.`
                          };
                        }
                        i++;
                        const mark = test[1];

                        const olabels: OLabel[] = [];
                        olabels.push((new OLabel(lvlName, mark)));
                        const oevent = new OEvent(segNum, Math.round(numberStr * audiofile.sampleRate), olabels);
                        olevel.items.push(oevent);
                      }

                      segNum++;
                      match = lines[i].match(/item \[([0-9]+)]:/);
                    }
                    segNum++;
                    i--;
                    result.levels.push(olevel);
                  }
                }
              }
            }

            if (result.levels.length === 0) {
              return {
                annotjson: null,
                audiofile: null,
                error: `Could not import any level.`
              };
            }

            return {
              annotjson: result,
              audiofile: null,
              error: ''
            };
          } else {
            return {
              annotjson: null,
              audiofile: null,
              error: 'invalid Textgrid Header'
            };
          }
        } else {
          return {
            annotjson: null,
            audiofile: null,
            error: 'Textgrid has less than 14 lines.'
          };
        }
      } else {
        return {
          annotjson: null,
          audiofile: null,
          error: `names of audio file and TextGrid file do not match.`
        };
      }
    } else {
      return {
        annotjson: null,
        audiofile: null,
        error: 'audiofile is null.'
      };
    }

    return {
      annotjson: null,
      audiofile: null,
      error: `This PraatTextgrid file is not compatible.`
    };
  }
}
