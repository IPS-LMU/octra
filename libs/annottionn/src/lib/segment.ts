import { OLabel, OSegment } from './annotjson';
import { ASRQueueItemType } from './asr';

export class Segment {
  private static counter = 1;

  speakerLabel = 'NOLABEL';
  time!: any;
  changed = false;
  isBlockedBy?: ASRQueueItemType;
  progressInfo?: {
    statusLabel: string;
    progress: number;
  };

  private _value = '';
  private readonly _id: number;

  constructor(time: any, speakerLabel: string, value = '', id?: number) {
    this.time = time;
    this.speakerLabel = speakerLabel;
    this._value = value;

    if (id === undefined || id === null || id < 1) {
      this._id = Segment.counter++;
    } else {
      this._id = id;
      Segment.counter = Math.max(id + 1, Segment.counter);
    }
  }

  /**
   * this id is for internal use only!
   */
  get id(): number {
    return this._id;
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    if (value !== this._value) {
      this.changed = true;
    }
    this._value = value;
  }

  /**
   * converts an object to a Segment. The conversion goes from original -> browser samples.
   */
  public static fromObj(
    levelName: string,
    oSegment: OSegment,
    sampleRate: number
  ): Segment | undefined {
    if (oSegment !== undefined) {
      let speakerLabel = '';

      let transcriptLabel: OLabel | undefined;
      if (oSegment.labels !== undefined) {
        if (oSegment.labels.length > 1) {
          const foundLabel = oSegment.labels.find(
            (a) => a.name.toLowerCase() === 'speaker'
          );
          speakerLabel = foundLabel !== undefined ? foundLabel.value : '';
          transcriptLabel = oSegment.labels.find((a) => a.name === levelName);
        } else if (oSegment.labels.length === 1) {
          transcriptLabel = oSegment.labels[0];
        }
      }

      const transcript =
        transcriptLabel !== undefined ? transcriptLabel.value : '';

      return new Segment({}, speakerLabel, transcript, oSegment.id);
    }

    return undefined;
  }

  public clone(): Segment {
    return new Segment(this.time.clone(), this.speakerLabel, this.value);
  }
}
