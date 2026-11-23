import { OAudiofile } from '@octra/media';
import { last } from '@octra/utilities';
import { FileInfo } from '@octra/web-media';
import { OAnnotJSON, OLabel, OLevel, OSegment, OSegmentLevel } from '../annotjson';
import { Converter, ExportResult, IFile, ImportResult, OctraAnnotationFormatType } from './Converter';
import { OctraApplication, WhisperXApplication } from './SupportedApplications';

export class WhisperJSONConverter extends Converter<any, any> {
  override _name: OctraAnnotationFormatType = 'WhisperJSON';

  public constructor() {
    super();
    this._applications = [
      {
        application: new WhisperXApplication(),
      },
      {
        application: new OctraApplication(),
      },
    ];
    this._extensions = ['.json'];
    this._conversion.export = false;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = true;
    this._notice = 'OCTRA imports only segment related data (timestamps and text). Other attributes wil be ignored.';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    throw new Error('not implemented');
  }

  override needsOptionsForImport(file: IFile, audiofile: OAudiofile): any | undefined {
    return undefined;
  }

  public override needsOptionsForExport(annotation: OAnnotJSON, audiofile: OAudiofile) {
    return undefined;
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

    result.annotjson = new OAnnotJSON(audiofile.name, FileInfo.extractFileName(file.name).name, audiofile.sampleRate);

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
        if (segment.start === undefined || segment.end === undefined || segment.end < segment.start) {
          // skip segment because of invalid time stamps
          continue;
        }

        let speaker = segment.speaker ?? 'OCTRA_1';
        const segmentStart = convertSecondsToSamples(segment.start);
        // convert start and end separately so that contiguous segments stay contiguous after rounding
        const oSegment = new OSegment(id++, segmentStart, convertSecondsToSamples(segment.end) - segmentStart, [
          new OLabel(speaker, segment.text),
        ]);

        if (segment.speaker) {
          oSegment.labels.push(new OLabel('Speaker', segment.speaker));
        }

        this.addSegment(result.annotjson.levels as OSegmentLevel<OSegment>[], speakers, segment.speaker, oSegment);

        // add words
        if (segment.words && segment.words.length) {
          for (const word of segment.words) {
            if (word.start === undefined || word.end === undefined || word.end < word.start) {
              // skip segment because of invalid time stamps
              continue;
            }

            speaker = speakers.length > 0 ? `${word.speaker ?? 'OCTRA_1'}_WORD` : `WORD`;
            const wordStart = convertSecondsToSamples(word.start);
            const oWordSegment = new OSegment(id++, wordStart, convertSecondsToSamples(word.end) - wordStart, [
              new OLabel(speaker, word.word),
            ]);

            if (word.speaker) {
              oWordSegment.labels.push(new OLabel('Speaker', word.speaker));
            }

            this.addSegment(result.annotjson.levels as OSegmentLevel<OSegment>[], speakers, speaker, oWordSegment);
          }
        }
      }

      // cleanup
      if (speakers.length > 0 && result.annotjson.levels[result.annotjson.levels.length - 1].items.length === 0) {
        // OCTRA_1 is empty
        result.annotjson.levels.pop();
      } else if (speakers.length === 0) {
        // switch OCTRA_1 and Word tiers
        const word = result.annotjson.levels[0];
        result.annotjson.levels[0] = result.annotjson.levels[1];
        result.annotjson.levels[1] = word;
      }

      // filter empty levels
      result.annotjson.levels = result.annotjson.levels.filter((a) => a.items.length > 0);

      // make sure that ids are sequences
      let id2 = 1;
      for (const level of result.annotjson.levels) {
        for (const item of level.items) {
          item.id = id2++;
        }
      }
    } catch (e) {
      return {
        error: `Invalid JSON format.`,
      };
    }

    // next free item id across all levels
    let nextID = Math.max(0, ...result.annotjson.levels.map((a) => Math.max(0, ...a.items.map((b) => b.id)))) + 1;

    // check if last boundary fits end of audio file
    for (const level of result.annotjson.levels) {
      if (level.type === 'SEGMENT') {
        const segmentLevel = level as OSegmentLevel<OSegment>;
        const lastSegment = last(segmentLevel.items);

        if (!lastSegment) {
          // fill gap
          segmentLevel.items.push(new OSegment(nextID++, 0, audiofile.duration, [new OLabel(segmentLevel.name, '')]));
        } else {
          if (lastSegment.sampleStart + lastSegment.sampleDur < audiofile.duration) {
            // fill gap
            segmentLevel.items.push(
              new OSegment(
                nextID++,
                lastSegment.sampleStart + lastSegment.sampleDur,
                audiofile.duration - (lastSegment.sampleStart + lastSegment.sampleDur),
                [new OLabel(segmentLevel.name, '')],
              ),
            );
          } else if (lastSegment.sampleStart + lastSegment.sampleDur > audiofile.duration) {
            return {
              error: `Last boundary of level ${level.name} is bigger than audio duration.`,
            };
          }
        }
      }
    }

    return result;
  }

  private addSegment(levels: OLevel<OSegment>[], speakers: string[], speaker: string | undefined, oSegment: OSegment) {
    // find correct speaker level
    let index = levels.findIndex((a) => a.name === speaker);

    // fallback to OCTRA_1 tier
    index = index < 0 ? levels.findIndex((a) => a.name === 'OCTRA_1') : index;
    const currentLevel: OSegmentLevel<OSegment> = levels[index] as OSegmentLevel<OSegment>;

    const previousSegment = currentLevel.items.length > 0 ? currentLevel.items[currentLevel.items.length - 1] : undefined;

    if (previousSegment) {
      const previousEnd = previousSegment.sampleStart + previousSegment.sampleDur;

      if (previousEnd < oSegment.sampleStart) {
        // fill gap
        currentLevel.items.push(new OSegment(1, previousEnd, oSegment.sampleStart - previousEnd, [new OLabel(currentLevel.name, '')]));
      } else if (previousEnd > oSegment.sampleStart) {
        // overlap: let the segment start at the end of the previous one
        oSegment.sampleDur = oSegment.sampleStart + oSegment.sampleDur - previousEnd;
        oSegment.sampleStart = previousEnd;
      }

      if (oSegment.sampleDur <= 0) {
        // nothing left of this segment (zero length or completely overlapped): keep its text in the previous segment
        const lastSegment = currentLevel.items[currentLevel.items.length - 1];
        const text = oSegment.labels[0]?.value?.trim();
        if (text && lastSegment.labels.length > 0) {
          const lastText = lastSegment.labels[0].value.trim();
          lastSegment.labels[0] = new OLabel(lastSegment.labels[0].name, lastText ? `${lastText} ${text}` : text);
        }
        return;
      }
    } else if (oSegment.sampleDur <= 0) {
      // zero length segment at the beginning
      return;
    } else if (oSegment.sampleStart > 0) {
      currentLevel.items.push(new OSegment(1, 0, oSegment.sampleStart, [new OLabel(currentLevel.name, '')]));
    }

    currentLevel.items.push(oSegment as any);
  }

  private validateJSONFile(json: WhisperJSON) {
    if (!json.segments || !json.language) {
      throw new Error('Invalid format. Missing segments and language attribute.');
    }

    if (!Array.isArray(json.segments)) {
      throw new Error('Invalid format. Attribute segments is not of type array.');
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
