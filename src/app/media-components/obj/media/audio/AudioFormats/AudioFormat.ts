import {AudioInfo} from '../AudioInfo';

export abstract class AudioFormat {
  get bitsPerSample(): number {
    return this._bitsPerSample;
  }

  get byteRate(): number {
    return this._byteRate;
  }

  get filename(): string {
    return this._filename;
  }

  get channels(): number {
    return this._channels;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  get extension(): string {
    return this._extension;
  }

  get duration(): number {
    return this._duration;
  }

  protected _extension: string;
  protected _filename: string;
  protected _sampleRate: number;
  protected _channels: number;
  protected _byteRate: number;
  protected _bitsPerSample: number;
  protected _duration: number;

  constructor() {
  }

  public init(buffer: ArrayBuffer) {
    this.setSampleRate(buffer);
    this.setChannels(buffer);
    this.setBitsPerSample(buffer);
    this.setByteRate(buffer);
    this.setDuration(buffer);
  }

  public getAudioInfo(filename: string, type: string, buffer: ArrayBuffer): AudioInfo {
    if (this.isValid(buffer)) {
      return new AudioInfo(filename, type, buffer.byteLength, this.sampleRate, this._duration, this._channels, this._bitsPerSample);
    } else {
      throw new Error(`Audio file is not a valid ${this._extension} file.`);
    }
  }

  public abstract isValid(buffer: ArrayBuffer);

  protected abstract setSampleRate(buffer: ArrayBuffer);

  protected abstract setChannels(buffer: ArrayBuffer);

  protected abstract setBitsPerSample(buffer: ArrayBuffer);

  /**
   * TODO is this needed?
   * @param buffer
   */
  protected abstract setByteRate(buffer: ArrayBuffer);

  protected abstract setDuration(buffer: ArrayBuffer);
}
