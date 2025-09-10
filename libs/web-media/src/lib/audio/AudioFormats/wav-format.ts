import { AudioFormat, IntArray } from './audio-format';

// http://soundfile.sapp.org/doc/WaveFormat/
export class WavFormat extends AudioFormat {
  protected dataStart = -1;
  private status: 'running' | 'stopRequested' | 'stopped' = 'stopped';

  protected _blockAlign!: number;
  protected override _decoder: 'web-audio' | 'octra' = 'octra';

  public get blockAlign() {
    return this._blockAlign;
  }

  constructor() {
    super();
    this._supportedFormats = [
      {
        extension: '.wav',
        maxFileSize: 1900000000, // 1.9 GB
      },
    ];
  }

  public override async init(
    filename: string,
    mimeType: string,
    buffer: ArrayBuffer,
  ) {
    this.setDataStart(buffer);
    await super.init(filename, mimeType, buffer);
  }

  override async readAudioInformation(buffer: ArrayBuffer) {
    this.setSampleRate(buffer);
    this.setChannels(buffer);
    this.setBitsPerSample(buffer);
    this.setByteRate(buffer);
    this.setDuration(buffer);

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
    let test1 = String.fromCharCode.apply(
      undefined,
      new Uint8Array(bufferPart) as any,
    );

    bufferPart = buffer.slice(8, 12);
    let test2 = String.fromCharCode.apply(
      undefined,
      new Uint8Array(bufferPart) as any,
    );
    test1 = test1.slice(0, 4);
    test2 = test2.slice(0, 4);
    const formatTag = new Uint8Array(buffer.slice(20, 21));
    //254 = PCM S24LE (s24l)
    const byteCheck = formatTag[0] === 1;
    return test1 + '' === 'RIFF' && test2 === 'WAVE';
  }

  /***
   * cuts the data part of selected samples from an Uint8Array
   * @param sampleStart the start of the extraction
   * @param sampleDur the duration of the extraction
   * @param uint8Array the array to be read
   * @param selectedChannel the selected channel
   */
  public extractDataFromArray(
    sampleStart: number,
    sampleDur: number,
    uint8Array: Uint8Array,
    selectedChannel?: number,
  ): Promise<IntArray> {
    return new Promise<IntArray>((resolve, reject) => {
      let convertedData: IntArray;
      let result: IntArray | undefined = undefined;

      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const channels = selectedChannel !== undefined ? 1 : this._channels;
      const blockAlign = (this._bitsPerSample / 8) * channels;

      let start = sampleStart * blockAlign;
      let dataChunkLength = sampleDur * blockAlign;
      let startPos: number;

      const divider = this._bitsPerSample / 8;
      if ([32, 16, 8].includes(this._bitsPerSample)) {
        dataChunkLength = Math.round(dataChunkLength / divider);
        result = new this.formatConstructor(dataChunkLength);
        convertedData = new this.formatConstructor(
          uint8Array.buffer as any
        );
        start = Math.round(start / divider);
        startPos = 44 / divider + Math.round(start);
      }

      if (result) {
        // start and duration are the position in bytes after the header
        const endPos = startPos! + Math.round(dataChunkLength);

        if (selectedChannel === undefined || this._channels === 1) {
          result.set(convertedData!.slice(startPos!, endPos));
          resolve(result);
        } else {
          // get data from selected channel only

          const channelData: IntArray[] = [];
          const dataStart = 44 / divider;

          for (let i = 0; i < this._channels; i++) {
            channelData.push(
              new this.formatConstructor(
                Math.round(dataStart + dataChunkLength),
              ),
            );
          }

          let pointer = 0;
          for (let i = startPos!; i < endPos * this._channels; i++) {
            try {
              for (let j = 0; j < this._channels; j++) {
                channelData[j][dataStart + pointer] =
                  convertedData![dataStart + i + j];
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
    this._duration = {
      samples:
        (this.getDataChunkSize(buffer) /
          (this._channels * this._bitsPerSample)) *
        8,
      seconds:
        ((this.getDataChunkSize(buffer) /
          (this._channels * this._bitsPerSample)) *
          8) /
        this._sampleRate,
    };
  }

  private setDataStart(buffer: ArrayBuffer) {
    // search "data" info
    let result = -1;
    let test = '';

    while (test !== 'data') {
      result++;
      if (result + 4 < buffer.byteLength) {
        const part = String.fromCharCode.apply(
          undefined,
          new Uint8Array(buffer.slice(result, result + 4)) as any,
        );
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
}
