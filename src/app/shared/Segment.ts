import {AudioTime} from './AudioTime';
import {OSegment} from '../types/annotation';

export class Segment {
  get changed(): boolean {
    return this._changed;
  }

  set changed(value: boolean) {
    this._changed = value;
  }

  private _transcript = '';
  private _changed = false;

  get transcript(): string {
    return this._transcript;
  }

  set transcript(value: string) {
    if (value !== this._transcript) {
      this.changed = true;
    }
    this._transcript = value;
  }

  public static fromObj(obj: OSegment, samplerate: number): Segment {
    if (obj) {
      const seg = new Segment(AudioTime.fromSamples((obj.start + obj.length), samplerate));

      if (obj.transcript) {
        seg._transcript = obj.transcript;
      }

      return seg;
    }

    return null;
  }

  constructor(public time: AudioTime) {

  }

  public clone(): Segment {
    const seg = new Segment(this.time.clone());
    seg.transcript = this.transcript;
    return seg;
  }
}
