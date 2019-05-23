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

  public splitChannelsToFiles(filename: string, type: string, buffer: ArrayBuffer): File[] {
    const result = [];

    // one block contains one sample of each channelData
    // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte

    if (this.isValid(buffer)) {
      const channelData: Uint8Array[] = [];
      const u8array = new Uint8Array(buffer);

      for (let i = 0; i < this._channels; i++) {
        channelData.push(new Uint8Array((u8array.length - 44) / this._channels));
      }

      let pointer = 0;
      for (let i = 44; i < u8array.length; i++) {
        try {
          for (let j = 0; j < this._channels; j++) {
            const subArray = u8array.slice(i, i + (this.blockAlign / this._channels));
            channelData[j].set(subArray, pointer);
            i += this.blockAlign / this._channels;
          }
          i--;
          pointer += this.blockAlign / this._channels;
        } catch (e) {
          console.error(e);
        }
      }

      for (let i = 0; i < channelData.length; i++) {
        const file = this.getFileFromBufferPart(channelData[i], filename + '_' + (i + 1));
        result.push(file);
      }
    } else {
      console.error('no valid wav format!');
    }

    return result;
  }

  public startAudioCutting(type: string, namingConvention: string, buffer: ArrayBuffer, segments: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }[], pointer = 0): void {
    this.status = 'running';
    this.cutAudioFileSequentially(type, namingConvention, buffer, segments, pointer);
  }

  private cutAudioFileSequentially(type: string, namingConvention: string, buffer: ArrayBuffer, segments: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }[], pointer = 0): void {
    if (pointer > -1 && pointer < segments.length) {
      const segment = segments[pointer];

      if (segment.sampleStart !== segment.sampleDur) {
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
            if (this.status === 'running') {
              setTimeout(() => this.cutAudioFileSequentially(type, namingConvention, buffer, segments, ++pointer), 200);
            } else {
              this.status = 'stopped';
            }
          } else {
            // stop
            this.onaudiocut.complete();
          }
        }).catch((error) => {
          this.onaudiocut.error(error);
        });
      } else {
        console.error(`could not cut segment because start and end samples are equal`);
        setTimeout(() => this.cutAudioFileSequentially(type, namingConvention, buffer, segments, ++pointer), 200);
      }
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
      // one block contains one sample of each channelData
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const start = segment.sampleStart * this._channels * 2;
      const duration = segment.sampleDur * this._channels * 2;
      // start and duration are the position in bytes after the header

      const filename = this.getNewFileName(namingConvention, this.filename, segment);
      if (this.isValid(buffer)) {
        const u8array = new Uint8Array(buffer);

        this.calculateData(start, duration, u8array).then((data: Uint8Array) => {
          resolve(this.getFileFromBufferPart(data, filename));
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  public stopAudioSplitting() {
    if (this.status === 'running') {
      this.status = 'stopRequested';
    }
  }

  public getAudioCutAsArrayBuffer(buffer: ArrayBuffer, segment: SegmentToDecode): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const sampleStart = segment.sampleStart.value;
      const sampleDur = segment.sampleDur.value;
      // one block contains one sample of each channelData
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const start = sampleStart * this._channels * 2;
      const duration = sampleDur * this._channels * 2;
      // start and duration are the position in bytes after the header

      if (this.isValid(buffer)) {
        const u8array = new Uint8Array(buffer);

        this.calculateData(start, duration, u8array).then((data: Uint8Array) => {
          resolve(this.getFileDataView(data));
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  private calculateData(start: number, duration: number, u8array: Uint8Array): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const arrayLength = duration;
      const result: Uint8Array = new Uint8Array(arrayLength);

      const startPos = 44 + start;
      const endPos = startPos + duration;

      result.set(u8array.slice(startPos, endPos));
      resolve(result);
    });
  }

  getNewFileName(namingConvention: string, fileName: string, segment: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }) {
    let leadingNull = '';
    const maxDecimals = 4;
    const decimals = (segment.number + 1).toString().length;


    for (let i = 0; i < maxDecimals - decimals; i++) {
      leadingNull += '0';
    }

    return (namingConvention.replace(/<([^<>]+)>/g, (g0, g1) => {
      switch (g1) {
        case('name'):
          return fileName;
        case('sequNumber'):
          return `${leadingNull}${segment.number + 1}`;
        case('sampleStart'):
          return segment.sampleStart.toString();
        case('sampleDur'):
          return segment.sampleDur.toString();
        case('secondsStart'):
          return (Math.round(segment.sampleStart / this.sampleRate * 1000) / 1000).toString();
        case('secondsDur'):
          return (Math.round(segment.sampleStart / this.sampleRate * 1000) / 1000).toString();
      }
      return g1;
    }) + this._extension);
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

  private getFileFromBufferPart(data: Uint8Array, filename: string): File {
    return new File([this.getFileDataView(data)], filename, {type: 'audio/wav'});
  }

  public getFileDataView(data: Uint8Array): ArrayBuffer {
    const samples = (data.length * 2 * 8) / (this._bitsPerSample);

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
    /* channelData count */
    dataView.setUint16(22, this._channels, true);
    /* sample rate */
    dataView.setUint32(24, this._sampleRate, true);
    /* byte rate (sample rate * block align) */
    dataView.setUint32(28, this._sampleRate * 2, true);
    /* block align (channelData count * bytes per sample) */
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

  public calculateFileSize(samples: number): number {
    return 44 + samples * this.blockAlign;
  }

  private writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
