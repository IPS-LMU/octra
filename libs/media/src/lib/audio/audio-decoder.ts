import {AudioInfo} from './audio-info';
import {SampleUnit} from './audio-time';
import {SubscriptionManager, TsWorker, TsWorkerJob, TsWorkerStatus} from '@octra/utilities';
import {AudioFormat, IntArray, WavFormat} from './AudioFormats';
import {Subject, timer} from 'rxjs';

declare let window: unknown;

/***
 * The AudioDecoder is used as a replacement for the Web Audio API decoding and makes use of web workers.
 */
export class AudioDecoder {

  /**
   * triggers as soon as new channel data was read. Last event has progress 1.
   */
  public onChannelDataCalculate: Subject<{
    progress: number,
    result?: Float32Array
  }> = new Subject<{
    progress: number,
    result?: Float32Array
  }>();

  // timestamp when decoding was started
  public started = 0;
  // info about the audio file
  private audioInfo: AudioInfo;
  // the selected audio format
  private readonly format: AudioFormat;

  private channelData?: Float32Array;
  private channelDataOffset = 0;
  private audioContext: AudioContext;

  // workers used for decoding
  private tsWorkers: TsWorker[];
  private nextWorker = 0;
  private parallelJobs = 2;

  private joblist: {
    jobId: number,
    start: number,
    duration: number
  }[] = [];
  private subscriptionManager = new SubscriptionManager();

  private stopDecoding = false;
  private uint8Array?: Uint8Array;
  private writtenChannel = 0;
  private afterChannelDataFinished?: Subject<void>;

  get channelDataFactor() {
    let factor: number;
    if (this.audioInfo.sampleRate === 48000) {
      factor = 3;
      // sampleRate = 16000
    } else if (this.audioInfo.sampleRate === 44100) {
      factor = 2;
    } else {
      // sampleRate = 22050
      factor = 1;
    }
    return factor;
  }

  constructor(format: AudioFormat, audioInfo: AudioInfo, arrayBuffer: ArrayBuffer) {
    if (!(format === undefined || format === null)) {
      this.format = format;
      this.audioInfo = audioInfo;
      this.uint8Array = new Uint8Array(arrayBuffer);
      this.audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      this.tsWorkers = [];

      for (let i = 0; i < this.parallelJobs; i++) {
        const worker = new TsWorker();
        worker.jobstatuschange.subscribe(async (job: TsWorkerJob) => {
          const jobItem = this.joblist.findIndex((a) => {
            return a.jobId === job.id;
          });

          if (job.status === TsWorkerStatus.FINISHED && job.result !== undefined) {
            if (jobItem > -1) {
              const j = this.joblist[jobItem];
              this.writtenChannel += j.duration;
              this.joblist.splice(jobItem, 1);

              if (this.channelData === undefined || this.channelData === null) {
                this.channelData = new Float32Array(Math.round(this.audioInfo.duration.samples / this.channelDataFactor));
              }

              try {
                const result = await this.minimizeChannelData(job.result, this.channelDataFactor);
                this.insertChannelBuffer(Math.floor(j.start / this.channelDataFactor), result);
              } catch (e) {
                console.error(e);
              }
            }
          }

          if (this.writtenChannel >= this.audioInfo.duration.samples - 1) {
            // send complete audiobuffer
            this.onChannelDataCalculate.next({
              progress: 1,
              result: this.channelData
            });

            this.afterChannelDataFinished!.next();
          } else {
            const progress = this.writtenChannel / (this.audioInfo.duration.samples);
            this.onChannelDataCalculate.next({
              progress,
              result: undefined
            });
          }
        });

        this.tsWorkers.push(worker);
      }

    } else {
      throw new Error('format is undefined or undefined');
    }
  }

