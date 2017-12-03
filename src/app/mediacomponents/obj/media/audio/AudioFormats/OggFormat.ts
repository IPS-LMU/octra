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
    const bufferPart = buffer.slice(40, 42);
    const bufferView = new Uint16Array(bufferPart);
    return bufferView[0];
  }

  protected getBitRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(48, 52);
    const bufferView = new Uint32Array(bufferPart);

    return bufferView[0];
  }

  protected isValid(buffer: ArrayBuffer): boolean {
    const bufferPart = buffer.slice(29, 37);
    let test = String.fromCharCode.apply(null, new Uint8Array(bufferPart));
    test = test.slice(0, 6);
    return ('' + test + '' === 'vorbis');
  }
}
