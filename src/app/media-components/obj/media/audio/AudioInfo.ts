import {FileInfo} from '../../fileInfo';
import {BrowserAudioTime, BrowserSample} from './AudioTime';

export class AudioInfo extends FileInfo {
  private _bitrate = -1;
  private _channels = -1;
  private _duration: BrowserAudioTime;

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

  get duration(): BrowserAudioTime {
    return this._duration;
  }

  set duration(value: BrowserAudioTime) {
    this._duration = value;
  }

  constructor(filename: string, type: string, size: number, browserSampleRate: number, durationSamples: number,
              channels: number, bitrate: number, originalSampleRate: number = null) {
    super(filename, type, size);
    this._samplerate = browserSampleRate;
    const samplerate = (originalSampleRate !== null) ? originalSampleRate : browserSampleRate;
    this._duration = new BrowserAudioTime(new BrowserSample(durationSamples, browserSampleRate), samplerate);
    this._channels = channels;
    this._bitrate = bitrate;
  }
}

