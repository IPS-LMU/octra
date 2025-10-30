import { SampleUnit } from '@octra/media';
import { FileInfo } from '../data-info';

export class AudioInfo<F extends object = any> extends FileInfo<F> {
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

  get audioBufferInfo(): { samples: number; sampleRate: number } | undefined {
    return this._audioBufferInfo;
  }

  set audioBufferInfo(
    value: { samples: number; sampleRate: number } | undefined,
  ) {
    this._audioBufferInfo = value;
  }

  protected _audioBufferInfo?: {
    samples: number;
    sampleRate: number;
  };

  constructor(
    filename: string,
    type: string,
    size: number,
    sampleRate: number,
    durationSamples: number,
    channels: number,
    bitrate: number,
    audioBufferInfo?: {
      samples: number;
      sampleRate: number;
    },
  ) {
    super(filename, normalizeMimeType(type), size);
    this._sampleRate = sampleRate;
    this._duration = new SampleUnit(durationSamples, sampleRate);
    this._channels = channels;
    this._bitrate = bitrate;
    this._audioBufferInfo = audioBufferInfo;
  }

  override clone(): AudioInfo<F> {
    const result = new AudioInfo<F>(
      this.fullname,
      this._type,
      this._size,
      this._sampleRate,
      this._duration.samples,
      this._channels,
      this._bitrate,
      this._audioBufferInfo,
    );
    result._file = this._file;
    result._attributes = this._attributes ? { ...this._attributes } as F : undefined;
    result._hash = this._hash;
    result._url = this._url;
    result._online = this._online;

    return result;
  }
}

/**
 * calculates the channel data factor by a given sample rate. The channel data factor is needed for reducing channel data to draw audio signal
 * @param sampleRate
 */
export function calculateChannelDataFactor(sampleRate: number) {
  let factor: number;
  if (sampleRate === 48000) {
    factor = 3;
    // sampleRate = 16000
  } else if (sampleRate === 44100) {
    factor = 2;
  } else {
    // sampleRate = 22050
    factor = 1;
  }
  return factor;
}

export function normalizeMimeType(type: string) {
  switch (type) {
    case 'video/ogg':
      return 'audio/ogg';
  }

  return type;
}
