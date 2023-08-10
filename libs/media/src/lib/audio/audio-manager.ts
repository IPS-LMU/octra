import { EventEmitter } from '@angular/core';
import { AudioDecoder } from './audio-decoder';
import { AudioInfo } from './audio-info';
import { AudioRessource } from './audio-ressource';
import { AudioFormat, WavFormat } from './AudioFormats';
import { SubscriptionManager } from '@octra/utilities';
import { SampleUnit } from './audio-time';
import { PlayBackStatus, SourceType } from '../types';
import { AudioSelection } from './audio-selection';
import { Subject, Subscription, timer } from 'rxjs';

declare let window: any;

/**
 * AudioManager controls the audio file and all of its chunk. Each audio file should have exactly one manager. The AudioManager uses HTML Audio for playback.
 */
export class AudioManager {
  public static decoder: AudioDecoder;
  public time = {
    start: 0,
    end: 0,
  };
  public onChannelDataChange = new Subject<void>();
  public audioBuffered = new Subject<{
    sampleStart: SampleUnit;
    sampleDur: SampleUnit;
  }>();

  // events
  public afterDecoded: EventEmitter<AudioRessource> =
    new EventEmitter<AudioRessource>();
  public afterLoaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackStatus> =
    new EventEmitter<PlayBackStatus>();
  public missingPermission = new EventEmitter<void>();

  get audio(): HTMLAudioElement {
    return this._audio;
  }

  public get sampleRate(): number {
    return this.resource.info.sampleRate;
  }

  get isPlaying(): boolean {
    return this._state === PlayBackStatus.PLAYING;
  }

  get resource(): AudioRessource {
    return this._resource;
  }

