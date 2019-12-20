import {AudioFormat} from './AudioFormat';
import {Subject} from 'rxjs';
import {SegmentToDecode} from '../AudioDecoder';

// http://soundfile.sapp.org/doc/WaveFormat/
export class WavFormat extends AudioFormat {
  protected _blockAlign: number;
  private status: 'running' | 'stopRequested' | 'stopped' = 'stopped';

  public onaudiocut: Subject<{
    finishedSegments: number,
    file: File
  }> = new Subject<{
    finishedSegments: number,
    file: File
  }>();

  public get blockAlign() {
    return this._blockAlign;
  }

  constructor() {
    super();
    this._extension = '.wav';
  }

  public init(filename: string, buffer: ArrayBuffer) {
    super.init(filename, buffer);
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

  public cutAudioFileSequentially(type: string, namingConvention: string, buffer: ArrayBuffer, segments: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }[], pointer = 0): void {
    if (pointer > -1 && pointer < segments.length) {
      const segment = segments[pointer];

      this.cutAudioFile(type, namingConvention, buffer, segment).then((file) => {
        this.onaudiocut.next({
          finishedSegments: pointer + 1,
          file
        });

        if (pointer < segments.length - 1) {
          // continue
          // @ts-ignore
          // const freeSpace = window.performance.memory.totalJSHeapSize - window.performance.memory.usedJSHeapSize;
          // console.log(`${freeSpace / 1024 / 1024} MB left.`);
          setTimeout(() => this.cutAudioFileSequentially(type, namingConvention, buffer, segments, ++pointer), 200);
        } else {
          // stop
          this.onaudiocut.complete();
        }
      }).catch((error) => {
        this.onaudiocut.error(error);
      });
    } else {
      this.onaudiocut.error(new Error('pointer is invalid!'));
    }
  }

  public cutAudioFile(type: string, namingConvention: string, buffer: ArrayBuffer, segment: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const start = segment.sampleStart * this._channels * 2;
      const duration = segment.sampleDur * this._channels * 2;
      // start and duration are the position in bytes after the header

      const filename = this.getNewFileName(namingConvention, this.filename, segment);

      if (this.isValid(buffer)) {
        const u16array = new Uint16Array(buffer);

        console.log(`cut audio file`);
        this.calculateData(start, duration, u16array).then((data: Uint16Array) => {
          resolve(this.getFileFromBufferPart(data, filename));
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  public getAudioCutAsArrayBuffer(buffer: ArrayBuffer, segment: SegmentToDecode): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const sampleStart = segment.sampleStart.samples;
      const sampleDur = segment.sampleDur.samples;
      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const start = sampleStart * this._channels;
      const duration = sampleDur * this._channels;
      // start and duration are the position in bytes after the header

      if (this.isValid(buffer)) {
        const u16array = new Uint16Array(buffer);

        this.calculateData(start, duration, u16array).then((data: Uint16Array) => {
          resolve(this.getFileDataView(data));
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  public getChannelDataFromRaw(u16array: Uint16Array, sampleStart: number, sampleDuration: number, selectedChannel: number = 0): Promise<Float32Array> {
    return new Promise<Float32Array>((resolve, reject) => {
      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const start = sampleStart * this._channels;
      const duration = sampleDuration * this._channels;
      // start and duration are the position in bytes after the header

      this.calculateData(start, duration, u16array).then((data: Uint16Array) => {
        const result = new Float32Array(duration);
        for (let i = 0; i < duration; i++) {
          let entry = data[i];

          if (isNaN(entry)) {
            console.error(`entry is NaN at ${i}`);
            break;
          }
          if (entry > 32768) {
            entry = (entry % 32768) - 32768;
          }
          result[i] = entry / 32768;
          if (result[i] > 1) {
            console.error(`entry greater than 1: ${result[i]} at ${i}`);
            break;
          }
        }
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public getFileDataView(data: Uint16Array): ArrayBuffer {
    const samples = (data.length * 8) / (this._bitsPerSample);

    const buffer = new ArrayBuffer(44 + data.length);
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
    dataView.setUint16(22, this._channels, true);
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
    return dataView.buffer;
  }

  getNewFileName(namingConvention: string, fileName: string, segment: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }) {
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    const extension = fileName.substring(fileName.lastIndexOf('.'));

    let leadingNull = '';
    const maxDecimals = 4;
    const decimals = (segment.number + 1).toString().length;


    for (let i = 0; i < maxDecimals - decimals; i++) {
      leadingNull += '0';
    }

    return namingConvention.replace(/<([^<>]+)>/g, (g0, g1) => {
      switch (g1) {
        case('name'):
          return name;
        case('sequNumber'):
          return `${leadingNull}${segment.number + 1}`;
        case('sampleStart'):
          return segment.sampleStart;
        case('sampleDur'):
          return segment.sampleDur;
        case('secondsStart'):
          return Math.round(segment.sampleStart / this.sampleRate * 1000) / 1000;
        case('secondsDur'):
          return Math.round(segment.sampleStart / this.sampleRate * 1000) / 1000;
      }
      return g1;
    }) + extension;
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

    this._blockAlign = bufferView[0];
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

  public calculateData(start: number, duration: number, u16array: Uint16Array): Promise<Uint16Array> {
    return new Promise<Uint16Array>((resolve, reject) => {
      const result: Uint16Array = new Uint16Array(duration);

      // TODO check this!
      const startPos = 22 + Math.round(start);
      const endPos = startPos + Math.round(duration);

      result.set(u16array.slice(startPos, endPos));
      resolve(result);
    });
  }

  private getFileFromBufferPart(data: Uint16Array, filename: string): File {
    return new File([this.getFileDataView(data)], filename + '.wav', {type: 'audio/wav'});
  }

  public calculateFileSize(samples: number): number {
    return 44 + samples * this.blockAlign;
  }

  private writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  public stopAudioSplitting() {
    if (this.status === 'running') {
      this.status = 'stopRequested';
    }
  }
}
