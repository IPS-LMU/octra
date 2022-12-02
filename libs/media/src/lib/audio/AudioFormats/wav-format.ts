import {AudioFormat, IntArray} from './audio-format';
import {NumeratedSegment} from '../../types';
import {Subject} from 'rxjs';

// http://soundfile.sapp.org/doc/WaveFormat/
export class WavFormat extends AudioFormat {
  public onaudiocut: Subject<{
    finishedSegments: number,
    fileName: string,
    intArray: IntArray
  }> = new Subject<{
    finishedSegments: number,
    fileName: string,
    intArray: IntArray
  }>();
  protected dataStart = -1;
  private status: 'running' | 'stopRequested' | 'stopped' = 'stopped';

  protected _blockAlign!: number;

  public get blockAlign() {
    return this._blockAlign;
  }

  constructor() {
    super();
    this._extension = '.wav';
  }

  private static writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  public override init(filename: string, buffer: ArrayBuffer) {
    this.setDataStart(buffer);
    super.init(filename, buffer);
    this.setBlockAlign(buffer);
    if (this.bitsPerSample === 32) {
      this.formatConstructor = Int32Array;
    } else if (this.bitsPerSample === 16) {
      this.formatConstructor = Int16Array;
    } else if (this.bitsPerSample === 8) {
      this.formatConstructor = Uint8Array;
    }
  }

  /***
   * checks if it is a valid wave file
   * @param buffer the audio file's array buffer
   */
  public isValid(buffer: ArrayBuffer): boolean {
    let bufferPart = buffer.slice(0, 4);
    let test1 = String.fromCharCode.apply(undefined, new Uint8Array(bufferPart) as any);

    bufferPart = buffer.slice(8, 12);
    let test2 = String.fromCharCode.apply(undefined, new Uint8Array(bufferPart) as any);
    test1 = test1.slice(0, 4);
    test2 = test2.slice(0, 4);
    const formatTag = new Uint8Array(buffer.slice(20, 21));
    //254 = PCM S24LE (s24l)
    const byteCheck = formatTag[0] === 1;
    return (test1 + '' === 'RIFF' && test2 === 'WAVE');
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

      this.cutAudioFile(namingConvention, buffer, segment).then(({fileName, uint8Array}) => {
        this.onaudiocut.next({
          finishedSegments: pointer + 1,
          fileName,
          intArray: uint8Array
        });

        if (pointer < segments.length - 1) {
          // continue
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

  public cutAudioFile(namingConvention: string, buffer: ArrayBuffer, segment: NumeratedSegment): Promise<{
    fileName: string,
    uint8Array: Uint8Array
  }> {
    return new Promise<{
      fileName: string,
      uint8Array: Uint8Array
    }>((resolve, reject) => {
      const fileName = this.getNewFileName(namingConvention, this._filename, segment);

      if (this.isValid(buffer)) {
        const u8array = new Uint8Array(buffer);

        this.extractDataFromArray(segment.sampleStart, segment.sampleDur, u8array).then((data: IntArray) => {
          resolve({
            fileName,
            uint8Array: new Uint8Array(this.getFileFromBufferPartArrayBuffer(data, this._channels))
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('no valid wav format!');
      }
    });
  }

  public getFileDataView(data: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array, channels: number): ArrayBuffer {
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
      } else if (this._bitsPerSample === 16) {
        // little endian must be set!
        dataView.setUint16(44 + (i * 2), data[i], true);
      } else {
        //TODO check this
        dataView.setUint32(44 + (i * 4), data[i], true);
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
   * @param uint8Array the array to be read
   * @param selectedChannel the selected channel
   */
  public extractDataFromArray(sampleStart: number, sampleDur: number, uint8Array: Uint8Array, selectedChannel?: number)
    : Promise<IntArray> {
    return new Promise<IntArray>((resolve, reject) => {
      let convertedData: IntArray;
      let result: IntArray | undefined = undefined;

      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const channels = (selectedChannel !== undefined) ? 1 : this._channels;
      const blockAlign = (this._bitsPerSample / 8) * channels;

      let start = sampleStart * blockAlign;
      let dataChunkLength = sampleDur * blockAlign;
      const unsigned = this._bitsPerSample === 8;
      let startPos: number;

      const divider = this._bitsPerSample / 8;
      if ([32, 16, 8].includes(this._bitsPerSample)) {
        dataChunkLength = Math.round(dataChunkLength / divider);
        result = new this.formatConstructor(dataChunkLength);
        convertedData = new this.formatConstructor(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength / divider);
        start = Math.round(start / divider);
        startPos = (44 / divider) + Math.round(start);
      }

      if (result) {
        // start and duration are the position in bytes after the header
        const endPos = startPos! + Math.round(dataChunkLength);

        if (selectedChannel === undefined || this._channels === 1) {
          result.set(convertedData!.slice(startPos!, endPos));
          resolve(result);
        } else {
          // get data from selected channel only

          const channelData: (IntArray)[] = [];
          const dataStart = 44 / divider;

          for (let i = 0; i < this._channels; i++) {
            channelData.push(new this.formatConstructor(Math.round(dataStart + dataChunkLength)));
          }

          let pointer = 0;
          for (let i = startPos!; i < endPos * this._channels; i++) {
            try {
              for (let j = 0; j < this._channels; j++) {
                channelData[j][dataStart + pointer] = convertedData![dataStart + i + j];
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
        const part = String.fromCharCode.apply(undefined, new Uint8Array(buffer.slice(result, result + 4)) as any);
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

  private getFileFromBufferPart(data: IntArray, channels: number, filename: string): File {
    return new File([this.getFileDataView(data, channels)], `${filename}.wav`, {type: 'audio/wav'});
  }

  private getFileFromBufferPartArrayBuffer(data: IntArray, channels: number): ArrayBuffer {
    return this.getFileDataView(data, channels);
  }

  public splitChannelsToFiles(filename: string, type: string, buffer: ArrayBuffer): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
      const result: File[] = [];

      if (this.isValid(buffer)) {
        if (this._channels > 1) {
          const u8array = new Uint8Array(buffer);

          const promises: Promise<IntArray>[] = [];
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