  get state(): PlayBackStatus {
    return this._state;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  get playPosition(): SampleUnit {
    return new SampleUnit(
      SampleUnit.calculateSamples(this._audio.currentTime, this.sampleRate),
      this.sampleRate
    );
  }

  set playPosition(value: SampleUnit) {
    this._audio.currentTime = value.seconds;
    this._playPosition = value.clone();
  }

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  get audioContext(): AudioContext | undefined {
    return this._audioContext;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  private static counter = 0;
  private subscrManager: SubscriptionManager<Subscription>;

  private _id: number;
  private _stepBackward = false;
  private _statusRequest: PlayBackStatus = PlayBackStatus.INITIALIZED;
  private _playbackEndChecker?: Subscription;
  private readonly _audio: HTMLAudioElement;

  // variables needed for initializing audio
  private _source?: AudioBufferSourceNode | MediaElementAudioSourceNode;
  private chunks: AudioChunk[] = [];

  private _resource!: AudioRessource;
  private _state!: PlayBackStatus;
  private _mainchunk!: AudioChunk;
  private _playPosition!: SampleUnit;
  private _playOnHover = false;

  get channel(): Float32Array | undefined {
    return this._channel;
  }

  get channelDataFactor(): number {
    return this._channelDataFactor;
  }

  private _audioContext?: AudioContext;

  private _gainNode?: GainNode;

  // only the Audiomanager may have the channel array
  private _channel: Float32Array | undefined;
  private _channelDataFactor = -1;

  private callBacksAfterEnded: (() => void)[] = [];

  /**
   * initializes audio manager
   * @param audioInfo important info about the audio file linked to this manager
   * @param sampleRate the saample rate of the audio file
   */
  constructor(audioInfo: AudioInfo, sampleRate: number) {
    this._id = ++AudioManager.counter;
    this._audio = new Audio();
    this.subscrManager = new SubscriptionManager();
    this._audio.autoplay = false;
    this._audio.defaultPlaybackRate = 1;
    this._audio.defaultMuted = false;
    this._audio.loop = false;

    if (!(audioInfo === undefined || audioInfo === null)) {
      // Fix up for prefixing
      this.initAudioContext();

      if (this._audioContext) {
        this._playPosition = new SampleUnit(0, sampleRate);
        this._state = PlayBackStatus.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
  }

  /**
   * returns the FileFormat instance relative of the file extension or undefined if not found.
   * @param extension file extension
   * @param audioformats list of supported audio formats
   */
  public static getFileFormat(
    extension: string,
    audioformats: AudioFormat[]
  ): AudioFormat | undefined {
    return audioformats.find((a) => {
      return a.extension === extension;
    });
  }

  /**
   * decodes the audio file using the selected audio format and web workers
   * @param filename
   * @param type
   * @param buffer
   * @param audioFormats
   */
  public static decodeAudio = (
    filename: string,
    type: string,
    buffer: ArrayBuffer,
    audioFormats: AudioFormat[]
  ): Subject<{
    audioManager?: AudioManager;
    decodeProgress: number;
  }> => {
    const subj = new Subject<{
      audioManager?: AudioManager;
      decodeProgress: number;
    }>();

    const audioformat: AudioFormat | undefined = AudioManager.getFileFormat(
      filename.substring(filename.lastIndexOf('.')),
      audioFormats
    );

    if (audioformat !== undefined) {
      audioformat.init(filename, buffer);

      let audioinfo: AudioInfo | undefined = undefined;

      try {
        audioinfo = audioformat.getAudioInfo(filename, type, buffer);
      } catch (err: any) {
        subj.error(err!.message);
      }

      if (audioinfo) {
        const bufferLength = buffer.byteLength;
        // decode first 10 seconds
        const sampleDur = new SampleUnit(
          Math.min(audioformat.sampleRate * 30, audioformat.duration),
          audioformat.sampleRate
        );

        // get result;
        const result = new AudioManager(audioinfo, audioformat.sampleRate);

        audioinfo = new AudioInfo(
          filename,
          type,
          bufferLength,
          audioformat.sampleRate,
          (audioformat.sampleRate * audioformat.duration) /
            audioformat.sampleRate,
          audioformat.channels,
          audioinfo.bitrate
        );

        audioinfo.file = new File([buffer], filename, { type: 'audio/wav' });
        result.setRessource(
          new AudioRessource(
            filename,
            SourceType.ArrayBuffer,
            audioinfo,
            buffer,
            bufferLength
          )
        );

        // set duration is very important

        const selection = new AudioSelection(
          result.createSampleUnit(0),
          audioinfo.duration.clone()
        );

        result._mainchunk = new AudioChunk(selection, result);

        result.afterDecoded.emit(result.resource);
        result.prepareAudioPlayBack();

        result.time.start = Date.now();
        const subscr = result
          .updateChannelData(result.createSampleUnit(0), sampleDur)
          .subscribe(
            (statusItem) => {
              if (statusItem.progress === 1) {
                setTimeout(() => {
                  subj.next({
                    audioManager: result,
                    decodeProgress: 1,
                  });
                  subj.complete();
                }, 0);
              } else {
                subj.next({
                  audioManager: undefined,
                  decodeProgress: statusItem.progress,
                });
              }
            },
            (error) => {
              console.error(error);
              subscr.unsubscribe();
            },
            () => {
              subscr.unsubscribe();
            }
          );
      }
    } else {
      subj.error(`audio format not supported`);
    }

    return subj;
  };

  /**
   * checks if there is an audio format that matches with the extension of the audio file.
   * @param filename
   * @param audioFormats
   */
  public static isValidAudioFileName(
    filename: string,
    audioFormats: AudioFormat[]
  ): boolean {
    return (
      AudioManager.getFileFormat(
        filename.substring(filename.lastIndexOf('.')),
        audioFormats
      ) !== undefined
    );
  }

  /**
   * returns the number of data parts
   * @param fileSize
   */
  public static getNumberOfDataParts(fileSize: number): number {
    const mb = fileSize / 1024 / 1024;

    if (mb > 50) {
      // make chunks of 50 mb
      return Math.ceil(mb / 50);
    }

    return 1;
  }

  /**
   * stops the decoding process.
   */
  public static stopDecoding() {
    if (
      !(AudioManager.decoder === undefined || AudioManager.decoder === null)
    ) {
      AudioManager.decoder.requeststopDecoding();
    }
  }

  /**
   * starts audio playback using a given selection.
   * @param audioSelection
   * @param volume
   * @param playbackRate
   * @param playOnHover
   */
  public startPlayback(
    audioSelection: AudioSelection,
    volume: number,
    playbackRate: number,
    playOnHover = false
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      //make sur selection is not changed
      audioSelection = audioSelection.clone();
      if (this._audioContext === undefined) {
        this.initAudioContext();
      }

      this._audioContext
        ?.resume()
        .then(() => {
          if (this._gainNode === undefined) {
            this._gainNode = this.audioContext!.createGain();
          }
          // create an audio context and hook up the video element as the source
          if (this._source === undefined) {
            this._source = this._audioContext!.createMediaElementSource(
              this._audio
            );
          }
          this.changeState(PlayBackStatus.STARTED);

          // Firefox issue causes playBackRate working only for volume up to 1

          // create a gain node
          this._gainNode.gain.value = volume;
          this._source.connect(this._gainNode);

          // connect the gain node to an output destination
          this._gainNode.connect(this._audioContext!.destination);

          this._audio.playbackRate = playbackRate;
          this._audio.onerror = reject;

          this._playOnHover = playOnHover;
          this._stepBackward = false;
          this.playPosition = audioSelection.start!.clone();
          this._statusRequest = PlayBackStatus.PLAYING;
          this.changeState(PlayBackStatus.PLAYING);

          this._audio.addEventListener('pause', this.onPlayBackChanged);
          this._audio.addEventListener('ended', this.onPlayBackChanged);
          this._audio.addEventListener('error', this.onPlaybackFailed);

          this._audio
            .play()
            .then(() => {
              const time = Math.round(
                audioSelection.duration.unix / playbackRate
              );
              this._playbackEndChecker = timer(
                Math.round(audioSelection.duration.unix / playbackRate)
              ).subscribe(() => {
                this.endPlayBack();
                this.subscrManager.add(
                  timer(100).subscribe(() => {
                    resolve();
                  })
                );
              });
            })
            .catch((error) => {
              this._playbackEndChecker!.unsubscribe();
              if (!this.playOnHover) {
                if (error.name && error.name === 'NotAllowedError') {
                  // no permission
                  this.missingPermission.emit();
                }

                this.statechange.error(new Error(error));
                reject(error);
              } else {
                resolve();
              }
            });
        })
        .catch((error) => {
          this._playbackEndChecker!.unsubscribe();
          this.statechange.error(new Error(error));
          reject(error);
        });
    });
  }

  /**
   * stops the audio playback.
   */
  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.isPlaying) {
        this._statusRequest = PlayBackStatus.STOPPED;
        this.callBacksAfterEnded.push(() => {
          resolve();
        });
        this._audio.pause();
      } else {
        // ignore
        resolve();
      }
    });
  }

  /**
   * pauses the audio playback
   */
  public pausePlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this._statusRequest = PlayBackStatus.PAUSED;
        this.callBacksAfterEnded.push(() => {
          resolve();
        });
        this._audio.pause();
      } else {
        reject('cant pause because not playing');
      }
    });
  }

  /**
   * prepares the audio manager for play back
   */
  public prepareAudioPlayBack() {
    this._audio.src = URL.createObjectURL(
      new File([this._resource.arraybuffer!], this._resource.info.fullname)
    );

    this._channel = undefined;
    this._state = PlayBackStatus.INITIALIZED;
    this.afterLoaded.emit({ status: 'success', error: '' });
  }

  /**
   * sets the ressource. Can be set only once.
   * @param ressource the audio ressource
   */
  public setRessource(ressource: AudioRessource) {
    if (this._resource === undefined) {
      this._resource = ressource;
    }
  }

  /**
   * creates a new audio chunk entry from a given selection and adds it to the list of chunks.
   * @param time
   * @param selection
   */
  public createNewAudioChunk(
    time: AudioSelection,
    selection?: AudioSelection
  ): AudioChunk | undefined {
    if (
      time.start!.samples + time.duration.samples <=
      this.resource.info.duration.samples
    ) {
      const chunk = new AudioChunk(time, this, selection);
      this.addChunk(chunk);
      return chunk;
    }
    return undefined;
  }

  /**
   * adds an audio chunk to the list of chunks.
   * @param chunk
   */
  public addChunk(chunk: AudioChunk) {
    if (this.chunks.filter((a) => a.id === chunk.id).length === 0) {
      this.chunks.push(chunk);
    }
  }

  public removeChunk(chunk: AudioChunk) {
    // remove by id
    this.chunks = this.chunks.filter((a) => {
      return a.id !== chunk.id;
    });
  }

  /**
   * destroys the audio manager
   * @param disconnect
   */
  public async destroy(disconnect = true) {
    if (!(this._audioContext === undefined || this._audioContext === null)) {
      if (disconnect) {
        await this._audioContext.close();
      }
    }
    this.subscrManager.destroy();
    return;
  }

  /**
   * creates a new SampleUnit
   * @param sample
   */
  public createSampleUnit(sample: number): SampleUnit {
    return new SampleUnit(sample, this.sampleRate);
  }

  /**
   * updates the channel data of a given interval.
   * @param sampleStart
   * @param sampleDur
   */
  public updateChannelData(
    sampleStart: SampleUnit,
    sampleDur: SampleUnit
  ): Subject<{
    progress: number;
  }> {
    const result = new Subject<{ progress: number }>();

    const format = new WavFormat();
    format.init(this._resource.info.name, this._resource.arraybuffer!);
    AudioManager.decoder = new AudioDecoder(
      format,
      this._resource.info,
      this._resource.arraybuffer!
    );
    const subj = AudioManager.decoder.onChannelDataCalculate.subscribe(
      (status) => {
        if (status.progress === 1 && status.result !== undefined) {
          AudioManager.decoder.destroy();
          this._channel = status.result;
          this._channelDataFactor = AudioManager.decoder.channelDataFactor;
          this.onChannelDataChange.next();
          this.onChannelDataChange.complete();

          subj.unsubscribe();
        }

        result.next({ progress: status.progress });
        if (status.progress === 1 && status.result !== undefined) {
          result.complete();
        }
      },
      (error) => {
        this.onChannelDataChange.error(error);
        result.error(error);
      }
    );
    AudioManager.decoder.started = Date.now();
    AudioManager.decoder
      .getChunkedChannelData(sampleStart, sampleDur)
      .catch((error) => {
        console.error(error);
      });

    return result;
  }

  /**
   * initializes the audio context
   * @private
   */
  private initAudioContext() {
    const audioContext =
      window.AudioContext || // Default
      window.webkitAudioContext || // Safari and old versions of Chrome
      window.mozAudioContext ||
      false;
    if (audioContext) {
      if (this._audioContext === undefined || this._audioContext === null) {
        // reuse old audiocontext
        this._audioContext = new audioContext();
      }
    }
  }

  private changeState(newstate: PlayBackStatus) {
    this._state = newstate;
    this.statechange.emit(newstate);
  }

  private removeEventListeners() {
    this._audio.removeEventListener('ended', this.onPlayBackChanged);
    this._audio.removeEventListener('pause', this.onPlayBackChanged);
    this._gainNode?.disconnect();
    this._source?.disconnect();
    this._playbackEndChecker?.unsubscribe();
  }

  private onPlayBackChanged = () => {
    switch (this._statusRequest) {
      case PlayBackStatus.PAUSED:
        this.onPause();
        break;
      case PlayBackStatus.STOPPED:
        this.onStop();
        break;
      default:
        this.onEnded();
        break;
    }
    this.removeEventListeners();

    for (const callback of this.callBacksAfterEnded) {
      callback();
    }
    this.callBacksAfterEnded = [];
  };

  private onPlaybackFailed = (error: any) => {
    console.error(error);
  };

  private onPause = () => {
    this.changeState(PlayBackStatus.PAUSED);
  };

  private onStop = () => {
    this.changeState(PlayBackStatus.STOPPED);
  };

  private onEnded = () => {
    if (this._state === PlayBackStatus.PLAYING) {
      // audio ended normally
      this.changeState(PlayBackStatus.ENDED);
    }

    this.gainNode.disconnect();
  };

  private endPlayBack() {
    this._statusRequest = PlayBackStatus.ENDED;
    this._audio.pause();
  }
}

