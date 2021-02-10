import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../annotjson';
import {TimespanPipe} from '../pipes/timespan.pipe';

export class TextConverter extends Converter {

  public options = {
    showTimestampSamples: false,
    showTimestampString: false
  };

  public constructor() {
    super();
    this._application = 'Text Editor';
    this._name = 'Plain text';
    this._extension = '.txt';
    this._website.title = 'WebMaus';
    this._website.url = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/#/services/WebMAUSBasic';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    if (!(annotation === null || annotation === undefined)) {

      let result = '';
      let filename = '';

      if (!(levelnum === null || levelnum === undefined) && levelnum < annotation.levels.length) {
        const level: OLevel = annotation.levels[levelnum];

        if (level.type === 'SEGMENT') {
          for (let j = 0; j < level.items.length; j++) {
            const transcript = level.items[j].labels[0].value;

            result += transcript;
            if (j < level.items.length - 1) {
              const sampleEnd = level.items[j].sampleStart + level.items[j].sampleDur;
              const unixTimestamp = Math.ceil(sampleEnd * 1000 / audiofile.sampleRate);

              if (this.options && (this.options.showTimestampString || this.options.showTimestampSamples)) {
                result += ` <`;
                if (this.options.showTimestampString) {
                  const endTime = new TimespanPipe().transform(unixTimestamp, {
                    showHour: true,
                    showMilliSeconds: true
                  });
                  result += `ts="${endTime}"`;
                }
                if (this.options.showTimestampSamples) {
                  result += (this.options.showTimestampString) ? ' ' : '';
                  result += `sp="${sampleEnd}"`;
                }
                result += `/> `
              } else {
                result += ' ';
              }
            }
          }
          result += '';
        }

        filename = `${annotation.name}`;
        if (annotation.levels.length > 1) {
          filename += `-${level.name}`;
        }
        filename += `${this._extension}`;
      } else {
        console.error('TextConverter needs a level number');
        return null;
      }

      result = result.replace(/\s+/g, ' ');
      return {
        file: {
          name: filename,
          content: result,
          encoding: 'UTF-8',
          type: 'text/plain'
        }
      };
    }
    return null;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.sampleRate);

      const olevel = new OLevel('OCTRA_1', 'SEGMENT');
      const samplerate = audiofile.sampleRate;

      if (file.content.indexOf('<ts') > -1 || file.content.indexOf('<sp') > -1) {
        // segments available
        const regexSplit = /<(?:(?:(?:(?:ts)|(?:sp))="(?:(?:[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{1,3})|[0-9]+)")(?: ?(?:(?:(?:ts)|(?:sp)))="(?:(?:[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{1,3})|[0-9]+)")?(?= *\/>))/g
        const regexExtract = new RegExp(/<(?:(?:((?:ts)|(?:sp))="((?:[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{1,3})|[0-9]+)")(?: ?(?:((?:ts)|(?:sp)))="((?:[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{1,3})|[0-9]+)")?(?= *\/>))/g);
        const transcripts = file.content.split(regexSplit);
        let match = regexExtract.exec(file.content);
        let i = 0;
        let sampleStart = 0;

        if (match !== null) {
          // all fine

          while (match !== null) {
            const olabels: OLabel[] = [];
            let samplePoint = 0;
            const samplePointIndex = match.findIndex(a => a === 'sp');

            if (samplePointIndex > -1 && samplePointIndex + 1 < match.length) {
              // use sample point
              samplePoint = Number(match[samplePointIndex + 1]);
            } else {
              const timeStringIndex = match.findIndex(a => a === '⏱');
              if (timeStringIndex > -1 && timeStringIndex + 1 < match.length) {
                // use time string
                const timeString = match[timeStringIndex + 1];
                samplePoint = this.timeStringToSamples(timeString, audiofile.sampleRate);

                if (samplePoint < 1) {
                  return {
                    annotjson: null,
                    audiofile: null,
                    error: '`can\'t convert time string to samples. Invalid format.'
                  };
                }
              } else {
                console.error(`can't convert time string to samples. Invalid format.`);
                return {
                  annotjson: null,
                  audiofile: null,
                  error: '`can\'t convert time string to samples. Invalid format.'
                };
              }
            }

            olabels.push((new OLabel('OCTRA_1', this.cleanTranscript(transcripts[i]))));
            const sampleDuration = samplePoint - sampleStart;
            const osegment = new OSegment(
              1 + i, sampleStart, sampleDuration, olabels
            );
            olevel.items.push(osegment);
            sampleStart += sampleDuration;

            match = regexExtract.exec(file.content);
            i++;
          }

          if (i < transcripts.length) {
            const olabels: OLabel[] = [];
            olabels.push((new OLabel('OCTRA_1', this.cleanTranscript(transcripts[i]))));
            const osegment = new OSegment(
              1 + i, sampleStart, audiofile.duration - sampleStart, olabels
            );
            olevel.items.push(osegment);
          }
        } else {
          return {
            annotjson: null,
            audiofile: null,
            error: 'Timestamps in text file do have an invalid format.'
          };
        }

        const test = 12;
      } else {
        // text only
        const olabels: OLabel[] = [];
        olabels.push((new OLabel('OCTRA_1', this.cleanTranscript(file.content))));
        const osegment = new OSegment(
          1, 0, Math.round(audiofile.duration), olabels
        );

        olevel.items.push(osegment);
      }

      result.levels.push(olevel);

      return {
        annotjson: result,
        audiofile: null,
        error: ''
      };
    }

    return {
      annotjson: null,
      audiofile: null,
      error: 'Could not read text file beacuse audio file is undefined'
    };
  }

  private timeStringToSamples(timeString: string, sampleRate: number): number {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let milliseconds = 0;

    const regex = new RegExp(/([0-9]{2}):([0-9]{2}):([0-9]{2}).([0-9]{1,3})/g);
    const match = regex.exec(timeString);

    if (match !== null && match.length > 4) {
      hours = Number(match[1]);
      minutes = Number(match[2]);
      seconds = Number(match[3]);
      milliseconds = Number(match[4]);

      seconds += milliseconds / 1000 + minutes * 60 + hours * 3600
      return Math.ceil(seconds * sampleRate);
    }

    return -1;
  }

  private cleanTranscript(transcript: string) {
    return transcript
      .replace(/[\n\t]/gm, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(^ +)|( +$)/g, '')
  }
}
