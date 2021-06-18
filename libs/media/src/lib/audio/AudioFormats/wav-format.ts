import {Subject} from 'rxjs';
import {AudioFormat} from './audio-format';
import {isUnset} from '@octra/utilities';
import {NumeratedSegment} from '../../types';

// http://soundfile.sapp.org/doc/WaveFormat/
export class WavFormat extends AudioFormat {
  public onaudiocut: Subject<{
    finishedSegments: number,
    file: File
  }> = new Subject<{
    finishedSegments: number,
    file: File
  }>();
  protected dataStart = -1;
  private status: 'running' | 'stopRequested' | 'stopped' = 'stopped';

  protected _blockAlign: number;

  public get blockAlign() {
    return this._blockAlign;
  }

  constructor() {
    super();
    this._extension = '.wav';
  }

  private static writeString(view, offset, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  public init(filename: string, buffer: ArrayBuffer) {
    this.setDataStart(buffer);
    super.init(filename, buffer);
    this.setBlockAlign(buffer);
  }

  /***
   * checks if it is a valid wave file
   * @param buffer the audio file's array buffer
   */
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

  /***
   * cut the audio file sequentially
   * @param namingConvention the naming convention for file renaming
   * @param buffer the array buffer of the audio file
   * @param segments the list of segments for cut
   * @param pointer the current segment to be cut
   */
  public cutAudioFileSequentially(namingConvention: string, buffer: ArrayBuffer, segments: NumeratedSegment[], pointer = 0): void {
    if (pointer > -1 && pointer < segments.length) {
      const segment = segments[pointer];

      this.cutAudioFile(namingConvention, buffer, segment).then((file) => {
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
            setTimeout(() => this.cutAudioFileSequentially(namingConvention, buffer, segments, ++pointer), 200);
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
      this.onaudiocut.error(new Error('pointer is invalid!'));
    }
  }

  public cutAudioFile(namingConvention: string, buffer: ArrayBuffer, segment: NumeratedSegment): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const filename = this.getNewFileName(namingConvention, this._filename, segment);

      if (this.isValid(buffer)) {
        const u8array = new Uint8Array(buffer);

        this.extractDataFromArray(segment.sampleStart, segment.sampleDur, u8array).then((data: Uint8Array | Uint16Array) => {
          resolve(this.getFileFromBufferPart(data, this._channels, filename));
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  public getFileDataView(data: Uint8Array | Uint16Array, channels: number): ArrayBuffer {
    // creates a mono data view
    const blockAlign = channels * this._bitsPerSample / 8;
    const subChunk2Size = data.length * blockAlign;

    const buffer = new ArrayBuffer(44 + data.byteLength);
    const dataView = new DataView(buffer);

    /* RIFF identifier */
    WavFormat.writeString(dataView, 0, 'RIFF');
    /* RIFF chunk length */
    dataView.setUint32(4, 36 + subChunk2Size, true);
    /* RIFF type */
    WavFormat.writeString(dataView, 8, 'WAVE');
    /* format chunk identifier */
    WavFormat.writeString(dataView, 12, 'fmt ');
    /* format chunk length */
    dataView.setUint32(16, 16, true);
    /* sample format (raw) */
    dataView.setUint16(20, 1, true);
    /* channel count */
    dataView.setUint16(22, channels, true);
    /* sample rate */
    dataView.setUint32(24, this._sampleRate, true);
    /* byte rate (sample rate * block align) */
    dataView.setUint32(28, this._sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    dataView.setUint16(32, blockAlign, true);
    /* bits per sample */
    dataView.setUint16(34, this._bitsPerSample, true);
    /* data chunk identifier */
    WavFormat.writeString(dataView, 36, 'data');
    /* data chunk length */
    dataView.setUint32(40, subChunk2Size, true);

    for (let i = 0; i < data.length; i++) {
      if (data instanceof Uint8Array) {
        dataView.setUint8(44 + i, data[i]);
      } else {
        // little endian must be set!
        dataView.setUint16(44 + (i * 2), data[i], true);
      }
    }
    return dataView.buffer;
  }

  getNewFileName(namingConvention: string, fileName: string, segment: NumeratedSegment) {
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
    });
  }

  /***
   * cuts the data part of selected samples from an Uint8Array
   * @param sampleStart the start of the extraction
   * @param sampleDur the duration of the extraction
   * @param u8Array the array to be read
   * @param selectedChannel the selected channel
   */
  public extractDataFromArray(sampleStart: number, sampleDur: number, u8Array: Uint8Array, selectedChannel?: number)
    : Promise<Uint8Array | Uint16Array> {
    return new Promise<Uint8Array | Uint16Array>((resolve, reject) => {
      let convertedData: Uint8Array | Uint16Array;
      let result: Uint8Array | Uint16Array;

      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const channels = (selectedChannel !== undefined) ? 1 : this._channels;
      const blockAlign = (this._bitsPerSample / 8) * channels;

      let start = sampleStart * blockAlign;
      let dataChunkLength = sampleDur * blockAlign;
      let startPos: number;

      if (this._bitsPerSample === 16) {
        // divide by 2 because it's 16 and not 8 bits per sample
        dataChunkLength = Math.round(dataChunkLength / 2);
        result = new Uint16Array(dataChunkLength);
        convertedData = new Uint16Array(u8Array.buffer, u8Array.byteOffset, u8Array.byteLength / 2);
        start = Math.round(start / 2);
        startPos = 22 + Math.round(start);
      } else if (this._bitsPerSample === 8) {
        result = new Uint8Array(dataChunkLength);
        convertedData = u8Array;
        startPos = 44 + Math.round(start);
      }

      if (result !== undefined) {
        // start and duration are the position in bytes after the header
        const endPos = startPos + Math.round(dataChunkLength);

        if (selectedChannel === undefined || this._channels === 1) {
          result.set(convertedData.slice(startPos, endPos));
          resolve(result);
        } else {
          // get data from selected channel only

          const channelData: (Uint8Array | Uint16Array)[] = [];
          let dataStart = 44;
          for (let i = 0; i < this._channels; i++) {
            if (this._bitsPerSample === 16) {
              dataStart = 22;
              channelData.push(new Uint16Array(Math.round(dataStart + dataChunkLength)));
            } else {
              channelData.push(new Uint8Array(Math.round(dataStart + dataChunkLength)));
            }
          }

          let pointer = 0;
          for (let i = startPos; i < endPos * this._channels; i++) {
            try {
              for (let j = 0; j < this._channels; j++) {
                channelData[j][dataStart + pointer] = convertedData[dataStart + i + j];
              }
              i++;
              pointer++;
            } catch (e) {
              reject(e);
            }
          }

          result = channelData[selectedChannel];
          resolve(result);
        }
      } else {
        reject('unsupported bitsPerSample');
      }
    });
  }

  /*
  public calculateFileSize(samples: number): number {
    return 44 + samples * this.blockAlign;
  }*/

  public stopAudioSplitting() {
    if (this.status === 'running') {
      this.status = 'stopRequested';
    }
  }

  protected setSampleRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(24, 28);
    const bufferView = new Uint32Array(bufferPart);

    this._sampleRate = bufferView[0];
  }

  protected setChannels(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(22, 24);
    const bufferView = new Uint8Array(bufferPart);

    this._channels = bufferView[0];
  }

  protected setBitsPerSample(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(34, 36);
    const bufferView = new Uint8Array(bufferPart);

    this._bitsPerSample = bufferView[0];
  }

  protected setByteRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(28, 32);
    const bufferView = new Uint8Array(bufferPart);

    this._byteRate = bufferView[0];
  }

  protected setBlockAlign(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(32, 34);
    const bufferView = new Uint8Array(bufferPart);

    this._blockAlign = bufferView[0];
  }

  protected getDataChunkSize(buffer: ArrayBuffer): number {
    const bufferPart = buffer.slice(this.dataStart, this.dataStart + 4);
    const bufferView = new Uint32Array(bufferPart);

    return bufferView[0];
  }

  protected getDataChunk(buffer: ArrayBuffer): ArrayBuffer {
    return buffer.slice(44, buffer.byteLength);
  }

  protected setDuration(buffer: ArrayBuffer) {
    this._duration = this.getDataChunkSize(buffer) / (this._channels * this._bitsPerSample) * 8;
  }

  private setDataStart(buffer: ArrayBuffer) {
    // search "data" info
    let result = -1;
    let test = '';

    while (test !== 'data') {
      result++;
      if (result + 4 < buffer.byteLength) {
        const part = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(result, result + 4)));
        test = '' + part.slice(0, 4) + '';
      } else {
        break;
      }
    }

    result += 4;

    if (result >= buffer.byteLength) {
      this.dataStart = -1;
    } else {
      this.dataStart = result;
    }
  }

  private getFileFromBufferPart(data: Uint8Array | Uint16Array, channels: number, filename: string): File {
    return new File([this.getFileDataView(data, channels)], `${filename}.wav`, {type: 'audio/wav'});
  }

  public splitChannelsToFiles(filename: string, type: string, buffer: ArrayBuffer): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
      const result = [];

      if (this.isValid(buffer)) {
        if (this._channels > 1) {
          const u8array = new Uint8Array(buffer);

          const promises: Promise<Uint8Array | Uint16Array>[] = [];
          promises.push(this.extractDataFromArray(0, this._duration, u8array, 0));
          promises.push(this.extractDataFromArray(0, this._duration, u8array, 1));

          Promise.all(promises).then((extracts) => {
            for (let i = 0; i < extracts.length; i++) {
              const extract = extracts[i];
              result.push(this.getFileFromBufferPart(extract, 1, `${filename}_${i + 1}`));
            }
            resolve(result);
          }).catch((error) => {
            reject(error);
          });
        } else {
          reject(`can't split audio file because it contains one channel only.`);
        }
      } else {
        reject('no valid wav format!');
      }

      return result;
    });
  }
}
