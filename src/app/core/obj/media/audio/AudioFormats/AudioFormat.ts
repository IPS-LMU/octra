import {AudioInfo} from '../AudioInfo';

export abstract class AudioFormat {
  get extension(): string {
    return this._extension;
  }

  protected _extension: string;

  public getAudioInfo(buffer: ArrayBuffer): AudioInfo {

    if (this.isValid(buffer)) {
      const samplerate = this.getSampleRate(buffer);
      const channels = this.getChannels(buffer);
      const bitrate = this.getBitRate(buffer);
      const duration = 1; // overwrite duration after decoding
      return new AudioInfo(samplerate, duration, channels, bitrate);
    } else {
      throw new Error(`Audio file is not a valid ${this._extension} file.`);
    }
  }

  protected abstract getChannels(buffer: ArrayBuffer): number;

  protected abstract getSampleRate(buffer: ArrayBuffer): number;

  protected abstract getBitRate(buffer: ArrayBuffer): number;

  protected abstract isValid(buffer: ArrayBuffer): boolean;
}
