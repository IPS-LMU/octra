import {AudioTime} from './AudioTime';

export class AudioInfo {
  get bitrate(): number {
    return this._bitrate;
  }

  get channels(): number {
    return this._channels;
  }

  set duration(value: AudioTime) {
    this._duration = value;
  }

  get samplerate(): number {
    return this._samplerate;
  }

  get duration(): AudioTime {
    return this._duration;
  }

  private _samplerate: number;
  private _bitrate = -1;
  private _channels = -1;
  private _duration: AudioTime;

  constructor(samplerate: number, duration: number, channels: number, bitrate: number) {
    this._samplerate = samplerate;
    this._duration = new AudioTime(duration, samplerate);
    this._channels = channels;
    this._bitrate = bitrate;
  }
}

