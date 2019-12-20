import {FileInfo} from '../fileInfo';
import {SampleUnit} from './AudioTime';

export class AudioInfo extends FileInfo {
  private _bitrate = -1;
  private _channels = -1;
  private _duration: SampleUnit;

  get bitrate(): number {
    return this._bitrate;
  }

  private _sampleRate: number;

  get channels(): number {
    return this._channels;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  get duration(): SampleUnit {
    return this._duration;
  }

  set duration(value: SampleUnit) {
    this._duration = value;
  }

  constructor(filename: string, type: string, size: number, sampleRate: number, durationSamples: number, originalSampleRate: number,
              channels: number, bitrate: number) {
    super(filename, type, size);
    this._sampleRate = sampleRate;
    this._duration = new SampleUnit(durationSamples, sampleRate);
    this._channels = channels;
    this._bitrate = bitrate;
  }
}

