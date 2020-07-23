import {SampleUnit} from '../audio';
import {OSegment} from './annotjson';
import {ASRQueueItemType} from './asr';

export class Segment {
  get progressInfo(): { progress: number; statusLabel: string } {
    return this._progressInfo;
  }

  set progressInfo(value: { progress: number; statusLabel: string }) {
    this._progressInfo = value;
  }

  private static counter = 1;

  private readonly _id: number;

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

  private _isBlockedBy: ASRQueueItemType;

  get isBlockedBy(): ASRQueueItemType {
    return this._isBlockedBy;
  }

  set isBlockedBy(value: ASRQueueItemType) {
    this._isBlockedBy = value;
  }

  private _progressInfo = {
    statusLabel: 'ASR',
    progress: 0
  };

  constructor(public time: SampleUnit, transcript = '') {
    this._transcript = transcript;
    this._id = Segment.counter++;
  }

  /**
   * converts an object to a Segment. The conversion goes from original -> browser samples.
   */
  public static fromObj(obj: OSegment, sampleRate: number): Segment {
    if (obj) {
      const seg = new Segment(new SampleUnit(obj.sampleStart + obj.sampleDur, sampleRate));

      if (obj.labels[0].value) {
        seg._transcript = obj.labels[0].value;
      }

      return seg;
    }

    return null;
  }

  public clone(): Segment {
    const seg = new Segment(this.time.clone());
    seg.transcript = this.transcript;
    return seg;
  }
}
