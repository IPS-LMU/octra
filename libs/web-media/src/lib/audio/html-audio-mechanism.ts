import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import {
  AudioDecoder,
  AudioFormat,
  AudioInfo,
  AudioManager,
  AudioResource,
  getAudioInfo,
  MusicMetadataFormat,
  WavFormat,
} from '@octra/web-media';
import { Howl } from 'howler';
import { concat, map, Observable, Subject } from 'rxjs';
import { SourceType } from '../types';
import {
  AudioMechanism,
  AudioMechanismPrepareOptions,
} from './audio-mechanism';

export class HtmlAudioMechanism extends AudioMechanism {
  private callBacksAfterEnded: (() => void)[] = [];
  private _howler?: Howl;

  private audioFormats: AudioFormat[] = [
    new WavFormat(),
    new MusicMetadataFormat(),
  ];
  private decoder?: AudioDecoder;

  get playPosition(): SampleUnit | undefined {
    if (!this._howler || !this._resource?.info?.sampleRate) {
      return undefined;
    }

    return new SampleUnit(
      SampleUnit.calculateSamples(
        this._howler.seek(),
        this._resource.info.sampleRate,
      ),
      this._resource.info.sampleRate,
    );
  }

  set playPosition(value: SampleUnit) {
    if (this._howler) {
      this._howler.seek(value.seconds);
    }
  }

  set playBackRate(value: number) {
    if (value > 0) {
      this._playbackRate = value;
    }
  }

  get playBackRate(): number {
    return this._playbackRate;
  }

  override prepare(options: AudioMechanismPrepareOptions): Observable<{
    progress: number;
  }> {
    return concat(
      super.prepare(options),
      this.prepareAudioChannel(options).pipe(
        map(({ decodeProgress }) => {
          if (decodeProgress === 1) {
            this.prepareAudioPlayback({
              ...options,
              url: URL.createObjectURL(
                new File(
                  [this._resource!.arraybuffer!],
                  this._resource!.info.fullname,
                  {
                    type: this._resource!.info.type,
                  },
                ),
              ),
            });
          }
          return {
            progress: decodeProgress,
          };
        }),
      ),
    );
  }

  private prepareAudioPlayback({ url }: AudioMechanismPrepareOptions) {
    if (!url) {
      throw new Error(`HTMLAudioMechanism needs an url to the audio file`);
    }

    this._howler = new Howl({
      src: url,
      sprite: {
        test: [0, 5000],
      },
      html5: true,
      autoplay: false,
      rate: 1,
      mute: false,
      loop: false,
    });

    this.initAudioContext();
  }

  private prepareAudioChannel({
    filename,
    buffer,
    type,
    url,
  }: AudioMechanismPrepareOptions) {
    this._channel = undefined;
    const subj = new Subject<{
      decodeProgress: number;
    }>();

    const audioformat: AudioFormat | undefined = AudioManager.getFileFormat(
      filename.substring(filename.lastIndexOf('.')),
      this.audioFormats,
    );

    if (!buffer) {
      subj.error(`buffer is undefined`);
    } else {
      if (audioformat) {
        audioformat
          .init(filename, type, buffer)
          .then(() => {
            // audio format contains required information

            let audioInfo = getAudioInfo(audioformat, filename, type, buffer);
            const bufferLength = buffer.byteLength;

            audioInfo = new AudioInfo(
              filename,
              type,
              bufferLength,
              audioformat.sampleRate,
              audioformat.duration.samples,
              audioformat.channels,
              audioInfo.bitrate,
            );

            audioInfo.file = new File([buffer], filename, {
              type,
            });

            this.playPosition = new SampleUnit(0, audioInfo.sampleRate);
            this._resource = new AudioResource(
              filename,
              SourceType.ArrayBuffer,
              audioInfo,
              buffer,
              bufferLength,
              url,
            );

            this.afterDecoded.next(this._resource!);

            if (audioformat.decoder === 'octra') {
              this.decodeAudioWithOctraDecoder(subj);
            } else if (audioformat.decoder === 'web-audio') {
              this.decodeAudioWithWebAPIDecoder(subj);
            }
          })
          .catch((e) => {
            subj.error(e.message);
          });
      } else {
        subj.error(`Audio format is not supported.`);
      }
    }

    return subj;
  }

  private decodeAudioWithOctraDecoder(
    subj: Subject<{
      decodeProgress: number;
    }>,
  ) {
    try {
      if (!this._resource) {
        subj.error('Missing resource');
        return;
      }

      this.statistics.decoding.started = Date.now();
      const subscr = this.decodeAudio(this._resource!).subscribe({
        next: (statusItem) => {
          if (statusItem.progress === 1) {
            this.statistics.decoding.duration =
              Date.now() - this.statistics.decoding.started;

            this.changeStatus(PlayBackStatus.INITIALIZED);

            setTimeout(() => {
              subj.next({
                decodeProgress: 1,
              });
              subj.complete();
            }, 0);
          } else {
            subj.next({
              decodeProgress: statusItem.progress,
            });
          }
        },
        error: (error) => {
          console.error(error);
          subscr.unsubscribe();
        },
        complete: () => {
          subscr.unsubscribe();
        },
      });
    } catch (err: any) {
      subj.error(err.message);
    }
  }

