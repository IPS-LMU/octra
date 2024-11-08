import { NumeratedSegment } from '@octra/media';
import { Subject } from 'rxjs';
import { WavWriter } from './binary';
import { IntArray } from './AudioFormats';
import { AudioInfo } from './audio-info';

export class AudioCutter {
  private status: 'running' | 'stopRequested' | 'stopped' = 'stopped';
  public onaudiocut = new Subject<{
    finishedSegments: number;
    fileName: string;
    intArray: Uint8Array;
  }>();
  private wavWriter?: WavWriter;

  public formatConstructor!:
    | Uint8ArrayConstructor
    | Int16ArrayConstructor
    | Int32ArrayConstructor;

  constructor(private audioInfo: AudioInfo) {
    if (this.audioInfo.bitrate === 32) {
      this.formatConstructor = Int32Array;
    } else if (this.audioInfo.bitrate === 16) {
      this.formatConstructor = Int16Array;
    } else if (this.audioInfo.bitrate === 8) {
      this.formatConstructor = Uint8Array;
    }
  }

  cutAudioFileFromChannelData = async (
    audioInfo: AudioInfo,
    fileName: string,
    buffer: Float32Array,
    segment: NumeratedSegment
  ) => {
    const data = buffer.slice(
      segment.sampleStart,
      segment.sampleDur ? segment.sampleStart + segment.sampleDur : undefined
    );

    if (!this.wavWriter) {
      this.wavWriter = new WavWriter();
    }

    const uint8Array = await this.wavWriter.writeAsync(
      [data],
      audioInfo.audioBufferInfo?.sampleRate ?? audioInfo.sampleRate
    );
    return {
      fileName,
      uint8Array,
    };
  };

