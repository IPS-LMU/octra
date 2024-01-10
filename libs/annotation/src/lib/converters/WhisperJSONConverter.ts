import {
  Converter,
  ExportResult,
  IFile,
  ImportResult,
  OctraAnnotationFormatType,
} from './Converter';
import {
  OAnnotJSON,
  OLabel,
  OLevel,
  OSegment,
  OSegmentLevel,
} from '../annotjson';
import { OAudiofile } from '@octra/media';

export class WhisperJSONConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'WhisperJSON';

  public constructor() {
    super();
    this._application = 'Whisper, WhisperX';
    this._extension = '.json';
    this._website.title = 'WhisperJSON';
    this._website.url = 'https://github.com/openai/whisper';
    this._conversion.export = false;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = true;
    this._notice =
      'OCTRA imports only segment related data (timestamps and text). Other attributes wil be ignored.';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    throw new Error('not implemented');
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
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

    const result: ImportResult = {
      error: '',
    };

    result.annotjson = new OAnnotJSON(
      audiofile.name,
      file.name,
      audiofile.sampleRate
    );

    const convertSecondsToSamples = (seconds: number) => {
      return Math.round(seconds * audiofile.sampleRate);
    };

    try {
      const json = new WhisperJSON(JSON.parse(file.content));
      this.validateJSONFile(json);
      const speakers = this.getSpeakers(json);

      if (speakers.length > 0) {
        for (const speaker of speakers) {
          result.annotjson.levels.push(new OSegmentLevel(speaker));
          result.annotjson.levels.push(new OSegmentLevel(`${speaker}_WORD`));
        }
      }

      if (json.segments[0].words && json.segments[0].words.length > 0) {
        const wordLevel = new OSegmentLevel('WORD');
        result.annotjson.levels.push(wordLevel);
      }

      result.annotjson.levels.push(new OSegmentLevel('OCTRA_1'));
      result.annotjson.levels.push(new OSegmentLevel('OCTRA_1_WORD'));

      let id = 1;
      for (const segment of json.segments) {
        if (
          segment.start === undefined ||
          segment.end === undefined ||
          segment.end < segment.start
        ) {
          // skip segment because of invalid time stamps
          continue;
        }

        let speaker = segment.speaker ?? 'OCTRA_1';
        const oSegment = new OSegment(
          id++,
          convertSecondsToSamples(segment.start),
          convertSecondsToSamples(segment.end - segment.start),
          [new OLabel(speaker, segment.text)]
        );

        if (segment.speaker) {
          oSegment.labels.push(new OLabel('Speaker', segment.speaker));
        }

        this.addSegment(
          result.annotjson.levels as OSegmentLevel<OSegment>[],
          speakers,
          segment.speaker,
          oSegment
        );

        // add words
        if (segment.words && segment.words.length) {
          for (const word of segment.words) {
            if (
              word.start === undefined ||
              word.end === undefined ||
              word.end < word.start
            ) {
              // skip segment because of invalid time stamps
              continue;
            }

            speaker =
              speakers.length > 0
                ? `${word.speaker ?? 'OCTRA_1'}_WORD`
                : `WORD`;
            const oWordSegment = new OSegment(
              id++,
              convertSecondsToSamples(word.start),
              convertSecondsToSamples(word.end - word.start),
              [new OLabel(speaker, word.word)]
            );

            if (word.speaker) {
              oWordSegment.labels.push(new OLabel('Speaker', word.speaker));
            }

            this.addSegment(
              result.annotjson.levels as OSegmentLevel<OSegment>[],
              speakers,
              speaker,
              oWordSegment
            );
          }
        }
      }

      // cleanup
      if (
        speakers.length > 0 &&
        result.annotjson.levels[result.annotjson.levels.length - 1].items
          .length === 0
      ) {
        // OCTRA_1 is empty
        result.annotjson.levels.pop();
      } else if (speakers.length === 0) {
        // switch OCTRA_1 and Word tiers
        const word = result.annotjson.levels[0];
        result.annotjson.levels[0] = result.annotjson.levels[1];
        result.annotjson.levels[1] = word;
      }

      // filter empty levels
      result.annotjson.levels = result.annotjson.levels.filter(
        (a) => a.items.length > 0
      );

      // make sure that ids are sequences
      let id2 = 1;
      for (const level of result.annotjson.levels) {
        for (const item of level.items) {
          item.id = id2++;
        }
      }
    } catch (e) {
      console.error(e);

      return {
        error: `Invalid JSON format.`,
      };
    }

    return result;
  }

  private addSegment(
    levels: OLevel<OSegment>[],
    speakers: string[],
    speaker: string | undefined,
    oSegment: OSegment
  ) {
    // find correct speaker level
    let index = levels.findIndex((a) => a.name === speaker);

    // fallback to OCTRA_1 tier
    index = index < 0 ? levels.findIndex((a) => a.name === 'OCTRA_1') : index;
    const currentLevel: OSegmentLevel<OSegment> = levels[
      index
    ] as OSegmentLevel<OSegment>;

    const previousSegment =
      currentLevel.items.length > 0
        ? currentLevel.items[currentLevel.items.length - 1]
        : undefined;

    if (previousSegment) {
      if (
        previousSegment.sampleStart + previousSegment.sampleDur <
        oSegment.sampleStart
      ) {
        // fill gap
        currentLevel.items.push(
          new OSegment(
            1,
            previousSegment.sampleStart + previousSegment.sampleDur,
            oSegment.sampleStart -
              (previousSegment.sampleStart + previousSegment.sampleDur),
            [new OLabel(currentLevel.name, '')]
          )
        );
      } else if (
        previousSegment.sampleStart + previousSegment.sampleDur >
        oSegment.sampleStart
      ) {
        console.error('previous segment greater than current');
        return;
      }
    } else if (oSegment.sampleStart > 0) {
      currentLevel.items.push(
        new OSegment(1, 0, oSegment.sampleStart, [
          new OLabel(currentLevel.name, ''),
        ])
      );
    }

    currentLevel.items.push(oSegment as any);
  }

  private validateJSONFile(json: WhisperJSON) {
    if (!json.segments || !json.language) {
      throw new Error(
        'Invalid format. Missing segments and language attribute.'
      );
    }

    if (!Array.isArray(json.segments)) {
      throw new Error(
        'Invalid format. Attribute segments is not of type array.'
      );
    }
  }

  private getSpeakers(json: WhisperJSON) {
    const result: string[] = [];

    for (const segment of json.segments) {
      if (segment.speaker && !result.includes(segment.speaker)) {
        result.push(segment.speaker);
      }
    }

    return result;
  }
}

export class WhisperJSON {
  text?: string;
  segments!: WhisperJSONSegment[];
  word_segments?: WhisperJSONWord[]; // WhisperX only, same information about words as in segments.
  language!: string;

  constructor(partial?: Partial<WhisperJSON>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class WhisperJSONSegment {
  start!: number;
  end!: number;
  text!: string;
  words!: WhisperJSONWord[];
  id?: number; // Whisper only
  seek?: number; // Whisper only
  tokens?: number[]; // Whisper only
  temperature?: number; // Whisper only
  avg_logprob?: number; // Whisper only
  compression_ratio?: number; // Whisper only
  no_speech_prob?: number; // Whisper only
  speaker?: string; // WhisperX with diarization enabled

  constructor(partial?: Partial<WhisperJSONSegment>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export interface WhisperJSONWord {
  word: string;
  start: number;
  end: number;
  probability?: number; // Whisper only
  score?: number; // WhisperX only
  speaker?: string; // WhisperX only
}
