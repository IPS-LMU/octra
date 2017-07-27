import {AudioFormat} from './AudioFormat';

export class WavFormat extends AudioFormat {
  constructor() {
    super();
    this._extension = '.wav';
  }

  protected getChannels(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(22, 24);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  protected getSampleRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(24, 28);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  protected getBitRate(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(28, 32);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  protected isValid(buffer: ArrayBuffer): boolean {
    let bufferPart = buffer.slice(0, 4);
    let test1 = String.fromCharCode.apply(null, new Uint8Array(bufferPart));

    bufferPart = buffer.slice(8, 12);
    let test2 = String.fromCharCode.apply(null, new Uint8Array(bufferPart));
    test1 = test1.slice(0, 4);
    test2 = test2.slice(0, 4);
    return ('' + test1 + '' === 'RIFF' && test2 === 'WAVE');
  }
}
