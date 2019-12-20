import {OSegment} from './AnnotJSON';
import {SampleUnit} from '../audio';

export class Segment {
  private static counter = 1;

  constructor(public time: SampleUnit, transcript = '') {
    this._transcript = transcript;
    this._id = Segment.counter++;
  }

  private _id: number;

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

  /**
   * this id is for internal use only!
   */
  get id(): number {
    return this._id;
  }

  private _changed = false;

  get changed(): boolean {
    return this._changed;
  }

  set changed(value: boolean) {
    this._changed = value;
  }

  private _isBlockedBy: 'asr' | 'none' = 'none';

  get isBlockedBy(): 'asr' | 'none' {
    return this._isBlockedBy;
  }

  set isBlockedBy(value: 'asr' | 'none') {
    this._isBlockedBy = value;
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
