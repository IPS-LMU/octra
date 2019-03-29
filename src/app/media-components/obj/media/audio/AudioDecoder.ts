import {AudioFormat, WavFormat} from './AudioFormats';
import {Subject} from 'rxjs';
import {AudioInfo} from './AudioInfo';

declare var window: any;

export class AudioDecoder {
  public onaudiodecode: Subject<{
    progress: number,
    result: AudioBuffer
  }> = new Subject<{
    progress: number,
    result: AudioBuffer
  }>();

  private audioInfo: AudioInfo;
  private format: AudioFormat;
  private audioBuffer: AudioBuffer;
  private audioContext: AudioContext;
  private arrayBuffer: ArrayBuffer;

  constructor(format: AudioFormat, arrayBuffer: ArrayBuffer) {
    if (!(format === null || format === undefined)) {
      this.audioInfo = format.getAudioInfo('file.wav', 'audio/wav', arrayBuffer);
      this.format = format;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.arrayBuffer = arrayBuffer;
    } else {
      throw new Error('format is null or undefined');
    }
  }

  decodeChunked(pointer = 0) {
    if (this.format instanceof WavFormat) {
      const numberOfParts = this.getNumberOfDataParts(this.arrayBuffer.byteLength);

      console.log(`pointer is ${pointer}`);
      // cut the audio file into 10 parts:
      const partSamples = Math.round(this.audioInfo.duration.originalSample.value / numberOfParts);

      const startSamples = partSamples * pointer;

      if (pointer < numberOfParts) {
        this.format.getAudioCutAsArrayBuffer(this.arrayBuffer, {
          number: 0,
          sampleStart: startSamples,
          sampleDur: partSamples
        }).then((dataPart: ArrayBuffer) => {
          this.decodeAudioFile(dataPart).then((audioBuffer: AudioBuffer) => {
            this.audioBuffer = audioBuffer;
            // send complete audiobuffer
            this.onaudiodecode.next({
              progress: 1,
              result: this.audioBuffer
            });
            this.onaudiodecode.complete();
          }).catch((error) => {
            console.error(error);
          });
        }).catch((error) => {
          this.onaudiodecode.error(error);
        });
      } else {
        // finished
        this.onaudiodecode.complete();
      }
    } else {
      this.decodeAudioFile(this.arrayBuffer).then((result) => {
        this.onaudiodecode.next({
          progress: 1,
          result: result
        });
      }).catch((error) => {
        this.onaudiodecode.error(error);
      });
    }
  }

  private getNumberOfDataParts(fileSize: number): number {
    const mb = fileSize / 1024 / 1024;

    if (mb < 10) {
      return 1;
    }
    if (mb < 100) {
      return 5;
    }
    if (mb < 500) {
      return 10;
    }
    if (mb < 1024) {
      return 20;
    }

    return 30;
  }

  public decodePartOfAudioFile: (segment: {
    number: number,
    sampleStart: number,
    sampleDur: number
  }) => Promise<AudioBuffer> = (segment) => {
    return new Promise<AudioBuffer>((resolve, reject) => {
      if (!(segment === null || segment === undefined)) {
        if (segment.sampleStart >= 0 && segment.sampleStart + segment.sampleDur <= this.audioInfo.duration.browserSample.value
          && segment.sampleDur > 0) {
          (<WavFormat>this.format).getAudioCutAsArrayBuffer(this.arrayBuffer, segment)
            .then((arrayBuffer: ArrayBuffer) => {
              this.decodeAudioFile(arrayBuffer).then((audioBuffer: AudioBuffer) => {
                resolve(audioBuffer);
              }).catch((error) => {
                console.log(`catched 5`);
                reject(error);
              });
            }).catch((error) => {
            console.log(`catched 4`);
            reject(error);
          });
        } else {
          reject(new Error('values of segment are invalid'));
        }
      } else {
        reject(new Error('segment is null or undefined'));
      }
    });
  }

  /**
   * decodes the audio file and keeps its samplerate using OfflineAudioContext
   */
  private decodeAudioFile(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      if (!(arrayBuffer === null || arrayBuffer === undefined)) {
        this.audioContext.decodeAudioData(arrayBuffer).then((audiobuffer: AudioBuffer) => {
          resolve(audiobuffer);
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject(new Error('arrayBuffer is null or undefined'));
      }
    });
  }

  public appendAudioBuffer(oldBuffer: AudioBuffer, newBuffer: AudioBuffer) {
    const tmp = this.audioContext.createBuffer(this.audioInfo.channels,
      (oldBuffer.length + newBuffer.length), this.audioInfo.samplerate);

    for (let i = 0; i < this.audioInfo.channels; i++) {
      const channel = tmp.getChannelData(i);
      channel.set(oldBuffer.getChannelData(i), 0);
      channel.set(newBuffer.getChannelData(i), oldBuffer.length);
    }
    return tmp;
  }
}
