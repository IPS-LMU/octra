import {AudioInfo} from '../AudioInfo';

export abstract class AudioFormat {
  protected _extension: string;

  get extension(): string {
    return this._extension;
  }

  protected _filename: string;

  get filename(): string {
    return this._filename;
  }

  protected _sampleRate: number;

  get sampleRate(): number {
    return this._sampleRate;
  }

  protected _channels: number;

  get channels(): number {
    return this._channels;
  }

  protected _byteRate: number;

  get byteRate(): number {
    return this._byteRate;
  }

  protected _bitsPerSample: number;

  get bitsPerSample(): number {
    return this._bitsPerSample;
  }

  protected _duration: number;

  get duration(): number {
    return this._duration;
  }

  protected constructor() {
  }

  public init(filename, buffer: ArrayBuffer) {
    this._filename = filename.substr(0, filename.lastIndexOf('.'));
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