/***
 * AUDIOCHUNK begins here
 */

export class AudioChunk {
  private static _counter = 0;
  public statuschange: EventEmitter<PlayBackStatus> =
    new EventEmitter<PlayBackStatus>();
  private readonly _audioManger: AudioManager;
  private subscrManager = new SubscriptionManager<Subscription>();
  private _playposition: SampleUnit;

  get audioManager(): AudioManager {
    return this._audioManger;
  }

  get sampleRate(): number {
    return this._audioManger.sampleRate;
  }

  public get startpos(): SampleUnit {
    return this._selection.start!;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   */
  public set startpos(value: SampleUnit) {
    if (value === undefined || value === null) {
      throw new Error('start pos is undefined!');
    }
    if (this.selection === undefined || this.selection === null) {
      this.selection = new AudioSelection(
        value.clone(),
        this.time.end!.clone()
      );
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end!.clone();
    }
    this._playposition = this.selection.start!.clone() as SampleUnit;
  }

  get relativePlayposition(): SampleUnit | undefined {
    let result;

    if (this._status === PlayBackStatus.PLAYING) {
      result = this.audioManager.playPosition.sub(this._time.start);
    } else {
      result = this._playposition.sub(this._time.start);
    }

    if (result.samples < 0) {
      console.error(`samples of relativePlayposition is less than 0!`);
    }

    return result;
  }

  set relativePlayposition(value: SampleUnit | undefined) {
    if (
      value !== undefined &&
      this._time.end.samples >= value.samples &&
      value.samples > -1
    ) {
      this._playposition = this._time.start.add(value);
    } else {
      console.error(`invalid value for relative sample unit!`);
    }
  }

  get absolutePlayposition(): SampleUnit {
    if (this.status === PlayBackStatus.PLAYING && this._audioManger.isPlaying) {
      return this._audioManger.playPosition;
    }
    return this._playposition;
  }

  set absolutePlayposition(value: SampleUnit) {
    if (
      value !== undefined &&
      value.samples >= this._time.start.samples &&
      value.samples <= this._time.end.samples
    ) {
      this._playposition = value;
    } else {
      console.error(`incorrect value for absolute playback position!`);
    }
  }

  public get isPlaybackEnded(): boolean {
    return this._status === PlayBackStatus.ENDED;
  }

  public get isPlaybackStarted(): boolean {
    return this._status === PlayBackStatus.STARTED;
  }

  public get isPlaying(): boolean {
    return this._status === PlayBackStatus.PLAYING;
  }

  public get isPlayBackStopped(): boolean {
    return this._status === PlayBackStatus.STOPPED;
  }

  private _selection!: AudioSelection;

  get selection(): AudioSelection {
    return this._selection;
  }

  set selection(value: AudioSelection) {
    this._selection = value;
  }

  private _time!: AudioSelection;

  get time(): AudioSelection {
    return this._time;
  }

  set time(value: AudioSelection) {
    this._time = value;
  }

  private readonly _id;

  get id() {
    return this._id;
  }

  private _status: PlayBackStatus = PlayBackStatus.PREPARE;

  get status(): PlayBackStatus {
    return this._status;
  }

  private _volume = 1;

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    if (this._audioManger.gainNode !== undefined) {
      this._audioManger.gainNode.gain.value = value;
    }
  }

