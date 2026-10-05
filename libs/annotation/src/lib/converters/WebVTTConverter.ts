import { OAudiofile } from '@octra/media';
import { FormGeneratorJSONSchema } from '@octra/utilities';
import { FileInfo } from '@octra/web-media';
import { OAnnotJSON, OLabel, OSegment, OSegmentLevel } from '../annotjson';
import { Converter, ExportResult, IFile, ImportResult, OctraAnnotationFormatType } from './Converter';
import { AnyTextEditor, AnyVideoPlayer, OctraApplication, WordApplication } from './SupportedApplications';

export class WebVTTConverterImportOptions {
  sortSpeakerSegments = false;
  combineSegmentsWithSameSpeakerThreshold?: number;
  speakerIdentifierPattern?: string;

  constructor(partial?: Partial<WebVTTConverterImportOptions>) {
    if (partial) Object.assign(this, partial);
  }
}

export class WebVTTConverterExportOptions {
  exportLevels?: string[];
  transformPattern?: string;

  constructor(partial?: Partial<WebVTTConverterExportOptions>) {
    if (partial) Object.assign(this, partial);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API
export class WebVTTConverter extends Converter<WebVTTConverterImportOptions, WebVTTConverterExportOptions> {
  override _name: OctraAnnotationFormatType = 'WebVTT';
  override defaultImportOptions = new WebVTTConverterImportOptions();

  private readonly EXPORT_EXCLUDED_LEVEL_NAMES = ['bundle', 'ort', 'wor', 'tro', 'mau'];

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
    this._extensions = ['.vtt'];
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = true;
    this._notice =
      'OCTRA reads timestamps and the transcripts. STYLE, NOTE, REGION blocks and cue settings will be ignored. Multi-line cue text will be merged into a single line.';
  }

  static readonly TIMESTAMP_PATTERN = '(?:[0-9]+:)?[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}';

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, options?: WebVTTConverterExportOptions): ExportResult {
    if (!annotation) {
      return {
        error: 'Annotation is undefined or null',
      };
    }

    let result = 'WEBVTT\n\n';
    let filename = '';

    const transcripts: {
      speaker: string;
      sampleStart: number;
      sampleDur: number;
      value: string;
    }[] = [];

    const transform = (speaker: string, transcript: string) => {
      return options?.transformPattern
        ? options.transformPattern.replace(`{{LEVEL_NAME}}`, speaker).replace('{{TRANSCRIPT}}', transcript)
        : transcript;
    };

    // prepare all transcripts
    for (let i = 0; i < annotation.levels.length; i++) {
      const level = annotation.levels[i];

      if ((options?.exportLevels ?? []).includes(level.name)) {
        if (level.type === 'SEGMENT' && !this.EXPORT_EXCLUDED_LEVEL_NAMES.includes(level.name.toLowerCase())) {
          for (const item of level.items as OSegment[]) {
            const speaker = item.labels.find((a) => a.name.toLowerCase() === 'speaker')?.value || level.name;
            const value = (item.getFirstLabelWithoutName('Speaker')?.value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            if (value !== '') {
              transcripts.push({
                sampleStart: item.sampleStart,
                sampleDur: item.sampleDur,
                value,
                speaker,
              });
            }
          }
        }
      }
    }

    transcripts.sort((a, b) => a.sampleStart - b.sampleStart);

    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      const start = this.getTimeStringFromSamples(transcript.sampleStart, audiofile.sampleRate);
      const end = this.getTimeStringFromSamples(transcript.sampleStart + transcript.sampleDur, audiofile.sampleRate);

      result += `${i + 1}\n`;
      result += `${start} --> ${end}\n`;
      result += transform(transcript.speaker, transcript.value) + '\n\n';
    }

    filename = `${annotation.name}${this._extensions[0]}`;

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain',
      },
    };
  }

  override needsOptionsForImport(file: IFile, audiofile: OAudiofile): FormGeneratorJSONSchema {
    return {
      $gui_support: true,
      type: 'object',
      description: 'The following set of options is related to speakers.',
      properties: {
        speakerIdentifierPattern: {
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

  override needsOptionsForExport(annotation: OAnnotJSON, audiofile: OAudiofile): FormGeneratorJSONSchema {
    const levelNames = annotation.levels.map((a) => a.name);

    return {
      $gui_support: true,
      type: 'object',
      required: ['exportLevels', 'transformPattern'],
      properties: {
        exportLevels: {
          title: 'exportLevels',
          toggleable: false,
          type: 'array',
          items: {
            type: 'string',
            enum: levelNames,
          },
          description: 'Defines an array of level indices for export.',
          default: levelNames,
        },
        transformPattern: {
          title: 'transformTranscriptionUnit',
          type: 'string',
          default: levelNames.length === 1 ? '{{TRANSCRIPT}}' : '[{{LEVEL_NAME}}]: {{TRANSCRIPT}}',
          examples: ['e.g. [{{LEVEL_NAME}}]: {{TRANSCRIPT}} => [SPEAKER_00]: Some transcript...'],
          dependsOn: ['exportLevels'],
          pattern: '\\{\\{TRANSCRIPT\\}\\}',
          description: 'For each speaker a new level should be created and each speaker segment should be moved to its level.',
        },
      },
    };
  }

  public import(file: IFile, audiofile: OAudiofile, options: WebVTTConverterImportOptions = new WebVTTConverterImportOptions()): ImportResult {
    const importer = new WebVTTImporter(file, audiofile, options, false);
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

    return `${hoursStr}:${minutesStr}:${secondsStr}.${miliStr}`;
  }

  public static getSamplesFromTimeString(timeString: string, sampleRate: number) {
    if (sampleRate > 0) {
      // WebVTT timestamps are either "mm:ss.mmm" or "hh:mm:ss.mmm" (hours may be omitted)
      const regex = new RegExp(`^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9])\\.([0-9]{3})$`);

      const matches = regex.exec(timeString.trim());

      if (matches !== null) {
        const hours = matches[1] !== undefined ? Number(matches[1]) : 0;
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

class WebVTTImporter {
  constructor(
    private file: IFile,
    private audiofile: OAudiofile,
    private options: WebVTTConverterImportOptions = new WebVTTConverterImportOptions(),
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

    // check header: file must start with "WEBVTT" (optionally preceded by a BOM),
    // optionally followed by whitespace and free text on the same line
    const normalizedContent = this.file.content.replace(new RegExp('^\\uFEFF'), '');
    const headerCheck = /^WEBVTT(?:[ \t][^\n\r]*)?(?:\r\n|\r|\n|$)/;

    if (!headerCheck.test(normalizedContent)) {
      return {
        error: 'This WebVTT file is bad formatted (header)',
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
        parsedLevel = this.reduceBoundaries(parsedLevel, this.options.combineSegmentsWithSameSpeakerThreshold ?? 25);
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

      this.cleanup(levels, counterID);
      result.levels = levels;
      return {
        annotjson: result,
        error: '',
      };
    } else {
      return {
        error: 'Input file is not compatible with WebVTT format.',
      };
    }
  }

  private cleanup(levels: OSegmentLevel<OSegment>[], counterID: number) {
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const lastIndex = level.items.length - 1;

      if (lastIndex > -1) {
        const lastSegment = level.items[lastIndex];
        const outerBoundary = lastSegment.sampleStart + lastSegment.sampleDur;

        if (outerBoundary !== this.audiofile.duration) {
          const diff = this.audiofile.duration - outerBoundary;
          if (diff < 0) {
            // move outer boundary to audio duration
            lastSegment.sampleDur = this.audiofile.duration - lastSegment.sampleStart;
          } else {
            if (diff > (250 / 1000) * this.audiofile.sampleRate) {
              // diff greater than 250ms => fill with empty segment,
              const speakerLabel = lastSegment.labels.find((a) => a.name === 'Speaker');
              level.items.push(new OSegment(counterID++, outerBoundary, diff, [new OLabel(level.name, ''), ...(speakerLabel ? [speakerLabel] : [])]));
            } else {
              // move outer boundary to audio duration
              lastSegment.sampleDur = this.audiofile.duration - lastSegment.sampleStart;
            }
          }
        }
      }
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

  /**
   * Splits the file content into WebVTT blocks (cue blocks, NOTE/STYLE/REGION blocks, the header)
   * and returns only the valid cue blocks, decoded and with cue settings/tags stripped.
   */
  private parseCueBlocks(content: string): {
    startTime: string;
    endTime: string;
    text: string;
  }[] {
    const normalized = content.replace(new RegExp('^\\uFEFF'), '').replace(/\r\n?/g, '\n');
    const blocks = normalized.split(/\n{2,}/);
    const timingRegex = new RegExp(`^\\s*(${WebVTTConverter.TIMESTAMP_PATTERN})\\s*-->\\s*(${WebVTTConverter.TIMESTAMP_PATTERN})`);
    const cues: { startTime: string; endTime: string; text: string }[] = [];

    for (const rawBlock of blocks) {
      // a valid block never contains blank lines, so this also strips split artifacts
      const blockLines = rawBlock.split('\n').filter((line) => line.trim() !== '');
      if (blockLines.length === 0) {
        continue;
      }

      const firstLine = blockLines[0].trim();
      if (
        firstLine === 'NOTE' ||
        firstLine.startsWith('NOTE ') ||
        firstLine.startsWith('NOTE\t') ||
        firstLine === 'STYLE' ||
        firstLine === 'REGION' ||
        firstLine.startsWith('REGION ') ||
        firstLine.startsWith('REGION\t') ||
        firstLine.startsWith('WEBVTT')
      ) {
        // NOTE, STYLE and REGION blocks as well as the header are ignored
        continue;
      }

      // a cue block optionally starts with a cue identifier line before the timing line
      const timingLineIndex = timingRegex.test(blockLines[0]) ? 0 : 1;
      const timingLine = blockLines[timingLineIndex];
      const timingMatch = timingLine ? timingRegex.exec(timingLine) : null;

      if (!timingMatch) {
        // not a cue block that OCTRA understands => ignore
        continue;
      }

      const payloadLines = blockLines.slice(timingLineIndex + 1);
      const text = this.decodeCueText(payloadLines.join(' ').trim());

      cues.push({
        startTime: timingMatch[1],
        endTime: timingMatch[2],
        text,
      });
    }

    return cues;
  }

  /**
   * Removes WebVTT cue-internal tags (e.g. <b>, <i>, <c>, <v Speaker>, <00:00:01.000>) and
   * decodes the small set of character entities WebVTT allows in cue text.
   */
  private decodeCueText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lrm;/g, '')
      .replace(/&rlm;/g, '')
      .replace(/&amp;/g, '&');
  }

  private parse(): {
    level: OSegmentLevel<OSegment>;
    counterID: number;
  } {
    const content = this.file.content;

    if (content === '') {
      throw new Error('Content is empty.');
    }

    let counterID = 1;
    let lastEnd = 0;
    const parsedLevel: OSegmentLevel<OSegment> = new OSegmentLevel<OSegment>('OCTRA_1');
    const speakerPatternRegex = this.options.speakerIdentifierPattern ? new RegExp(`^(?:${this.options.speakerIdentifierPattern})`) : undefined;

    const cues = this.parseCueBlocks(content);
    let timeStart = 0;
    let timeEnd = 0;

    for (const cue of cues) {
      let speakerLabel: string | undefined;
      let speakerLabelWrapped: string | undefined;
      let transcript = cue.text;

      if (speakerPatternRegex) {
        const speakerMatch = speakerPatternRegex.exec(cue.text);
        if (speakerMatch) {
          speakerLabelWrapped = speakerMatch[0];
          speakerLabel = speakerMatch[1] ?? speakerMatch[0];
          transcript = cue.text.slice(speakerMatch[0].length);
        }
      }

      if (!this.options.sortSpeakerSegments && speakerLabel) {
        transcript = `${speakerLabelWrapped}${transcript ?? ''}`;
      }

      const currentTimeStart = WebVTTConverter.getSamplesFromTimeString(cue.startTime, this.audiofile.sampleRate);
      const currentTimeEnd = WebVTTConverter.getSamplesFromTimeString(cue.endTime, this.audiofile.sampleRate);
      const segmentContent = transcript.replace(/\s+$/g, '');

      if (currentTimeStart > -1 && currentTimeEnd > -1) {
        if (currentTimeStart === timeStart && currentTimeEnd === timeEnd && parsedLevel.items.length > 0) {
          // same time like previous unit => combine texts
          if (speakerPatternRegex) {
            parsedLevel.items[parsedLevel.items.length - 1].replaceFirstLabelWithoutName(
              'Speaker',
              (value) => `${value} ${segmentContent.replace(speakerPatternRegex, '').replace(/^\s+/g, '')}`,
            );
          } else {
            parsedLevel.items[parsedLevel.items.length - 1].replaceFirstLabelWithoutName('Speaker', (value) => `${value} ${segmentContent}`);
          }
        } else {
          if (currentTimeStart > lastEnd) {
            // there is a gap since the previous cue => fill it with an empty segment of the previous speaker (like SRT)
            const previousItem = parsedLevel.items[parsedLevel.items.length - 1];
            const gapSpeakerLabel = previousItem ? previousItem.labels.find((a) => a.name === 'Speaker')?.value : speakerLabel;
            parsedLevel.items.push(
              new OSegment(counterID++, lastEnd, currentTimeStart - lastEnd, [
                ...(gapSpeakerLabel ? [new OLabel('Speaker', gapSpeakerLabel)] : []),
                new OLabel(parsedLevel.name, ''),
              ]),
            );
          }

          if (currentTimeEnd >= currentTimeStart) {
            parsedLevel.items.push(
              new OSegment(counterID++, currentTimeStart, currentTimeEnd - currentTimeStart, [
                ...(speakerLabel ? [new OLabel('Speaker', speakerLabel)] : []),
                new OLabel(parsedLevel.name, segmentContent),
              ]),
            );
          } else {
            console.warn(`Invalid timestamps in cue: ${cue.startTime} --> ${cue.endTime}`);
          }
        }
      }

      timeStart = currentTimeStart;
      timeEnd = currentTimeEnd;
      lastEnd = Math.max(lastEnd, timeEnd);
    }

    if (counterID === 1) {
      throw new Error('No valid cues found. Please check if the file is empty or the speaker pattern is invalid.');
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

  private combineSegmentsWithSameSpeakerThreshold(
    parsedLevel: OSegmentLevel<OSegment>,
    counterID: number,
  ): {
    level: OSegmentLevel<OSegment>;
    counterID: number;
  } {
    const threshold = this.options.combineSegmentsWithSameSpeakerThreshold;

    if (threshold !== undefined) {
      const items = parsedLevel.items;
      const thresholdInSamples = (threshold * this.audiofile.sampleRate) / 1000;
      const getSpeaker = (segment: OSegment) => segment.labels.find((a) => a.name === 'Speaker')?.value;
      const getEnd = (segment: OSegment) => segment.sampleStart + segment.sampleDur;

      // 1. fill gaps between segments: short gaps are added to the previous segment, longer gaps become empty segments
      for (let i = 0; i < items.length; i++) {
        items[i] = this.cleanUpMultipleSpeakersInTranscript(items[i]);
        const item = items[i];
        const nextItem = items[i + 1];

        if (nextItem) {
          const gap = nextItem.sampleStart - getEnd(item);

          if (gap > 0 && gap <= thresholdInSamples) {
            item.sampleDur = nextItem.sampleStart - item.sampleStart;
          } else if (gap > 0) {
            const speaker = getSpeaker(item);
            items.splice(
              i + 1,
              0,
              new OSegment(counterID++, getEnd(item), gap, [
                ...(speaker !== undefined ? [new OLabel('Speaker', speaker)] : []),
                new OLabel(parsedLevel.name, ''),
              ]),
            );
            i++;
          }
        }
      }

      // 2. remove empty segments with duration <= threshold by merging them into a neighbour with the same speaker
      for (let i = 0; i < items.length; ) {
        const item = items[i];

        if (this.isEmptySegment(item) && item.sampleDur <= thresholdInSamples) {
          const previousItem = items[i - 1];
          const nextItem = items[i + 1];

          if (previousItem && getSpeaker(previousItem) === getSpeaker(item)) {
            previousItem.sampleDur = getEnd(item) - previousItem.sampleStart;
            items.splice(i, 1);
            continue;
          } else if (nextItem && getSpeaker(nextItem) === getSpeaker(item)) {
            nextItem.sampleDur = getEnd(nextItem) - item.sampleStart;
            nextItem.sampleStart = item.sampleStart;
            items.splice(i, 1);
            continue;
          }
        }
        i++;
      }

      // 3. combine neighbouring segments with the same speaker. Remaining empty segments are longer than the threshold
      // and must not be merged with segments containing text.
      for (let i = 0; i < items.length - 1; ) {
        const item = items[i];
        const nextItem = items[i + 1];
        const itemIsEmpty = this.isEmptySegment(item);

        if (getSpeaker(item) === getSpeaker(nextItem) && itemIsEmpty === this.isEmptySegment(nextItem)) {
          item.sampleDur = getEnd(nextItem) - item.sampleStart;

          if (!itemIsEmpty) {
            const nextText = nextItem.getFirstLabelWithoutName('Speaker')?.value ?? '';
            item.replaceFirstLabelWithoutName('Speaker', (value) => `${value} ${nextText}`);
            items[i] = this.cleanUpMultipleSpeakersInTranscript(item);
          }
          items.splice(i + 1, 1);
        } else {
          i++;
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

  private isEmptySegment(segment: OSegment): boolean {
    const text = segment.getFirstLabelWithoutName('Speaker')?.value ?? '';
    return text.replace(new RegExp(this.getSpeakerRegex(), 'g'), '').trim() === '';
  }

  private getSpeakerRegex(): string {
    return this.options.speakerIdentifierPattern && this.options.speakerIdentifierPattern !== ''
      ? this.options.speakerIdentifierPattern
      : '\\[SPEAKER_[0-9]+] *: *';
  }

  private cleanUpMultipleSpeakersInTranscript(item: OSegment): OSegment {
    item.replaceFirstLabelWithoutName('Speaker', (value) => this.removeAllButFirst(value, new RegExp(this.getSpeakerRegex(), 'g')));
    return item;
  }

  private removeAllButFirst(str: string, pattern: RegExp) {
    let seen = false;
    return str.replace(pattern, (match) => {
      if (!seen) {
        seen = true;
        return match;
      }
      return '';
    });
  }

  private reduceBoundaries(parsedLevel: OSegmentLevel<OSegment>, threshold: number) {
    const getSpeaker = (segment: OSegment) => segment.labels.find((a) => a.name === 'Speaker')?.value;

    // reduce boundaries
    for (let i = 0; i < parsedLevel.items.length; i++) {
      const item = parsedLevel.items[i];
      const nextItem = i < parsedLevel.items.length - 1 ? parsedLevel.items[i + 1] : undefined;
      const nextItemDuration = nextItem ? (nextItem.sampleDur * 1000) / this.audiofile.sampleRate : 0;

      if (nextItem) {
        const diffToNextItem = nextItem.sampleStart - (item.sampleStart + item.sampleDur);
        const diffToNextItemInMilliSeconds = (diffToNextItem * 1000) / this.audiofile.sampleRate;

        if (this.isEmptySegment(nextItem) && nextItemDuration <= threshold && getSpeaker(nextItem) === getSpeaker(item)) {
          // remove next item if it's empty, has the same speaker and a duration less than threshold
          parsedLevel.items[i].sampleDur = nextItem.sampleStart + nextItem.sampleDur - item.sampleStart;
          parsedLevel.items.splice(i + 1, 1);
          i--; // re check this item
        } else if (diffToNextItemInMilliSeconds <= threshold) {
          // there is empty space without a segment => fill with current item
          parsedLevel.items[i].sampleDur = nextItem.sampleStart - item.sampleStart;
        }
      }
    }
    return parsedLevel;
  }
}
