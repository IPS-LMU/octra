import {AudioTime} from './AudioTime';

export class AudioSelection {
  get start(): AudioTime {
    return this._start;
  }

  set start(value: AudioTime) {
    this._start = value;
  }

  get end(): AudioTime {
    return this._end;
  }

  set end(value: AudioTime) {
    this._end = value;
  }

  get length(): number {
    // TODO is this implementation correct?
    if (this._start && this._end && this._start.samples > this._end.samples) {
      return Math.abs(this._start.samples - this._end.samples);
    } else {
      return Math.abs(this._end.samples - this._start.samples);
    }
  }

  get duration(): AudioTime {
    const result = this.start.clone();
    result.samples = this.length;
    return result;
  }

  private _start: AudioTime;
  private _end: AudioTime;

  public clone() {
    return new AudioSelection(
      this._start, this._end
    );
  }

  constructor(start: AudioTime,
              end: AudioTime) {
    this.start = start.clone();
    this.end = end.clone();
  }

  public checkSelection() {
    if (this._start && this._end && this._start.samples > this._end.samples) {
      const tmp = this._start.samples;
      this._start.samples = this._end.samples;
      this._end.samples = tmp;
    }
  }
}
