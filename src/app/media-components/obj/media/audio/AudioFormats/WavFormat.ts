import {AudioFormat} from './AudioFormat';

// http://soundfile.sapp.org/doc/WaveFormat/
export class WavFormat extends AudioFormat {
  protected blockAlign: number;

  constructor() {
    super();
    this._extension = '.wav';
  }

  public init(buffer: ArrayBuffer) {
    super.init(buffer);
    this.setBlockAlign(buffer);
  }

  public isValid(buffer: ArrayBuffer): boolean {
    let bufferPart = buffer.slice(0, 4);
    let test1 = String.fromCharCode.apply(null, new Uint8Array(bufferPart));

    bufferPart = buffer.slice(8, 12);
    let test2 = String.fromCharCode.apply(null, new Uint8Array(bufferPart));
    test1 = test1.slice(0, 4);
    test2 = test2.slice(0, 4);
    const byteCheck = new Uint8Array(buffer.slice(20, 21))[0] === 1;
    return (byteCheck && '' + test1 + '' === 'RIFF' && test2 === 'WAVE');
  }

  public splitChannelsToFiles(filename: string, type: string, buffer: ArrayBuffer): File[] {
    let result = [];

    // one block contains one sample of each channel
    // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte

    if (this.isValid(buffer)) {
      const channelData: number[][] = [];
      for (let i = 0; i < this._channels; i++) {
        channelData.push([]);
      }

      let pointer = 0;
      const u8array = new Uint8Array(buffer);
      for (let i = 44; i < u8array.length; i++) {
        try {
          for (let j = 0; j < this._channels; j++) {

            for (let k = 0; k < this.blockAlign / this._channels; k++) {
              channelData[j].push(u8array[i + k]);
            }
            i += this.blockAlign / this._channels;
          }
          i--;
          pointer++;
        } catch (e) {
          console.error(e);
        }
      }

      for (let i = 0; i < channelData.length; i++) {
        const file = this.getFileFromBufferPart(buffer, channelData[i], filename + '_' + (i + 1));
        result.push(file);
      }
    } else {
      console.error('no valid wav format!');
    }

    return result;
  }

  protected setSampleRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(24, 28);
    const bufferView = new Uint32Array(bufferPart);

    this._sampleRate = bufferView[0];
  }

  protected setChannels(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(22, 24);
    const bufferView = new Uint16Array(bufferPart);

    this._channels = bufferView[0];
  }

  protected setBitsPerSample(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(34, 36);
    const bufferView = new Uint16Array(bufferPart);

    this._bitsPerSample = bufferView[0];
  }

  protected setByteRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(28, 32);
    const bufferView = new Uint16Array(bufferPart);

    this._byteRate = bufferView[0];
  }

  protected setBlockAlign(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(32, 34);
    const bufferView = new Uint16Array(bufferPart);

    this.blockAlign = bufferView[0];
  }

  protected getDataChunkSize(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(40, 44);
    const bufferView = new Uint32Array(bufferPart);

    return bufferView[0];
  }

  protected getDataChunk(buffer: ArrayBuffer): ArrayBuffer {
    return buffer.slice(44, buffer.byteLength);
  }

  protected setDuration(buffer: ArrayBuffer) {
    this._duration = this.getDataChunkSize(buffer) / (this._channels * this._bitsPerSample) * 8;
  }

  private getFileFromBufferPart(originalBuffer: ArrayBuffer, data: number[], filename: string): File {
    const samples = (data.length * 2 * 8) / (this._bitsPerSample);

    let buffer = new ArrayBuffer(44 + data.length);
    const dataView = new DataView(buffer);

    /* RIFF identifier */
    this.writeString(dataView, 0, 'RIFF');
    /* RIFF chunk length */
    dataView.setUint32(4, 36 + samples, true);
    /* RIFF type */
    this.writeString(dataView, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(dataView, 12, 'fmt ');
    /* format chunk length */
    dataView.setUint32(16, 16, true);
    /* sample format (raw) */
    dataView.setUint16(20, 1, true);
    /* channel count */
    dataView.setUint16(22, 1, true);
    /* sample rate */
    dataView.setUint32(24, this._sampleRate, true);
    /* byte rate (sample rate * block align) */
    dataView.setUint32(28, this._sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    dataView.setUint16(32, 2, true);
    /* bits per sample */
    dataView.setUint16(34, this._bitsPerSample, true);
    /* data chunk identifier */
    this.writeString(dataView, 36, 'data');
    /* data chunk length */
    dataView.setUint32(40, data.length, true);

    for (let i = 0; i < data.length; i++) {
      dataView.setUint8(44 + i, data[i]);
    }
    return new File([dataView], filename + '.wav', {type: 'audio/wav'});
  }

  private writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
