import {AudioInfo} from '../AudioInfo';

export abstract class AudioFormat {
  get extension(): string {
    return this._extension;
  }

  protected _extension: string;

  public getAudioInfo(buffer: ArrayBuffer): AudioInfo {

    const samplerate = this.getSampleRate(buffer);
    const channels = this.getChannels(buffer);
    const bitrate = this.getBitRate(buffer);
    const duration = 1; // overwrite duration after decoding
    const aud = new AudioInfo(samplerate, duration, channels, bitrate);
    return aud;
  }

  protected abstract getChannels(buffer: ArrayBuffer): number;

  protected abstract getSampleRate(buffer: ArrayBuffer): number;

  protected abstract getBitRate(buffer: ArrayBuffer): number;
}
