import {AudioTime} from '../../../media-components/obj/media/audio/AudioTime';
import {OSegment} from './AnnotJSON';

export class Segment {
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

  constructor(public time: AudioTime) {

  }

  public static fromObj(obj: OSegment, samplerate: number): Segment {
    if (obj) {
      const seg = new Segment(AudioTime.fromSamples((obj.sampleStart + obj.sampleDur), samplerate));

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
