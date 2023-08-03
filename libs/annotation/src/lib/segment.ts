import { OLabel, OSegment } from './annotjson';
import { ASRQueueItemType } from './asr';
import { SampleUnit } from '@octra/media';

export class Segment {
  get time(): SampleUnit {
    return this._time;
  }

  set time(value: SampleUnit) {
    this._time = value;
  }

  get speakerLabel(): string {
    return this._speakerLabel;
  }

  set speakerLabel(value: string) {
    this._speakerLabel = value;
  }

  private static counter = 1;
  private readonly _id: number;

  constructor(
    time: SampleUnit,
    speakerLabel: string,
    transcript = '',
    id?: number
  ) {
    this._time = time;
    this._speakerLabel = speakerLabel;
    this._transcript = transcript;

    if (id === undefined || (id === undefined && id > 0)) {
      this._id = Segment.counter++;
    } else {
      this._id = id;
      Segment.counter = Math.max(id + 1, Segment.counter);
    }
  }

  private _speakerLabel = 'NOLABEL';
  private _time!: SampleUnit;

  /**
   * this id is for internal use only!
   */
  get id(): number {
    return this._id;
  }

  private _transcript = '';

  get transcript(): string {
    return this._transcript;
  }

  set transcript(value: string) {
    if (value !== this._transcript) {
      this.changed = true;
    }
    this._transcript = value;
  }

  private _changed = false;

  get changed(): boolean {
    return this._changed;
  }

  set changed(value: boolean) {
    this._changed = value;
  }

  private _isBlockedBy?: ASRQueueItemType;

  get isBlockedBy(): ASRQueueItemType | undefined {
    return this._isBlockedBy;
  }

  set isBlockedBy(value: ASRQueueItemType | undefined) {
    this._isBlockedBy = value;
  }

  private _progressInfo = {
    statusLabel: 'ASR',
    progress: 0,
  };

  get progressInfo(): { progress: number; statusLabel: string } {
    return this._progressInfo;
  }

  set progressInfo(value: { progress: number; statusLabel: string }) {
    this._progressInfo = value;
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

      return new Segment(
        new SampleUnit(oSegment.sampleStart + oSegment.sampleDur, sampleRate),
        speakerLabel,
        transcript,
        oSegment.id
      );
    }

    return undefined;
  }

  public clone(): Segment {
    return new Segment(this.time.clone(), this.speakerLabel, this.transcript);
  }
}
