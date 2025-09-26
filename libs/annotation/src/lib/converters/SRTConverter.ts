import { OAudiofile } from '@octra/media';
import { FileInfo } from '@octra/web-media';
import { OAnnotJSON, OLabel, OSegment, OSegmentLevel } from '../annotjson';
import { Converter, ExportResult, IFile, ImportResult, OctraAnnotationFormatType } from './Converter';
import { AnyTextEditor, AnyVideoPlayer, OctraApplication, WordApplication } from './SupportedApplications';

export class SRTConverterImportOptions {
  sortSpeakerSegments = false;
  combineSegmentsWithSameSpeakerThreshold?: number;
  speakerIdentifierPattern?: string;

  constructor(partial?: Partial<SRTConverterImportOptions>) {
    if (partial) Object.assign(this, partial);
  }
}
// https://matroska.org/technical/specs/subtitles/srt.html
export class SRTConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'SRT';

  override defaultImportOptions = new SRTConverterImportOptions();

  public constructor() {
    super();
    this._applications = [
      {
        application: new OctraApplication(),
      },
      {
        application: new AnyVideoPlayer(),
      },
      {
        application: new WordApplication(),
      },
      {
        application: new AnyTextEditor(),
      },
    ];
    this._extensions = ['.srt'];
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
  }

  public static getSamplesFromTimeString(
    timeString: string,
    sampleRate: number,
  ) {
    if (sampleRate > 0) {
      const regex = new RegExp(/([0-9]+):([0-9]+):([0-9]+)(?:,([0-9]+))?/g);

      const matches = regex.exec(timeString);

      if (matches && matches.length > -1) {
        const hours = Number(matches[1]);
        const minutes = Number(matches[2]);
        const seconds = Number(matches[3]);
        const miliseconds = matches.length > 4 ? Number(matches[4]) : 0;

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

  public export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile,
    levelnum: number,
  ): ExportResult {
    if (!annotation) {
      return {
        error: 'Annotation is undefined or null',
      };
    }

    let result = '';
    let filename = '';

    if (
      levelnum === undefined ||
      levelnum < 0 ||
      levelnum > annotation.levels.length
    ) {
      return {
        error: `Missing level number`,
      };
    }

    if (levelnum < annotation.levels.length) {
      const level = annotation.levels[levelnum];

      let counter = 1;
      if (level.type === 'SEGMENT') {
        for (const item of level.items as OSegment[]) {
          const transcript =
            item.getFirstLabelWithoutName('Speaker')?.value ?? '';
          const start = this.getTimeStringFromSamples(
            item.sampleStart,
            annotation.sampleRate,
          );
          const end = this.getTimeStringFromSamples(
            item.sampleStart + item.sampleDur,
            annotation.sampleRate,
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
      filename += `${this._extensions[0]}`;
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

  override needsOptionsForImport(
    file: IFile,
    audiofile: OAudiofile,
  ): any | undefined {
    return {
      $gui_support: true,
      type: 'object',
      properties: {
        speakerIdentifierPattern: {
          title: 'speakerIdentifierPattern',
          toggleable: true,
          type: 'string',
          default: '\\[(SPEAKER_[0-9]+)] *: *',
          description:
            'Defines the pattern to recognize the speaker from a given transcript text.',
        },
        sortSpeakerSegments: {
          title: 'sortSpeakerSegments',
          dependsOn: ['speakerIdentifierPattern'],
          type: 'boolean',
          default: false,
          description:
            'For each speaker a new level should be created and each speaker segment should be moved to its level.',
        },
        combineSegmentsWithSameSpeakerThreshold: {
          title: 'combineSegmentsWithSameSpeakerThreshold',
          dependsOn: ['speakerIdentifierPattern'],
          toggleable: true,
          type: 'number',
          default: 2000,
          description:
            'Defines max. duration an empty segment between two segments may have to be combined together. Set empty to deactivate it.',
        },
      },
    };
  }

  public import(
    file: IFile,
    audiofile: OAudiofile,
    options: SRTConverterImportOptions = new SRTConverterImportOptions(),
  ): ImportResult {
    if (!audiofile?.sampleRate) {
      return {
        error: 'Missing sample rate',
      };
    }
    if (!audiofile?.name) {
      return {
        error: 'Missing audiofile name',
      };
    }
    if (!audiofile?.duration) {
      return {
        error: 'Missing audiofile duration',
      };
    }

    if (audiofile) {
      const result = new OAnnotJSON(
        audiofile.name,
        FileInfo.extractFileName(file.name).name,
        audiofile.sampleRate,
      );

      const content = file.content;
      let levels: OSegmentLevel<OSegment>[] = [];

      let counterID = 1;
      let lastEnd = 0;

      let defaultLevel: OSegmentLevel<OSegment> = new OSegmentLevel<OSegment>(
        'OCTRA_1',
      );
      let regexStr = `([0-9]+)[\\n\\r]*([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,[0-9]{3})?) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,[0-9]{3})?)\\r?\\n\\r?`;
      if (options.speakerIdentifierPattern) {
        regexStr += `(?:${options.speakerIdentifierPattern ?? ''})`;
      } else {
        regexStr += '()';
      }
      regexStr += '(.*)\\r?\\n\\r?';

      if (content !== '') {
        const regex = new RegExp(regexStr, 'g');

        let matches = regex.exec(content);
        while (matches !== null) {
          let olevel: OSegmentLevel<OSegment> = defaultLevel;

          if (!options.sortSpeakerSegments && matches[4]) {
            matches[5] = `[${matches[4]}]: ${matches[5] ?? ''}`;
          }

          let timeStart = SRTConverter.getSamplesFromTimeString(
            matches[2],
            audiofile.sampleRate,
          );
          const timeEnd = SRTConverter.getSamplesFromTimeString(
            matches[3],
            audiofile.sampleRate,
          );
          let segmentContent: string = '';
          segmentContent = matches[5].replace(/(\n|\s)+$/g, '');

          if (timeStart > -1 && timeEnd > -1) {
            if (timeStart > lastEnd) {
              // add additional segment
              olevel.items.push(
                new OSegment(counterID++, lastEnd, timeStart - lastEnd, [
                  ...(matches[4] ? [new OLabel('Speaker', matches[4])] : []),
                  new OLabel(olevel.name, ''),
                ]),
              );
            }

            if (timeEnd >= timeStart) {
              olevel.items.push(
                new OSegment(counterID++, timeStart, timeEnd - timeStart, [
                  ...(matches[4] ? [new OLabel('Speaker', matches[4])] : []),
                  new OLabel(olevel.name, segmentContent),
                ]),
              );
            } else {
              return {
                error: `Invalid timestamps in line: ${matches[0]}`,
              };
            }
          }
          matches = regex.exec(content);
          lastEnd = timeEnd;
        }
      }

      if (defaultLevel.items.length > 0) {
        if (options.combineSegmentsWithSameSpeakerThreshold) {
          for (let i = 0; i < defaultLevel.items.length; i++) {
            const previousItem = i > 0 ? defaultLevel.items[i - 1] : undefined;
            const item = defaultLevel.items[i];
            const nextItem =
              i < defaultLevel.items.length - 1
                ? defaultLevel.items[i + 1]
                : undefined;
            const duration = (item.sampleDur * 1000) / audiofile.sampleRate;
            const text = item.getFirstLabelWithoutName('Speaker')?.value;

            if (
              nextItem &&
              previousItem &&
              !text &&
              duration <= options.combineSegmentsWithSameSpeakerThreshold
            ) {
              // current unit is empty, previous and next is set
              // remove empty unit
              defaultLevel.items.splice(i, 1);
              // extend previousItem
              previousItem.sampleDur += item.sampleDur;
              i--; // i = position of previous item

              if (
                nextItem.labels[0].name === 'Speaker' &&
                previousItem.labels[0].name === 'Speaker' &&
                nextItem.labels[0].value === previousItem.labels[0].value
              ) {
                // left and right neighbours have the same speaker
                // remove nextItem
                defaultLevel.items.splice(i + 1, 1);
                // extend previousItem
                previousItem.sampleDur += nextItem.sampleDur;

                const label = previousItem.getFirstLabelWithoutName('Speaker');
                if (label) {
                  const speakerRegex =
                    options.speakerIdentifierPattern &&
                    options.speakerIdentifierPattern !== ''
                      ? options.speakerIdentifierPattern
                      : '\\[SPEAKER_[0-9]+] *: *';
                  label.value +=
                    nextItem.getFirstLabelWithoutName('Speaker')?.value ?? '';
                  label.value = label.value.replace(
                    new RegExp(`(?!^) *${speakerRegex}`),
                    ' ',
                  );
                }
              }
            }
          }
        }

        if (options.sortSpeakerSegments) {
          for (let i = 0; i < defaultLevel.items.length; i++) {
            const item = defaultLevel.items[i];
            const speaker = item.labels.find(
              (a) => a.name === 'Speaker',
            )?.value;
            let olevel: OSegmentLevel<OSegment>;

            if (speaker) {
              const found = levels.find((a) => a.name === speaker);
              if (found) {
                olevel = found;
              } else {
                olevel = new OSegmentLevel<OSegment>(speaker);
                levels.push(olevel);
              }

              item.labels = item.labels
                .filter((a) => a.name !== 'Speaker')
                .map(
                  (a) =>
                    new OLabel(
                      speaker,
                      item.getFirstLabelWithoutName('Speaker')?.value ?? '',
                    ),
                );
              olevel.items.push(item);
              defaultLevel.items.splice(i, 1);
              i--;
            }
          }
        }
        levels.sort((a, b) => {
          if (a.name > b.name) return 1;
          else if (a.name === b.name) return 0;
          return -1;
        });

        if (defaultLevel.items.length > 0) {
          levels.push(defaultLevel);
        }

        levels = levels.map((a, i) => {
          let lastEnd = 0;
          for (let j = 0; j < a.items.length; j++) {
            const item = a.items[j];
            if (item.sampleStart > lastEnd + 1) {
              a.items = [
                ...a.items.slice(0, j),
                new OSegment(counterID++, lastEnd, item.sampleStart - lastEnd, [
                  new OLabel(a.name, ''),
                ]),
                ...a.items.slice(j),
              ];
            }

            lastEnd = item.sampleStart + item.sampleDur;

            const nextItem =
              j < a.items.length - 1 ? a.items[j + 1] : undefined;
            if (
              !nextItem &&
              item.sampleStart + item.sampleDur < Number(audiofile.duration)
            ) {
              a.items.push(
                new OSegment(
                  counterID++,
                  item.sampleStart + item.sampleDur,
                  Number(audiofile.duration) -
                    (item.sampleStart + item.sampleDur),
                  [new OLabel(a.name, '')],
                ),
              );
            }
          }
          return a;
        });

        result.levels = levels;
        return {
          annotjson: result,
          error: '',
        };
      } else {
        return {
          error: 'Input file is not comatible with SRT format.',
        };
      }
    }

    return {
      error: `This SRT file is not compatible with this audio file.`,
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

    return `${hoursStr}:${minutesStr}:${secondsStr},${miliStr}`;
  }

  public formatNumber = (num: number, length: number): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  };
}
