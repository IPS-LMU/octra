import {BrowserAudioTime, OriginalAudioTime} from './AudioTime';

export class AudioSelection {
  get length(): number {
    // TODO is this implementation correct?
    if (this._start && this._end && this._start.browserSample.value > this._end.browserSample.value) {
      return Math.abs(this._start.browserSample.value - this._end.browserSample.value);
    } else {
      return Math.abs(this._end.browserSample.value - this._start.browserSample.value);
    }
  }

  get duration(): BrowserAudioTime | OriginalAudioTime {
    const result = this.start.clone();
    result.browserSample.value = this.length;
    return result;
  }

  private _start: BrowserAudioTime | OriginalAudioTime;

  get start(): BrowserAudioTime | OriginalAudioTime {
    return this._start;
  }

  set start(value: BrowserAudioTime | OriginalAudioTime) {
    this._start = value;
  }

  private _end: BrowserAudioTime | OriginalAudioTime;

  get end(): BrowserAudioTime | OriginalAudioTime {
    return this._end;
  }

  set end(value: BrowserAudioTime | OriginalAudioTime) {
    this._end = value;
  }

  constructor(start: BrowserAudioTime | OriginalAudioTime,
              end: BrowserAudioTime | OriginalAudioTime) {
    this.start = start.clone();
    this.end = end.clone();
  }

  public clone() {
    return new AudioSelection(
      this._start, this._end
    );
  }

  public checkSelection() {
    if (this._start && this._end && this._start.browserSample.value > this._end.browserSample.value) {
      const tmp = this._start.browserSample.value;
      this._start.browserSample.value = this._end.browserSample.value;
      this._end.browserSample.value = tmp;
    }
  }
}
