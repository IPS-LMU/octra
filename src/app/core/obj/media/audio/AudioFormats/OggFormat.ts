import {AudioFormat} from './AudioFormat';

// specification found on https://wiki.xiph.org/OggVorbis
export class OggFormat extends AudioFormat {
  constructor() {
    super();
    this._extension = '.ogg';
  }

  protected getChannels(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(38, 40);
    const bufferView = new Uint8Array(bufferPart);
    return bufferView[1];
  }

  protected getSampleRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(40, 48);
    const bufferView = new Uint32Array(bufferPart);
    console.log(bufferView);
    console.log('Rate: ' + bufferView[0]);
    return bufferView[0];
  }

  protected getBitRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(48, 52);
    const bufferView = new Uint32Array(bufferPart);
    console.log(bufferView);

    return bufferView[0];
  }
}
