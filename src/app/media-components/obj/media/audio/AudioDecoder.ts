import {AudioFormat, WavFormat} from './AudioFormats';
import {Subject} from 'rxjs';
import {AudioInfo} from './AudioInfo';
import {OriginalSample} from './AudioTime';

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

  private stopDecoding = false;

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

  decodeChunked(sampleStart: number, sampleDur: number) {
    if (this.format instanceof WavFormat) {
      // cut the audio file into 10 parts:
      const partSamples = this.createOriginalSample(
        sampleDur
      );

      const startSamples = this.createOriginalSample(
        sampleStart
      );

      if (sampleStart === 0) {
        this.stopDecoding = false;
      }

      if (sampleStart + sampleDur <= this.audioInfo.duration.originalSample.value && sampleStart >= 0 && sampleDur >= sampleDur) {

        if (sampleStart === 0 && sampleDur === this.audioInfo.duration.originalSample.value) {
          this.decodeAudioFile(this.arrayBuffer).then((audiobuffer) => {
            this.onaudiodecode.next({
              progress: 1,
              result: audiobuffer
            });
          }).catch((error) => {
            console.error(error);
          });
        } else {
          // decode chunked
          this.format.getAudioCutAsArrayBuffer(this.arrayBuffer, {
            number: 0,
            sampleStart: startSamples,
            sampleDur: partSamples
          }).then((dataPart: ArrayBuffer) => {
            this.decodeAudioFile(dataPart).then((audioBuffer: AudioBuffer) => {
              // console.log(`decoded part duration: ${audioBuffer.duration} (diff: ${audioBuffer.duration - partSamples.seconds}) (browser samplerate = ${this.audioInfo.duration.sampleRates.browser}`);

              if (audioBuffer.duration - partSamples.seconds !== 0) {
                console.error(`diff of audio durations is ${audioBuffer.duration - partSamples.seconds} = ${(partSamples.seconds - audioBuffer.duration) * partSamples.sampleRate} samples! (sample rate = ${partSamples.sampleRate})`);
              }

              if (!(this.audioBuffer === null || this.audioBuffer === undefined)) {
                this.audioBuffer = this.appendAudioBuffer(this.audioBuffer, audioBuffer);
              } else {
                this.audioBuffer = audioBuffer;
              }


              if (sampleStart + sampleDur === this.audioInfo.duration.originalSample.value) {
                // send complete audiobuffer
                this.onaudiodecode.next({
                  progress: 1,
                  result: this.audioBuffer
                });
                this.onaudiodecode.complete();
              } else {
                const progress = (sampleStart + sampleDur) / this.audioInfo.duration.originalSample.value;
                this.onaudiodecode.next({
                  progress,
                  result: null
                });

                if (!this.stopDecoding) {
                  setTimeout(() => {
                    let sampleDur2 = Math.min(sampleDur, this.audioInfo.duration.originalSample.value - sampleStart - sampleDur);

                    if (this.audioInfo.duration.originalSample.value - sampleStart - sampleDur < 2 * sampleDur) {
                      sampleDur2 = this.audioInfo.duration.originalSample.value - sampleStart - sampleDur;
                    }
                    this.decodeChunked(sampleStart + sampleDur, sampleDur2);
                  }, 200);
                } else {
                  this.onaudiodecode.complete();
                }
                this.stopDecoding = false;
              }

            }).catch((error2) => {
              console.error(error2);
            });
          }).catch((error3) => {
            this.onaudiodecode.error(error3);
          });
        }
      } else {
        console.error(`can not decode part because samples are not correct`);
      }
    } else {
      this.decodeAudioFile(this.arrayBuffer).then((result) => {
        this.onaudiodecode.next({
          progress: 1,
          result
        });
      }).catch((error4) => {
        this.onaudiodecode.error(error4);
      });
    }
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
      (oldBuffer.length + newBuffer.length), oldBuffer.sampleRate);

    for (let i = 0; i < this.audioInfo.channels; i++) {
      const channel = tmp.getChannelData(i);
      channel.set(oldBuffer.getChannelData(i), 0);
      channel.set(newBuffer.getChannelData(i), oldBuffer.length);
    }
    return tmp;
  }

  public createOriginalSample(sample: number): OriginalSample {
    return new OriginalSample(sample, this.audioInfo.samplerate);
  }

  public requeststopDecoding() {
    this.stopDecoding = true;
  }
}

export interface SegmentToDecode {
  number: number;
  sampleStart: OriginalSample;
  sampleDur: OriginalSample;
}