  private _playbackRate = 1;

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    if (value > 0) {
      this._playbackRate = value;
      this._audioManger.audio.playbackRate = value;
    }
  }

  private _lastplayedpos!: SampleUnit;

  get lastplayedpos(): SampleUnit {
    return this._lastplayedpos;
  }

  private _replay = false;

  get replay(): boolean {
    return this._replay;
  }

  constructor(
    time: AudioSelection,
    audioManager: AudioManager,
    selection?: AudioSelection
  ) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error(
        'AudioChunk constructor needs two correct AudioTime objects'
      );
    }

    if (!(audioManager === undefined || audioManager === null)) {
      this._audioManger = audioManager;
      this._playposition = time.start.clone() as SampleUnit;
      this._status = PlayBackStatus.INITIALIZED;
    } else {
      throw new Error('AudioChunk needs an audiomanger reference');
    }

    if (!(selection === undefined || selection === null)) {
      this._selection = selection.clone();
    } else {
      this._selection = this._time.clone();
    }

    this._id = ++AudioChunk._counter;
  }

  public getChannelBuffer(selection: AudioSelection): Float32Array | undefined {
    if (selection) {
      return this.audioManager!.channel?.subarray(
        selection.start.samples,
        selection.end.samples
      );
    }

    return undefined;
  }

  public async startPlayback(playOnHover = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      new Promise<void>((resolve2, reject2) => {
        if (!this._audioManger.isPlaying) {
          resolve2();
        } else {
          this._audioManger
            .pausePlayback()
            .then(() => {
              this.subscrManager.add(
                timer(500).subscribe(() => {
                  resolve2();
                })
              );
            })
            .catch((error) => {
              reject2(error);
            });
        }
      })
        .then(() => {
          if (this._selection === undefined) {
            this.selection = new AudioSelection(
              this.time.start.clone(),
              this.time.end.clone()
            );
          }

          if (this._selection.start.equals(this._selection.end)) {
            this.startpos = this._selection.start.clone() as SampleUnit;
          }

          this._lastplayedpos = this._playposition.clone();

          const id = this.subscrManager.add(
            this.audioManager.statechange.subscribe(
              (state: PlayBackStatus) => {
                if (
                  state === PlayBackStatus.STOPPED ||
                  state === PlayBackStatus.PAUSED ||
                  state === PlayBackStatus.ENDED
                ) {
                  this.subscrManager.removeById(id);
                }

                if (state === PlayBackStatus.STOPPED) {
                  this._playposition = this.time.start.clone();
                }

                if (state === PlayBackStatus.ENDED) {
                  this.absolutePlayposition = this.selection.end.clone();
                  // reset to beginning of selection

                  if (this._playposition.seconds >= this.time.end.seconds) {
                    this.startpos = this.time.start.clone();
                  } else {
                    this._playposition = this.selection.start.clone();
                  }
                  if (this._replay) {
                    this.setState(state);
                    new Promise<void>((resolve2, reject2) => {
                      this.subscrManager.add(
                        timer(200).subscribe(() => {
                          this.startPlayback(playOnHover)
                            .then(() => {
                              resolve2();
                            })
                            .catch((error) => {
                              console.error(error);
                              reject2(error);
                            });
                        })
                      );
                    });
                  } else {
                    this.setState(state);
                    resolve();
                  }
                } else {
                  this.setState(state);
                  resolve();
                }
              },
              (error) => {
                console.error(error);
              }
            )
          );

          this._audioManger
            .startPlayback(
              this.selection,
              this._volume,
              this._playbackRate,
              playOnHover
            )
            .catch(reject);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  /**
   * stops the playback
   */
  public stopPlayback: () => Promise<void> = () => {
    return new Promise<void>((resolve) => {
      if (this._audioManger.isPlaying) {
        this._audioManger.stopPlayback().then(() => {
          this.afterPlaybackStopped();
          resolve();
        });
      } else {
        this.afterPlaybackStopped();
        resolve();
      }
    });
  };

  public pausePlayback() {
    return new Promise<void>((resolve, reject) => {
      this._audioManger
        .pausePlayback()
        .then(() => {
          if (
            this.audioManager.state !== this.status &&
            this.status === PlayBackStatus.PLAYING
          ) {
            reject(
              new Error(
                `audioManager and chunk have different states: a:${this.audioManager.state}, c:${this.status}`
              )
            );
          }
          this.afterPlaybackPaused();
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public stepBackward(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!(this.lastplayedpos === undefined || this.lastplayedpos === null)) {
        new Promise<void>((resolve2) => {
          if (this._status === PlayBackStatus.PLAYING) {
            const subscr = this.statuschange.subscribe(
              (status) => {
                if (status === PlayBackStatus.PAUSED) {
                  resolve2();
                }
                subscr.unsubscribe();
              },
              () => {
                resolve2();
              }
            );
            this.audioManager.pausePlayback().catch((error) => {
              console.error(error);
            });
          } else {
            resolve2();
          }
        }).then(() => {
          this.startpos = this.lastplayedpos.clone();
          this.startPlayback(false).then(resolve).catch(reject);
        });
      } else {
        reject('lastplayedpos is undefined');
      }
    });
  }

  public stepBackwardTime(backSec: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const backSamples = Math.max(
        0,
        this.absolutePlayposition.samples -
          Math.round(backSec * this._audioManger.sampleRate)
      );
      const backSample = new SampleUnit(
        backSamples,
        this._audioManger.sampleRate
      );

      new Promise<void>((resolve2) => {
        if (this._status === PlayBackStatus.PLAYING) {
          this.pausePlayback()
            .then(() => {
              resolve2();
            })
            .catch((error) => {
              console.error(error);
              resolve2();
            });
        } else {
          resolve2();
        }
      }).then(() => {
        this.startpos = backSample.clone();
        this.startPlayback(false).then(resolve).catch(reject);
      });
    });
  }

  public clone() {
    return new AudioChunk(this.time.clone(), this.audioManager, this.selection);
  }

  public destroy() {
    this.subscrManager.destroy();
  }

  public toggleReplay() {
    this._replay = !this._replay;
  }

  private setState(state: PlayBackStatus) {
    if (this._status !== state || state === PlayBackStatus.STOPPED) {
      this._status = state;
      this.statuschange.emit(state);
    }
  }

  private afterPlaybackStopped = () => {
    this.startpos = this.time.start!.clone() as SampleUnit;
    this._audioManger.playPosition = this.time.start!.clone();
  };

  private afterPlaybackPaused = () => {
    this.absolutePlayposition = this.audioManager.playPosition.clone();
    this.startpos = this.absolutePlayposition.clone();
  };
}
