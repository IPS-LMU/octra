import {AudioFormat} from './audio-format';

// specification found on https://wiki.xiph.org/OggVorbis
export class OggFormat extends AudioFormat {
  constructor() {
    super();
    this._extension = '.ogg';
  }

  public isValid(buffer: ArrayBuffer): boolean {
    const bufferPart = buffer.slice(29, 37);
    let test = String.fromCharCode.apply(undefined, new Uint8Array(bufferPart) as any);
    test = test.slice(0, 6);
    return ('' + test + '' === 'vorbis');
  }

  protected setSampleRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(40, 42);
    const bufferView = new Uint16Array(bufferPart);
    this._sampleRate = bufferView[0];
  }

  protected setChannels(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(38, 40);
    const bufferView = new Uint8Array(bufferPart);
    this._channels = bufferView[1];
  }

  protected setBitsPerSample(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(48, 52);
    const bufferView = new Uint32Array(bufferPart);

    this._bitsPerSample = bufferView[0];
  }

  protected setByteRate() {
    this._byteRate = 0;
  }

  protected setDuration() {

  }
}

