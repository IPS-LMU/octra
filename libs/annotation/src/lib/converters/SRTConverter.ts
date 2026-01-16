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

  public static getSamplesFromTimeString(timeString: string, sampleRate: number) {
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

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    if (!annotation) {
      return {
        error: 'Annotation is undefined or null',
      };
    }

    let result = '';
    let filename = '';

    if (levelnum === undefined || levelnum < 0 || levelnum > annotation.levels.length) {
      return {
        error: `Missing level number`,
      };
    }

    if (levelnum < annotation.levels.length) {
      const level = annotation.levels[levelnum];

      let counter = 1;
      if (level.type === 'SEGMENT') {
        for (const item of level.items as OSegment[]) {
          const transcript = item.getFirstLabelWithoutName('Speaker')?.value ?? '';
          const start = this.getTimeStringFromSamples(item.sampleStart, annotation.sampleRate);
          const end = this.getTimeStringFromSamples(item.sampleStart + item.sampleDur, annotation.sampleRate);

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

  override needsOptionsForImport(file: IFile, audiofile: OAudiofile): any | undefined {
    return {
      $gui_support: true,
      type: 'object',
      properties: {
        speakerIdentifierPattern: {
          title: 'speakerIdentifierPattern',
          toggleable: true,
          type: 'string',
          default: '\\[(SPEAKER_[0-9]+)] *: *',
          description: 'Defines the pattern to recognize the speaker from a given transcript text.',
        },
        sortSpeakerSegments: {
          title: 'sortSpeakerSegments',
          dependsOn: ['speakerIdentifierPattern'],
          type: 'boolean',
          default: false,
          description: 'For each speaker a new level should be created and each speaker segment should be moved to its level.',
        },
        combineSegmentsWithSameSpeakerThreshold: {
          title: 'combineSegmentsWithSameSpeakerThreshold',
          dependsOn: ['speakerIdentifierPattern'],
          toggleable: true,
          type: 'number',
          default: 2000,
          description: 'Defines max. duration an empty segment between two segments may have to be combined together. Set empty to deactivate it.',
        },
      },
    };
  }

  public import(file: IFile, audiofile: OAudiofile, options: SRTConverterImportOptions = new SRTConverterImportOptions()): ImportResult {
    const importer = new SRTImporter(file, audiofile, options, false);
    return importer.import();
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

class SRTImporter {
  constructor(
    private file: IFile,
    private audiofile: OAudiofile,
    private options: SRTConverterImportOptions = new SRTConverterImportOptions(),
    private debugging = false,
  ) {}

  import(): ImportResult {
    const errorsOfValidation = this.validate();
    if (errorsOfValidation) {
      return errorsOfValidation;
    }

    if (!this.audiofile) {
      return {
        error: `The audio file does not exist.`,
      };
    }

    const result = new OAnnotJSON(this.audiofile.name, FileInfo.extractFileName(this.file.name).name, this.audiofile.sampleRate);
    let levels: OSegmentLevel<OSegment>[] = [];
    let parsedLevel: OSegmentLevel<OSegment>;
    let counterID = 1;

    try {
      const parsingResult = this.parse();
      parsedLevel = parsingResult.level;
      counterID = parsingResult.counterID;
    } catch (e: any) {
      return {
        error: `Parsing Error: ${e.message}`,
      };
    }

    if (parsedLevel.items.length > 0) {
      const combinationResult = this.combineSegmentsWithSameSpeakerThreshold(parsedLevel, counterID);
      parsedLevel = combinationResult.level;
      counterID = combinationResult.counterID;

      if (this.options.speakerIdentifierPattern) {
        parsedLevel = this.reduceBoundaries(parsedLevel, this.options.combineSegmentsWithSameSpeakerThreshold !== undefined ? 500 : 25);
      }

      if (this.debugging) {
        console.log('AFTER COMBINATION');
        this.outputReadableLevel(parsedLevel);
      }

      if (this.options.sortSpeakerSegments) {
        for (let i = 0; i < parsedLevel.items.length; i++) {
          const item = parsedLevel.items[i];
          const speaker = item.labels.find((a) => a.name === 'Speaker')?.value;
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
              .map((a) => new OLabel(speaker, item.getFirstLabelWithoutName('Speaker')?.value ?? ''));
            olevel.items.push(item);
            parsedLevel.items.splice(i, 1);
            i--;
          }
        }
      }
      levels.sort((a, b) => {
        if (a.name > b.name) return 1;
        else if (a.name === b.name) return 0;
        return -1;
      });

      if (parsedLevel.items.length > 0) {
        levels.push(parsedLevel);
      }

      levels = levels.map((a, i) => {
        let lastEnd = 0;
        for (let j = 0; j < a.items.length; j++) {
          const item = a.items[j];
          if (item.sampleStart > lastEnd + 1) {
            a.items = [
              ...a.items.slice(0, j),
              new OSegment(counterID++, lastEnd, item.sampleStart - lastEnd, [new OLabel(a.name, '')]),
              ...a.items.slice(j),
            ];
          }

          lastEnd = item.sampleStart + item.sampleDur;

          const nextItem = j < a.items.length - 1 ? a.items[j + 1] : undefined;
          if (!nextItem && item.sampleStart + item.sampleDur < Number(this.audiofile.duration)) {
            a.items.push(
              new OSegment(counterID++, item.sampleStart + item.sampleDur, Number(this.audiofile.duration) - (item.sampleStart + item.sampleDur), [
                new OLabel(a.name, ''),
              ]),
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
        error: 'Input file is not compatible with SRT format.',
      };
    }
  }

  private validate(): ImportResult | undefined {
    if (!this.audiofile?.sampleRate) {
      return {
        error: 'Missing sample rate',
      };
    }

    if (!this.audiofile?.name) {
      return {
        error: 'Missing audiofile name',
      };
    }

    if (!this.audiofile?.duration) {
      return {
        error: 'Missing audiofile duration',
      };
    }

    return undefined;
  }

  private parse(): {
    level: OSegmentLevel<OSegment>;
    counterID: number;
  } {
    const content = this.file.content;
    let counterID = 1;
    let lastEnd = 0;
    const parsedLevel: OSegmentLevel<OSegment> = new OSegmentLevel<OSegment>('OCTRA_1');
    let regexStr = `([0-9]+)[\\n\\r]*([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,[0-9]{3})?) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,[0-9]{3})?)\\r?\\n\\r?`;

    if (this.options.speakerIdentifierPattern) {
      regexStr += `(${this.options.speakerIdentifierPattern ?? ''})`;
    } else {
      regexStr += '()';
    }
    regexStr += '(.*)\\r?\\n\\r?';

    if (content !== '') {
      const regex = new RegExp(regexStr, 'g');

      let matches = regex.exec(content);
      let timeStart = 0;
      let timeEnd = 0;

      while (matches !== null) {
        const olevel: OSegmentLevel<OSegment> = parsedLevel;
        // const index = matches[1];
        const startTime = matches[2];
        const endTime = matches[3];
        const speakerLabel = this.options.speakerIdentifierPattern ? matches[5] : undefined;
        const speakerLabelWrapped = this.options.speakerIdentifierPattern ? matches[4] : undefined;
        let transcript = speakerLabel ? matches[6] : matches[5];

        if (!this.options.sortSpeakerSegments && speakerLabel) {
          transcript = `${speakerLabelWrapped}${transcript ?? ''}`;
        }

        const currentTimeStart = SRTConverter.getSamplesFromTimeString(startTime, this.audiofile.sampleRate);
        const currentTimeEnd = SRTConverter.getSamplesFromTimeString(endTime, this.audiofile.sampleRate);
        let segmentContent = '';
        segmentContent = transcript.replace(/(\n|\s)+$/g, '');

        if (currentTimeStart > -1 && currentTimeEnd > -1) {
          if (currentTimeStart === timeStart && currentTimeEnd === timeEnd) {
            // same time like previous unit => combine texts
            if (this.options.speakerIdentifierPattern) {
              parsedLevel.items[parsedLevel.items.length - 1].replaceFirstLabelWithoutName(
                'Speaker',
                (value) =>
                  `${value} ${(this.options.speakerIdentifierPattern ? segmentContent.replace(new RegExp(this.options.speakerIdentifierPattern), '') : segmentContent).replace(/^\s+/g, '')}`,
              );
            } else {
              parsedLevel.items[parsedLevel.items.length - 1].replaceFirstLabelWithoutName('Speaker', (value) => `${value} ${segmentContent}`);
            }
          } else {
            if (currentTimeStart > currentTimeEnd) {
              // add additional segment
              olevel.items.push(
                new OSegment(counterID++, lastEnd, currentTimeStart - lastEnd, [
                  ...(speakerLabel ? [new OLabel('Speaker', speakerLabel)] : []),
                  new OLabel(olevel.name, ''),
                ]),
              );
            }

            if (currentTimeEnd >= currentTimeStart) {
              olevel.items.push(
                new OSegment(counterID++, currentTimeStart, currentTimeEnd - currentTimeStart, [
                  ...(speakerLabel ? [new OLabel('Speaker', speakerLabel)] : []),
                  new OLabel(olevel.name, segmentContent),
                ]),
              );
            } else {
              console.warn(`Invalid timestamps in line: ${matches[0]}`);
            }
          }
        }
        matches = regex.exec(content);
        timeStart = currentTimeStart;
        timeEnd = currentTimeEnd;
        lastEnd = timeEnd;
      }

      if (counterID === 1) {
        throw new Error("Regex without matches. Please check if the file is empty or speaker regex is invalid.")
      }

      if (this.debugging) {
        console.log('Parsed Transcript:');
        this.outputReadableLevel(parsedLevel);
      }

      return {
        level: parsedLevel,
        counterID,
      };
    }
    throw new Error('Content is empty.');
  }

  private combineSegmentsWithSameSpeakerThreshold(
    parsedLevel: OSegmentLevel<OSegment>,
    counterID: number,
  ): {
    level: OSegmentLevel<OSegment>;
    counterID: number;
  } {
    if (this.options.combineSegmentsWithSameSpeakerThreshold !== undefined) {
      for (let i = 0; i < parsedLevel.items.length; i++) {
        const previousItem = i > 0 ? parsedLevel.items[i - 1] : undefined;
        const previousItemDetails = this.getSegmentDetails(previousItem, this.audiofile.sampleRate);
        parsedLevel.items[i] = this.cleanUpMultipleSpeakersInTranscript(parsedLevel.items[i]);
        const item = parsedLevel.items[i];
        const itemDetails = this.getSegmentDetails(item, this.audiofile.sampleRate)!;
        const nextItem = i < parsedLevel.items.length - 1 ? parsedLevel.items[i + 1] : undefined;
        const nextItemDetails = this.getSegmentDetails(nextItem, this.audiofile.sampleRate);
        const diffToNextItem = nextItemDetails ? nextItemDetails.start - itemDetails.end : 0;

        if (diffToNextItem > 0 && diffToNextItem <= 500) {
          // there is empty space between these to segments
          item.sampleDur = nextItem!.sampleStart - item.sampleStart;
          i--; // re check this item
        } else if (diffToNextItem > 0) {
          // diff to next item is more than 500ms
          parsedLevel.items = [
            ...parsedLevel.items.slice(0, i + 1),
            new OSegment(counterID++, item.sampleStart + item.sampleDur, nextItem!.sampleStart - (item.sampleStart + item.sampleDur), [
              new OLabel('Speaker', itemDetails.speaker!),
              new OLabel(itemDetails.speaker!, ''),
            ]),
            ...parsedLevel.items.slice(i + 1),
          ];
        } else {
          if (previousItemDetails || nextItemDetails) {
            if (!previousItemDetails) {
              // start of the level
              if (itemDetails.speaker === nextItemDetails!.speaker) {
                if (
                  (itemDetails.text === '' && itemDetails.durationInMillis <= this.options.combineSegmentsWithSameSpeakerThreshold) ||
                  itemDetails.text
                ) {
                  // empty item at the start with same speaker as next one in threshold or item with text out of threshold
                  item.sampleDur = nextItem!.sampleStart - item.sampleStart;
                  item.replaceFirstLabelWithoutName('Speaker', (value) => `${value !== '' ? value + ' ' : ''}${nextItemDetails!.text ?? ''}`);
                  parsedLevel.items[i] = this.cleanUpMultipleSpeakersInTranscript(item);
                  parsedLevel.items.splice(i + 1, 1);
                }
              }
            } else if (!nextItemDetails) {
              // end of the level
              if (itemDetails.speaker === previousItemDetails!.speaker) {
                if (
                  (itemDetails.text === '' && itemDetails.durationInMillis <= this.options.combineSegmentsWithSameSpeakerThreshold) ||
                  itemDetails.text !== ''
                ) {
                  // empty item at the end of the level with same speaker as previous one
                  item.sampleStart = previousItem!.sampleStart;
                  item.sampleDur += previousItem!.sampleDur;
                  parsedLevel.items.splice(i - 1, 1);
                  item.replaceFirstLabelWithoutName(
                    'Speaker',
                    (value) => `${previousItemDetails.text !== '' ? previousItemDetails.text + ' ' : ''}${value}`,
                  );
                  parsedLevel.items[i] = this.cleanUpMultipleSpeakersInTranscript(item);
                  i--;
                }
              }
            } else {
              // item between previous and next item
              if (
                itemDetails.text === '' &&
                itemDetails.durationInMillis <= this.options.combineSegmentsWithSameSpeakerThreshold &&
                itemDetails.speaker === previousItemDetails.speaker &&
                itemDetails.speaker === nextItemDetails.speaker
              ) {
                // empty item in the middle of units with same speaker and duration less than threshold OR item with content and same speakers
                previousItem!.sampleDur += item.sampleDur + nextItem!.sampleDur;
                previousItem!.replaceFirstLabelWithoutName(
                  'Speaker',
                  (value) =>
                    `${value !== '' ? value + ' ' : ''}${itemDetails.text !== '' ? itemDetails.text + ' ' : ''}${nextItemDetails.text !== '' ? nextItemDetails.text + ' ' : ''}`,
                );
                parsedLevel.items[i - 1] = this.cleanUpMultipleSpeakersInTranscript(parsedLevel.items[i - 1]);
                parsedLevel.items.splice(i, 2);
                i--;
              } else if (itemDetails.text !== '') {
                if (nextItemDetails.speaker === itemDetails.speaker) {
                  // combine right with current item
                  item.replaceFirstLabelWithoutName('Speaker', (value) => `${value}${nextItemDetails.text !== '' ? ' ' + nextItemDetails.text : ''}`);
                  item.sampleDur = nextItem!.sampleStart + nextItem!.sampleDur - item.sampleStart;
                  parsedLevel.items.splice(i + 1, 1);
                  parsedLevel.items[i] = this.cleanUpMultipleSpeakersInTranscript(item);
                  i--;
                }
              }
            }
          }
        }
      }
    }

    return {
      level: parsedLevel,
      counterID,
    };
  }

  private outputReadableLevel(level: OSegmentLevel<OSegment>) {
    const getDuration = (time: number) => {
      const millis = time % 1000;
      const seconds = Math.floor(time / 1000) % 60;
      const minutes = Math.floor((time / 1000 / 60) % 60);
      const hours = Math.floor(time / 1000 / 60 / 60);

      return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}.${millis < 10 ? `0${millis}` : millis < 100 ? `0${millis}` : millis}`;
    };

    let previousEnd = 0;
    let previousStart = 0;

    for (const item of level.items) {
      const start = Math.round((item.sampleStart * 1000) / this.audiofile.sampleRate);
      const duration = Math.round((item.sampleDur * 1000) / this.audiofile.sampleRate);
      const end = start + duration;

      console.log(
        `${previousStart === start && previousEnd === end ? 'S! ' : ''}${getDuration(start)} - ${getDuration(end)} (DUR ${getDuration(duration)}; DIFF ${getDuration(start - previousEnd)}) [${item.labels.find((a) => a.name === 'Speaker')?.value ?? 'UNKNOWN'}]: ${item.getFirstLabelWithoutName('Speaker')?.value} [ID ${item.id}]`,
      );
      previousEnd = end;
      previousStart = start;
    }
  }

  private getSegmentDetails(segment: OSegment | undefined, sampleRate: number) {
    if (segment) {
      return {
        text: segment.getFirstLabelWithoutName('Speaker')?.value,
        durationInMillis: (segment.sampleDur * 1000) / sampleRate,
        speaker: segment.labels.find((a) => a.name === 'Speaker')?.value,
        start: (segment.sampleStart * 1000) / sampleRate,
        end: ((segment.sampleStart + segment.sampleDur) * 1000) / sampleRate,
      };
    }
    return undefined;
  }

  private cleanUpMultipleSpeakersInTranscript(item: OSegment): OSegment {
    const speakerRegex =
      this.options.speakerIdentifierPattern && this.options.speakerIdentifierPattern !== ''
        ? this.options.speakerIdentifierPattern
        : '\\[SPEAKER_[0-9]+] *: *';
    item.replaceFirstLabelWithoutName('Speaker', (value) => value.replace(new RegExp(`(?!^) *${speakerRegex}`), ' '));
    return item;
  }

  private reduceBoundaries(parsedLevel: OSegmentLevel<OSegment>, threshold: number) {
    // reduce boundaries
    for (let i = 0; i < parsedLevel.items.length; i++) {
      const item = parsedLevel.items[i];
      const nextItem = i < parsedLevel.items.length - 1 ? parsedLevel.items[i + 1] : undefined;
      const nextItemDuration = nextItem ? (nextItem.sampleDur * 1000) / this.audiofile.sampleRate : 0;

      if (nextItem) {
        const diffToNextItem = nextItem.sampleStart - (item.sampleStart + item.sampleDur);
        const diffToNextItemInMilliSeconds = (diffToNextItem * 1000) / this.audiofile.sampleRate;

        if (nextItem.getFirstLabelWithoutName('Speaker')?.value === '' && nextItemDuration <= threshold) {
          // remove next item if it's empty and has duration less 500ms
          parsedLevel.items[i].sampleDur += nextItem.sampleDur;
          parsedLevel.items.splice(i + 1, 1);
        } else if (diffToNextItemInMilliSeconds <= threshold) {
          // there is empty space without a segment => fill with current item
          parsedLevel.items[i].sampleDur = nextItem.sampleStart - item.sampleStart;
        }
      }
    }
    return parsedLevel;
  }
}
