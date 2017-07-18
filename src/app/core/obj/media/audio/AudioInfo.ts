import {AudioTime} from './AudioTime';
export class AudioInfo {
  set duration(value: AudioTime) {
    this._duration = value;
  }
  get samplerate(): number {
    return this._samplerate;
  }

  get bitrate(): number {
    return this._bitrate;
  }

  get duration(): AudioTime {
    return this._duration;
  }

  private _samplerate: number;
  private _bitrate = -1;
  private _duration: AudioTime;

  constructor(samplerate: number, duration: number, bitrate: number = -1) {
    this._samplerate = samplerate;
    this._duration = new AudioTime(duration, samplerate);
    this._bitrate = bitrate;
  }
}

