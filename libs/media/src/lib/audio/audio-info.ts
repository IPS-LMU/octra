import { SampleUnit } from './audio-time';
import { FileInfo } from '@octra/utilities';

export interface IAudioFile {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  url?: string;
  type: string;
}

// TODO add extension and use name without it
export class OAudiofile implements IAudioFile {
  name!: string;
  // need type attribute
  arraybuffer?: ArrayBuffer;
  size!: number;
  duration!: number;
  sampleRate!: number;
  url?: string;
  type!: string;
}

export class AudioInfo extends FileInfo {
  private readonly _bitrate: number = -1;

  get bitrate(): number {
    return this._bitrate;
  }

  private readonly _channels: number = -1;

  get channels(): number {
    return this._channels;
  }

  private _duration: SampleUnit;

  get duration(): SampleUnit {
    return this._duration;
  }

  set duration(value: SampleUnit) {
    this._duration = value;
  }

  private readonly _sampleRate: number;

  get sampleRate(): number {
    return this._sampleRate;
  }

  constructor(
    filename: string,
    type: string,
    size: number,
    sampleRate: number,
    durationSamples: number,
    channels: number,
    bitrate: number
  ) {
    super(filename, type, size);
    this._sampleRate = sampleRate;
    this._duration = new SampleUnit(durationSamples, sampleRate);
    this._channels = channels;
    this._bitrate = bitrate;
  }
}
