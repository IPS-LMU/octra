import {AudioFormat} from './AudioFormat';
import {AudioInfo} from '../AudioInfo';

export class WavFormat extends AudioFormat {
  constructor() {
    super();
    this._extension = '.wav';
  }


  public getAudioInfo(buffer: ArrayBuffer): AudioInfo {

    const samplerate = this.getSampleRate(buffer);
    const channels = this.getChannels(buffer);
    const bitrate = this.getBitRate(buffer);
    const duration = buffer.byteLength / (bitrate / 8);
    return new AudioInfo(samplerate, duration, channels, bitrate);
  }

  protected getChannels(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(22, 24);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  protected getSampleRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(24, 28);
    const bufferView = new Uint16Array(bufferPart);

    console.log('sampleRate: ' + bufferView[0]);
    return bufferView[0];
  }

  protected getBitRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(28, 32);
    const bufferView = new Uint16Array(bufferPart);

    console.log('byteRate: ' + bufferView[0]);
    return bufferView[0];
  }
}
