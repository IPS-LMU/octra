import { Converter, ExportResult, IFile, ImportResult } from './Converter';
import {
  OAnnotJSON,
  OAnyLevel,
  OLabel,
  OSegment,
  OSegmentLevel,
} from '../annotjson';
import { OAudiofile } from '@octra/media';

export class WebVTTConverter extends Converter {
  public constructor() {
    super();
    this._application = 'Videoplayer';
    this._name = 'WebVTT Subtitles';
    this._extension = '.vtt';
    this._website.title = 'Web Video Text Tracks Format (WebVTT)\n';
    this._website.url =
      'https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
    this._notice =
      'OCTRA reads timestamps and the transcripts. STYLE, NOTICE and other parts of VTT will be ignored. Multi-Line-Transcript will be merged.';
  }

  public export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile,
    levelnum: number
  ): ExportResult | undefined {
    if (annotation) {
      let result = 'WEBVTT\n\n';
      let filename = '';

      if (
        levelnum === undefined ||
        levelnum < 0 ||
        levelnum > annotation.levels.length
      ) {
        console.error('WebVTTConverter needs a level number');
        return undefined;
      }

      if (levelnum < annotation.levels.length) {
        const level: OAnyLevel<OSegment> = annotation.levels[levelnum];

        let counter = 1;
        if (level.type === 'SEGMENT') {
          for (let j = 0; j < level.items.length; j++) {
            const item = level.items[j] as OSegment;
            const transcript = item.labels[0].value
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            const start = this.getTimeStringFromSamples(
              item.sampleStart!,
              annotation.sampleRate
            );
            const end = this.getTimeStringFromSamples(
              item.sampleStart! + item.sampleDur!,
              annotation.sampleRate
            );

            if (transcript !== '') {
              result += `${counter}\n`;
              result += `${start} --> ${end}\n`;
              result += `${transcript}\n\n`;
              counter++;
            }
          }
        }

        filename = `${annotation.name}`;
        if (annotation.levels.length > 1) {
          filename += `-${level.name}`;
        }
        filename += `${this._extension}`;
      }

      return {
        file: {
          name: filename,
          content: result,
          encoding: 'UTF-8',
          type: 'text/plain',
        },
      };
    }
    return undefined;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile) {
      const result = new OAnnotJSON(
        audiofile.name,
        file.name,
        audiofile.sampleRate
      );
      result.levels.push(new OSegmentLevel(`OCTRA_1`));

      const content = file.content;

      let counterID = 1;
      if (content !== '') {
        // check header
        const headerCheck = new RegExp('WEBVTT(?: - ([^\\n]+))?', 'g');
        const headerMatches = headerCheck.exec(content);

        if (headerMatches !== undefined) {
          let body = content;
          const findFirstCueRegex = new RegExp(
            '([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}) --> ' +
              '([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}).*',
            'g'
          );

          const firstCueMatch = findFirstCueRegex.exec(content);

          if (firstCueMatch !== null) {
            body = body.substring(firstCueMatch.index).replace(/^\n+/g, '');
            const cues = body.split(/\n\n/g).filter((a) => a.trim() !== '');

            for (const cue of cues) {
              const regex = new RegExp(
                '([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}) -->' +
                  ' ([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}).*',
                'g'
              );
              const matches = regex.exec(cue);

              let lastEnd = 0;
              if (matches !== null) {
                const cueWithoutTimestamp = cue.substring(
                  matches.index + matches[0].length
                );
                const linesOfCue = cueWithoutTimestamp
                  .split(/\n/g)
                  .filter((a) => a.trim() !== '');

                const timeStart = this.getSamplesFromTimeString(
                  matches[1],
                  audiofile.sampleRate
                );
                const timeEnd = this.getSamplesFromTimeString(
                  matches[2],
                  audiofile.sampleRate
                );
                let escapedTranscript = '';
                if (
                  timeStart > -1 &&
                  timeEnd > -1 &&
                  timeStart < audiofile.duration &&
                  timeEnd < audiofile.duration
                ) {
                  for (let i = 0; i < linesOfCue.length; i++) {
                    let transcriptLineOfCue = linesOfCue[i];
                    if (
                      transcriptLineOfCue === 'NOTE' ||
                      transcriptLineOfCue === 'STYLE'
                    ) {
                      // stop reading cue because of NOTE block
                      break;
                    }

                    transcriptLineOfCue = transcriptLineOfCue
                      .replace(/NOTE\s.*/g, '')
                      .replace(/(\n|\s)+$/g, '')
                      .replace('&lt;', '<')
                      .replace('&gt;', '>')
                      .replace(/^-\s/g, '');

                    if (transcriptLineOfCue.trim() !== '') {
                      escapedTranscript += ` ${transcriptLineOfCue}`;
                    }
                  }

                  if (escapedTranscript.trim() !== '') {
                    if (timeStart > lastEnd) {
                      (result.levels[0].items as OSegment[]).push(
                        new OSegment(
                          counterID++,
                          lastEnd,
                          timeStart - lastEnd,
                          [new OLabel('OCTRA_1', '')]
                        )
                      );
                    }

                    (result.levels[0].items as OSegment[]).push(
                      new OSegment(
                        counterID++,
                        timeStart,
                        timeEnd - timeStart,
                        [new OLabel('OCTRA_1', escapedTranscript)]
                      )
                    );

                    lastEnd = timeEnd;
                  } else {
                    // ignore
                  }
                } else {
                  return {
                    annotjson: undefined,
                    audiofile: undefined,
                    error:
                      "The last segment's end or start point is out of the audio duration.",
                  };
                }
              }
            }

            for (let i = 0; i < result.levels.length; i++) {
              const level = result.levels[i] as OSegmentLevel<OSegment>;
              if (level.items.length > 0) {
                const lastItem = level.items[level.items.length - 1];
                const restSamples =
                  audiofile.duration -
                  (lastItem.sampleStart + lastItem.sampleDur);

                if (restSamples > 300) {
                  // add empty segment
                  level.items.push(
                    new OSegment(
                      counterID++,
                      lastItem.sampleStart + lastItem.sampleDur,
                      restSamples,
                      [new OLabel(`OCTRA_${i + 1}`, '')]
                    )
                  );
                } else {
                  // set last segment duration to fit last sample
                  const lastSegment = level.items[level.items.length - 1];
                  level.items[level.items.length - 1].sampleDur =
                    Number(audiofile.duration) -
                    Number(lastSegment.sampleStart);
                }
              }
            }

            return {
              annotjson: result,
              audiofile: undefined,
              error: '',
            };
          } else {
            // not found
            return {
              annotjson: undefined,
              audiofile: undefined,
              error: 'Could not find a cue in VTT file',
            };
          }
        } else {
          return {
            annotjson: undefined,
            audiofile: undefined,
            error: 'This WebVTT file is bad formatted (header)',
          };
        }
      }
    }

    return {
      annotjson: undefined,
      audiofile: undefined,
      error: 'This WebVTT file is not compatible with this audio file.',
    };
  }

  public getTimeStringFromSamples(samples: number, sampleRate: number) {
    const miliseconds = Math.round((samples / sampleRate) * 1000);
    const seconds = Math.floor(miliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const miliStr = this.formatNumber(miliseconds % 1000, 3);
    const secondsStr = this.formatNumber(seconds % 60, 2);
    const minutesStr = this.formatNumber(minutes % 60, 2);
    const hoursStr = this.formatNumber(hours, 2);

    return `${hoursStr}:${minutesStr}:${secondsStr}.${miliStr}`;
  }

  public getSamplesFromTimeString(timeString: string, sampleRate: number) {
    if (sampleRate > 0) {
      const regex = new RegExp(/([0-9]+):([0-9]+):([0-9]+).([0-9]+)/g);

      const matches = regex.exec(timeString);

      if (matches !== null && matches.length > -1) {
        const hours = Number(matches[1]);
        const minutes = Number(matches[2]);
        const seconds = Number(matches[3]);
        const miliseconds = Number(matches[4]);

        let totalMiliSeconds = hours * 60 * 60;
        totalMiliSeconds += minutes * 60;
        totalMiliSeconds += seconds;
        totalMiliSeconds *= 1000;
        totalMiliSeconds += miliseconds;
        totalMiliSeconds = Math.round(totalMiliSeconds);

        return Math.round((totalMiliSeconds / 1000) * sampleRate);
      } else {
        console.error(`time string does not match`);
      }
    } else {
      console.error(`invalid sample rate`);
    }
    return -1;
  }

  public formatNumber = (num: number, length: number): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  };
}
