import {AudioTime} from './AudioTime';
import {FileInfo} from '../../fileInfo';

export class AudioInfo extends FileInfo {
  private _bitrate = -1;
  private _channels = -1;
  private _duration: AudioTime;

  get bitrate(): number {
    return this._bitrate;
  }

  private _samplerate: number;

  get channels(): number {
    return this._channels;
  }

  get samplerate(): number {
    return this._samplerate;
  }

  get duration(): AudioTime {
    return this._duration;
  }

  set duration(value: AudioTime) {
    this._duration = value;
  }

  constructor(filename: string, type: string, size: number, samplerate: number, duration: number, channels: number, bitrate: number) {
    super(filename, type, size);
    this._samplerate = samplerate;
    this._duration = new AudioTime(duration, samplerate);
    this._channels = channels;
    this._bitrate = bitrate;
  }
}

