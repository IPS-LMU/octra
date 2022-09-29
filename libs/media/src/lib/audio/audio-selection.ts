import {SampleUnit} from './audio-time';

export class AudioSelection {
  get length(): number {
    // TODO is this implementation correct?
    if (this._start && this._end && this._start.samples > this._end.samples) {
      return Math.abs(this._start.samples - this._end.samples);
    } else {
      return Math.abs(this._end!.samples - this._start!.samples);
    }
  }

  get duration(): SampleUnit {
    return new SampleUnit(this.length, this.start!.sampleRate);
  }

  private _start!: SampleUnit;

  get start(): SampleUnit {
    return this._start;
  }

  set start(value: SampleUnit) {
    this._start = value;
  }

  private _end!: SampleUnit;

  get end(): SampleUnit {
    return this._end;
  }

  set end(value: SampleUnit) {
    this._end = value;
  }

  constructor(start: SampleUnit,
              end: SampleUnit) {
    this.start = start.clone();
    this.end = end?.clone();
  }

  public clone() {
    return new AudioSelection(
      this._start!, this._end
    );
  }

  public checkSelection() {
    if (this._start && this._end && this._start.samples > this._end.samples) {
      const tmp = this._start.clone();
      this._start = this._end.clone();
      this._end = tmp;
    }
  }
}