  async getChunkedChannelData(sampleStart: SampleUnit, sampleDur: SampleUnit) {
    if (this.format instanceof WavFormat) {
      // cut the audio file into 10 parts:
      if (sampleStart.samples === 0) {
        this.stopDecoding = false;
      }

      if (sampleStart.samples + sampleDur.samples <= this.audioInfo.duration.samples
        && sampleStart.samples >= 0) {

        if (this.afterChannelDataFinished === undefined) {
          this.afterChannelDataFinished = new Subject<void>();
          this.afterChannelDataFinished.subscribe(() => {
            this.afterChannelDataFinished!.unsubscribe();
            this.afterChannelDataFinished = undefined;
            this.onChannelDataCalculate.complete();
          });
        }

        if (sampleStart.samples === 0 && sampleDur.samples === this.audioInfo.duration.samples) {
          const data = await this.format.extractDataFromArray(sampleStart.samples, sampleDur.samples, this.uint8Array!, 0);
          const job = new TsWorkerJob(this.getChannelData, [data, sampleDur.samples, this.format.bitsPerSample]);
          this.addJobToWorker(sampleStart.samples, sampleDur.samples, job);
        } else {
          // decode chunked
          const result = await this.format.extractDataFromArray(sampleStart.samples, sampleDur.samples, this.uint8Array!, 0);
          const job = new TsWorkerJob(this.getChannelData, [result, sampleDur.samples, this.format.bitsPerSample]);
          this.addJobToWorker(sampleStart.samples, sampleDur.samples, job);

          if (sampleStart.samples + sampleDur.samples < this.audioInfo.duration.samples) {
            if (!this.stopDecoding) {
              this.subscriptionManager.add(timer(10).subscribe(() => {
                let sampleDur2 = Math.min(sampleDur.samples,
                  this.audioInfo.duration.samples - sampleStart.samples - sampleDur.samples);

                if (this.audioInfo.duration.samples - sampleStart.samples - sampleDur.samples < 2 * sampleDur.samples) {
                  sampleDur2 = this.audioInfo.duration.samples - sampleStart.samples - sampleDur.samples;
                }
                const durationUnit = new SampleUnit(sampleDur2, this.audioInfo.sampleRate);
                this.getChunkedChannelData(sampleStart.add(sampleDur), durationUnit).catch((error) => {
                  console.error(error);
                });
              }));
            } else {
              this.onChannelDataCalculate.complete();
            }
            this.stopDecoding = false;
          }
        }

      } else {
        throw new Error(`can not decode part because samples are not correct`);
      }
    } else {
      this.onChannelDataCalculate.error(new Error('Unsopported audio file format'));
      throw new Error('Unsopported audio file format');
    }
  }

  public destroy() {
    this.subscriptionManager.destroy();
    this.uint8Array = undefined;
    for (let i = 0; i < this.parallelJobs; i++) {
      this.tsWorkers[i].destroy();
    }
  }

  public async minimizeChannelData(channelData: Float32Array, factor: number): Promise<Float32Array> {
    if (factor !== 1) {
      const result = new Float32Array(Math.round(channelData.length / factor));

      let counter = 0;
      for (let i = 0; i < channelData.length; i++) {

        let sum = 0;
        for (let j = 0; j < factor; j++) {
          sum += channelData[i + j];
        }

        result[counter] = sum / factor;
        i += factor - 1;
        counter++;
      }
      return result;
    } else {
      return channelData;
    }
  }

  public createOriginalSample(sample: number): SampleUnit {
    return new SampleUnit(sample, this.audioInfo.sampleRate);
  }

  public requeststopDecoding() {
    this.stopDecoding = true;
  }

  private insertChannelBuffer(offset: number, channelData: Float32Array) {
    if (offset + channelData.length <= this.channelData!.length) {
      this.channelData!.set(channelData, offset);
      this.channelDataOffset += channelData.length;
    } else {
      console.error(`can't insert channel channelData: ${channelData.length}, buffer: ${(offset + channelData.length) - this.channelData!.length}`);
    }
  }

  private getChannelData = (data: IntArray, sampleDuration: number, bitsPerSample: number) => {
    return new Promise<Float32Array>((resolve) => {
      const duration = sampleDuration;
      const result = new Float32Array(duration);
      const maxNum = Math.pow(2, bitsPerSample) / 2;
      const unsigned = bitsPerSample === 8;

      let sign = (unsigned) ? -1 : 1;

      for (let i = 0; i < duration; i++) {
        let entry = data[i];

        if (isNaN(entry)) {
          console.error(`entry is NaN at ${i}`);
          break;
        }
        if (unsigned) {
          entry = entry / 2
        }

        result[i] = entry / maxNum * sign;
        const t = result[i];
        if (result[i] > 1) {
          console.error(`entry greater than 1: ${result[i]} at ${i}`);
          break;
        }
        if (unsigned) {
          sign = sign * -1;
        }
      }
      resolve(result);
    });
  }

  private addJobToWorker(start: number, duration: number, job: TsWorkerJob) {
    this.tsWorkers[this.nextWorker].addJob(job);
    this.joblist.push({
      jobId: job.id,
      start,
      duration
    });
    this.nextWorker = (this.nextWorker + 1) % this.parallelJobs;
  }
}

export interface SegmentToDecode {
  number: number;
  sampleStart: SampleUnit;
  sampleDur: SampleUnit;
}
