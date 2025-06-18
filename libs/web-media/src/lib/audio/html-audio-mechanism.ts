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
  private onEndTriggered = false;
  private ignorePause = false;
  private url?: string;

  private audioFormats: AudioFormat[] = [
    new WavFormat(),
    new MusicMetadataFormat(),
  ];
  private decoder?: AudioDecoder;

  get playPosition(): SampleUnit | undefined {
    if (!this._howler || !this._resource?.info?.sampleRate) {
      return undefined;
    }

    if (
      this.audioSelection &&
      Number(this._howler.seek().toFixed(6)) >=
        Number(this.audioSelection!.end.seconds.toFixed(6)) &&
      !this.onEndTriggered
    ) {
      this.onEndTriggered = true;
      this.ignorePause = true;
      this._howler.pause();
      this.onEnd();
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
            this.url = URL.createObjectURL(
              new File(
                [this._resource!.arraybuffer!],
                this._resource!.info.fullname,
                {
                  type: this._resource!.info.type,
                },
              ),
            );
          }
          return {
            progress: decodeProgress,
          };
        }),
      ),
    );
  }

  private prepareAudioPlayback() {
    if (!this.url) {
      throw new Error(`HTMLAudioMechanism needs an url to the audio file`);
    }

    if (this._howler) {
      console.log('unload howler');
      this._howler.unload();
    }

    this._howler = new Howl({
      src: this.url,
      format: this._resource?.extension.replace('.', ''),
      html5: true,
      autoplay: false,
      rate: 1,
      mute: false,
      loop: false,
    });
    this._howler.load();
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
    console.log('a');
    this.onEndTriggered = false;
    this.ignorePause = false;
    this.removeEventListeners();

    await super.play(
      audioSelection,
      volume,
      playbackRate,
      playOnHover,
      onPlaying,
      onEnd,
      onError,
    );
    this.prepareAudioPlayback();
    console.log('b');

    if (!this._howler) {
      throw new Error(`Howler not initialized`);
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    this._howler!.on('play', this.onPlay);
    this._howler!.on('pause', this.onPause);
    this._howler!.on('seek', this.onSeek);
    this._howler!.on('stop', this.onStop);
    this._howler!.on('end', () => {
      onEnd();
      this.onEnd();
    });
    this._howler.on('playerror', () => {
      onError();
      this.removeEventListeners();
      this.runAllCallbacksOnEnd();
    });
    console.log('c');

    console.log(
      `play at ${this._howler.seek()} (audioSelection: ${audioSelection.start!.clone().seconds})`,
    );
    this._howler.once('play', () => {
      this.playPosition = audioSelection.start!.clone();
      console.log('e');
    });
    this._howler.play();
    console.log('f');
  }

  private initPlayback = () => {
    console.log('called play');
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
    this._howler?.off('end', this.onEnd);
    this._howler?.off('pause', this.onPause);
    this._howler?.off('play', this.onPlay);
    this._howler?.off('playerror');
    this._howler?.off('stop', this.onStop);
    this._howler?.off('seek', this.onSeek);
    console.log('removed EventListeners');
  }

  private runAllCallbacksOnEnd = () => {
    for (const callBacksAfterEndedElement of this.callBacksAfterEnded) {
      callBacksAfterEndedElement();
    }
    this.callBacksAfterEnded = [];
  };

  private onPlay = () => {
    console.log('called play');
    this.changeStatus(PlayBackStatus.PLAYING);
  };

  private onPause = () => {
    if (!this.ignorePause) {
      console.log('called pause');
      this.changeStatus(PlayBackStatus.PAUSED);
      this.removeEventListeners();
      this.runAllCallbacksOnEnd();
    }
  };

  private onSeek = () => {
    console.log('called seek');
  };

  private onStop = () => {
    console.log('stopped??');
    this.changeStatus(PlayBackStatus.STOPPED);
    this.removeEventListeners();
    this.runAllCallbacksOnEnd();
  };

  private onEnd = () => {
    if (this._state === PlayBackStatus.PLAYING) {
      // audio ended normally
      this.changeStatus(PlayBackStatus.ENDED);
    }

    this.removeEventListeners();
    this.runAllCallbacksOnEnd();
  };

  override stop(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log('appy stop??');
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
      console.log(`pause ${this._state}`);
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