  public getFileDataView(data: Int16Array, channels: number): ArrayBuffer {
    // creates a mono data view
    const blockAlign = (channels * this.audioInfo.bitrate) / 8;
    const subChunk2Size = data.length * blockAlign;

    const buffer = new ArrayBuffer(44 + data.byteLength);
    const dataView = new DataView(buffer);

    /* RIFF identifier */
    this.writeString(dataView, 0, 'RIFF');
    /* RIFF chunk length */
    dataView.setUint32(4, 36 + subChunk2Size, true);
    /* RIFF type */
    this.writeString(dataView, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(dataView, 12, 'fmt ');
    /* format chunk length */
    dataView.setUint32(16, 16, true);
    /* sample format (raw) */
    dataView.setUint16(20, 1, true);
    /* channel count */
    dataView.setUint16(22, channels, true);
    /* sample rate */
    dataView.setUint32(24, this.audioInfo.sampleRate, true);
    /* byte rate (sample rate * block align) */
    dataView.setUint32(28, this.audioInfo.sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    dataView.setUint16(32, blockAlign, true);
    /* bits per sample */
    dataView.setUint16(34, this.audioInfo.bitrate, true);
    /* data chunk identifier */
    this.writeString(dataView, 36, 'data');
    /* data chunk length */
    dataView.setUint32(40, subChunk2Size, true);

    for (let i = 0; i < data.length; i++) {
      if (data instanceof Uint8Array) {
        dataView.setUint8(44 + i, data[i]);
      } else if (this.audioInfo.bitrate === 16) {
        // little endian must be set!
        dataView.setUint16(44 + i * 2, data[i], true);
      } else {
        //TODO check this
        dataView.setUint32(44 + i * 4, data[i], true);
      }
    }
    return dataView.buffer;
  }

  private writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  getNewFileName(
    namingConvention: string,
    fileName: string,
    segment: NumeratedSegment
  ) {
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
        case 'name':
          return name;
        case 'sequNumber':
          return `${leadingNull}${segment.number + 1}`;
        case 'sampleStart':
          return segment.sampleStart;
        case 'sampleDur':
          return segment.sampleDur;
        case 'secondsStart':
          return (
            Math.round(
              (segment.sampleStart / this.audioInfo.sampleRate) * 1000
            ) / 1000
          );
        case 'secondsDur':
          return (
            Math.round(
              (segment.sampleStart / this.audioInfo.sampleRate) * 1000
            ) / 1000
          );
      }
      return g1;
    });
  }

  public cutChannelDataSequentially(
    namingConvention: string,
    buffer: Float32Array,
    segments: NumeratedSegment[],
    pointer = 0
  ): void {
    if (pointer === 0) {
      this.status = 'running';
    }
    if (pointer > -1 && pointer < segments.length) {
      let segment = { ...segments[pointer] };

      const channelDataFactor =
        (this.audioInfo.audioBufferInfo?.sampleRate ??
          this.audioInfo.sampleRate) / this.audioInfo.sampleRate;

      segment = {
        ...segment,
        sampleStart: Math.ceil(segment.sampleStart * channelDataFactor),
        sampleDur:
          pointer === segments.length - 1
            ? undefined
            : Math.ceil(segment.sampleDur! * channelDataFactor),
      };

      const fileName = this.getNewFileName(
        namingConvention,
        this.audioInfo.fullname,
        segment
      );
      this.cutAudioFileFromChannelData(
        this.audioInfo,
        fileName,
        buffer,
        segment
      )
        .then(({ fileName, uint8Array }) => {
          this.onaudiocut.next({
            finishedSegments: pointer + 1,
            fileName,
            intArray: uint8Array,
          });

          if (pointer < segments.length - 1) {
            // continue
            // const freeSpace = window.performance.memory.totalJSHeapSize - window.performance.memory.usedJSHeapSize;
            // console.log(`${freeSpace / 1024 / 1024} MB left.`);
            if (this.status === 'running') {
              setTimeout(
                () =>
                  this.cutChannelDataSequentially(
                    namingConvention,
                    buffer,
                    segments,
                    ++pointer
                  ),
                200
              );
            } else {
              this.status = 'stopped';
            }
          } else {
            // stop
            this.onaudiocut.complete();
          }
        })
        .catch((error) => {
          this.onaudiocut.error(error);
        });
    } else {
      this.onaudiocut.error(new Error('pointer is invalid!'));
    }
  }

  public splitChannelsToFiles(
    filename: string,
    type: string,
    buffer: ArrayBuffer
  ): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
      const result: File[] = [];

      if (this.audioInfo.channels > 1) {
        const wavWriter = new WavWriter();
        const u8array = new Uint8Array(buffer);

        const promises: Promise<IntArray>[] = [];
        promises.push(
          this.extractDataFromArray(
            0,
            this.audioInfo.duration.samples,
            u8array,
            0
          )
        );
        promises.push(
          this.extractDataFromArray(
            0,
            this.audioInfo.duration.samples,
            u8array,
            1
          )
        );

        Promise.all(promises)
          .then((extracts) => {
            for (let i = 0; i < extracts.length; i++) {
              const extract = extracts[i];
              result.push(
                this.getFileFromBufferPart(
                  extract as any,
                  1,
                  `${filename}_${i + 1}`
                )
              );
            }
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        reject(`can't split audio file because it contains one channel only.`);
      }

      return result;
    });
  }

  private getFileFromBufferPart(
    data: IntArray,
    channels: number,
    filename: string
  ): File {
    return new File(
      [this.getFileDataView(data as any, channels)],
      `${filename}.wav`,
      {
        type: 'audio/wav',
      }
    );
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
    selectedChannel?: number
  ): Promise<IntArray> {
    return new Promise<IntArray>((resolve, reject) => {
      let convertedData: IntArray;
      let result: IntArray | undefined = undefined;

      // one block contains one sample of each channel
      // eg. blockAlign = 4 Byte => 2 * 8 Channel1 + 2 * 8 Channel2 = 32Bit = 4 Byte
      const channels =
        selectedChannel !== undefined ? 1 : this.audioInfo.channels;
      const blockAlign = (this.audioInfo.bitrate / 8) * channels;

      let start = sampleStart * blockAlign;
      let dataChunkLength = sampleDur * blockAlign;
      let startPos: number;

      const divider = this.audioInfo.bitrate / 8;
      if ([32, 16, 8].includes(this.audioInfo.bitrate)) {
        dataChunkLength = Math.round(dataChunkLength / divider);
        result = new this.formatConstructor(dataChunkLength);
        convertedData = new this.formatConstructor(
          uint8Array.buffer,
          uint8Array.byteOffset,
          uint8Array.byteLength / divider
        );
        start = Math.round(start / divider);
        startPos = 44 / divider + Math.round(start);
      }

      if (result) {
        // start and duration are the position in bytes after the header
        const endPos = startPos! + Math.round(dataChunkLength);

        if (selectedChannel === undefined || this.audioInfo.channels === 1) {
          result.set(convertedData!.slice(startPos!, endPos));
          resolve(result);
        } else {
          // get data from selected channel only

          const channelData: IntArray[] = [];
          const dataStart = 44 / divider;

          for (let i = 0; i < this.audioInfo.channels; i++) {
            channelData.push(
              new this.formatConstructor(
                Math.round(dataStart + dataChunkLength)
              )
            );
          }

          let pointer = 0;
          for (let i = startPos!; i < endPos * this.audioInfo.channels; i++) {
            try {
              for (let j = 0; j < this.audioInfo.channels; j++) {
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
}