  private decodeAudioWithWebAPIDecoder(
    subj: Subject<{
      decodeProgress: number;
    }>,
  ) {
    try {
      if (!this._resource) {
        subj.error('Missing resource');
        return;
      }

      this.statistics.decoding.started = Date.now();
      this.initAudioContext();
      this._audioContext!.decodeAudioData(this._resource.arraybuffer?.slice(0)!)
        .then((audioBuffer) => {
          const info = this._resource?.info!;

          info.audioBufferInfo = {
            sampleRate: audioBuffer.sampleRate,
            samples: audioBuffer.getChannelData(0).length,
          };

          if (['.mp3', '.m4a'].includes(info.extension)) {
            // fix number of samples. web value by web audio api is more exact.
            info.duration = new SampleUnit(
              Math.ceil(audioBuffer.duration * info.sampleRate),
              info.sampleRate,
            );
          }

          this._channel = audioBuffer.getChannelData(0);
          this.onChannelDataChange.next();
          this.onChannelDataChange.complete();
          this.statistics.decoding.duration =
            Date.now() - this.statistics.decoding.started;
          this._channelDataFactor =
            this._resource?.info.sampleRate! /
            (this._resource?.info.audioBufferInfo!.sampleRate ??
              this._resource?.info.sampleRate!);

          this.changeStatus(PlayBackStatus.INITIALIZED);

          setTimeout(() => {
            subj.next({
              decodeProgress: 1,
            });
            subj.complete();
          }, 0);
        })
        .catch((e) => {
          subj.error(e);
        });
    } catch (e) {}
  }

  override decodeAudio(resource: AudioResource) {
    const result = new Subject<{ progress: number }>();

    const format = new WavFormat();
    format.init(resource.info.name, resource.info.type, resource.arraybuffer!);
    this.decoder = new AudioDecoder(
      format,
      resource.info,
      resource.arraybuffer!,
    );

    const subj = this.decoder.onChannelDataCalculate.subscribe({
      next: (status) => {
        if (status.progress === 1 && status.result !== undefined) {
          this.decoder!.destroy();
          this._channel = status.result;
          this._channelDataFactor = this.decoder!.channelDataFactor;
          this._resource!.info.audioBufferInfo = {
            sampleRate:
              this._resource!.info.sampleRate / this._channelDataFactor,
            samples: status.result.length,
          };
          this.onChannelDataChange.next();
          this.onChannelDataChange.complete();

          subj.unsubscribe();
        }

        result.next({ progress: status.progress });
        if (status.progress === 1 && status.result !== undefined) {
          result.complete();
        }
      },
      error: (error) => {
        this.onChannelDataChange.error(error);
        result.error(error);
      },
    });

    this.decoder.started = Date.now();
    this.decoder
      .getChunkedChannelData(
        new SampleUnit(0, resource.info.sampleRate),
        new SampleUnit(
          Math.min(
            resource.info.sampleRate * 60, // chunk of 1 minute
            resource.info.duration.samples,
          ),
          resource.info.sampleRate,
        ),
      )
      .catch((error) => {
        console.error(error);
      });

    return result;
  }

  override async play(
    audioSelection: AudioSelection,
    volume: number,
    playbackRate: number,
    playOnHover: boolean,
    onPlaying: () => void,
    onEnd: () => void,
    onError: () => void,
  ) {
    await super.play(
      audioSelection,
      volume,
      playbackRate,
      playOnHover,
      onPlaying,
      onEnd,
      onError,
    );

    if (!this._howler) {
      throw new Error(`Howler not initialized`);
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    this._howler.on('play', this.initPlayback);
    this._howler!.on('pause', this.onPause);
    this._howler!.on('end', () => {
      onEnd();
      this.onEnd();
    });
    this._howler.on('playerror', () => {
      onError();
      this.runAllCallbacksOnEnd();
    });

    // this.playPosition = audioSelection.start!.clone();

    console.log(
      `play at ${this._howler.seek()} (audioSelection: ${audioSelection.start!.clone().seconds})`,
    );
    this._howler.play('test');
  }

  private initPlayback = () => {
    if (!this._howler) {
      throw new Error(`Howler not initialized`);
    }
    if (!this.audioSelection) {
      throw new Error(`AudioSelection not initialized`);
    }
    if (!this._playbackRate) {
      throw new Error(`PlaybackRate not initialized`);
    }

    this.changeStatus(PlayBackStatus.PLAYING);
  };

  override initializeSource() {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    if (!this._howler) {
      throw new Error(`Howler not initialized`);
    }
  }

  private removeEventListeners() {
    this._howler?.off('ended');
    this._howler?.off('pause');
    this._howler?.off('error');
    this._howler?.off('playing');
  }

  private runAllCallbacksOnEnd = () => {
    for (const callBacksAfterEndedElement of this.callBacksAfterEnded) {
      callBacksAfterEndedElement();
    }
    this.callBacksAfterEnded = [];
  };

  private onPlaybackFailed = (error: any) => {
    console.error(error);
  };

  private onPause = () => {
    this.changeStatus(PlayBackStatus.PAUSED);
    this.runAllCallbacksOnEnd();
  };

  private onStop = () => {
    this.changeStatus(PlayBackStatus.STOPPED);
    this.runAllCallbacksOnEnd();
  };

  private onEnd = () => {
    if (this._state === PlayBackStatus.PLAYING) {
      // audio ended normally
      this.changeStatus(PlayBackStatus.ENDED);
    }

    this.runAllCallbacksOnEnd();
  };

  override stop(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this._howler) {
        reject(new Error('Missing Howler instance.'));
        return;
      }
      if (this._state === 'PLAYING') {
        this.callBacksAfterEnded.push(() => {
          resolve();
        });
        this._howler.stop();
      } else {
        // ignore
        resolve();
      }
    });
  }

  override pause(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._state === 'PLAYING') {
        this._howler?.pause();
        this.callBacksAfterEnded.push(() => {
          resolve();
        });
        console.log(`Pause at ${this.playPosition?.seconds}`);
      } else {
        reject('cant pause because not playing');
      }
    });
  }

  /**
   * stops the decoding process.
   */
  public override stopDecoding() {
    if (this.decoder) {
      this.decoder.requeststopDecoding();
    }
  }
}
