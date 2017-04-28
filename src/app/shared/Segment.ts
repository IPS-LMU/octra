import {AudioTime} from './AudioTime';

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

  public static fromAny(obj: any): Segment {
    if (obj) {
      const seg = new Segment(AudioTime.fromAny(obj.time));

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

  public toAny(): any {
    return {
      transcript: this._transcript,
      time: this.time.toAny()
    };
  }
}
