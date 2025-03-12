import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { SubscriptionManager } from '@octra/utilities';
import { map, Observable, Subject, Subscription, timer } from 'rxjs';
import { AudioFormat } from './AudioFormats';
import { normalizeMimeType } from './audio-info';
import { AudioMechanism } from './audio-mechanism';
import { AudioResource } from './audio-resource';
import { HtmlAudioMechanism } from './html-audio-mechanism';

/**
 * AudioManager controls the audio file and all of its chunk. Each audio file should have exactly one manager. The AudioManager uses HTML Audio for playback.
 */
export class AudioManager {
  get audioMechanism(): AudioMechanism | undefined {
    return this._audioMechanism;
  }

  get channelDataFactor() {
    return this._audioMechanism?.channelDataFactor!;
  }

  public get sampleRate(): number {
    return this.resource.info.sampleRate;
  }

  get isPlaying(): boolean {
    return this._audioMechanism?.state === PlayBackStatus.PLAYING;
  }

  get resource(): AudioResource {
    return this._audioMechanism.resource!;
  }

  get state(): PlayBackStatus {
    return this._audioMechanism!.state;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  get playPosition(): SampleUnit {
    return this._audioMechanism?.playPosition!;
  }

  set playPosition(value: SampleUnit) {
    if (this._audioMechanism) {
      this._audioMechanism.playPosition = value;
    }
  }

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  get statechange(): Subject<PlayBackStatus> {
    return this._audioMechanism.statechange;
  }

  get channel(): Float32Array | undefined {
    return this._audioMechanism?.channel;
  }

  get onChannelDataChange() {
    return this._audioMechanism!.onChannelDataChange;
  }

  private static counter = 0;

  private subscrManager: SubscriptionManager<Subscription>;

  private _id: number;
  public time = {
    start: 0,
    end: 0,
  };
  private _audioMechanism: AudioMechanism;

  // variables needed for initializing audio
  private chunks: AudioChunk[] = [];
  private _mainchunk!: AudioChunk;
  private _playOnHover = false;
  private _gainNode?: GainNode;

  /**
   * initializes audio manager
   * @param audioMechanism
   */
  constructor(audioMechanism: AudioMechanism) {
    this._id = ++AudioManager.counter;
    this._audioMechanism = audioMechanism;
    this.subscrManager = new SubscriptionManager();
  }

  /**
   * returns the FileFormat instance relative of the file extension or undefined if not found.
   * @param extension file extension
   * @param audioformats list of supported audio formats
   */
  public static getFileFormat(
    extension: string,
    audioformats: AudioFormat[],
  ): AudioFormat | undefined {
    return audioformats.find((a) => {
      return (
        a.supportedFormats.findIndex((a) => a.extension === extension) > -1
      );
    });
  }

  /**
   * creates a new audio manager and reports the progress using an observable. The initialization includes audio decoding.
   * @param filename
   * @param type
   * @param buffer
   * @param url
   * @param audioMechanism
   */
  public static create = (
    filename: string,
    type: string,
    buffer: ArrayBuffer,
    url?: string,
    audioMechanism: AudioMechanism = new HtmlAudioMechanism(),
  ): Observable<{
    audioManager: AudioManager;
    progress: number;
  }> => {
    type = normalizeMimeType(type);
    // get result;
    const result = new AudioManager(audioMechanism);
    return result
      .audioMechanism!.prepare({
        filename,
        type,
        buffer,
        url,
      })
      .pipe(
        map<
          {
            progress: number;
          },
          {
            audioManager: AudioManager;
            progress: number;
          }
        >(({ progress }) => {
          if (progress === 1) {
            // set duration is very important
            const selection = new AudioSelection(
              result.createSampleUnit(0),
              result.resource.info.duration.clone(),
            );
            result._mainchunk = new AudioChunk(selection, result);
          }

          return {
            progress,
            audioManager: result,
          };
        }),
      );
  };

  /**
   * checks if there is an audio format that matches with the extension of the audio file.
   * @param filename
   * @param audioFormats
   */
  public static isValidAudioFileName(
    filename: string,
    audioFormats: AudioFormat[],
  ): boolean {
    return (
      AudioManager.getFileFormat(
        filename.substring(filename.lastIndexOf('.')),
        audioFormats,
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
   * starts audio playback using a given selection.
   * @param audioSelection
   * @param volume
   * @param playbackRate
   * @param playOnHover
   */
  public async startPlayback(
    audioSelection: AudioSelection,
    volume: number,
    playbackRate: number,
    playOnHover = false,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this._audioMechanism) {
        reject(new Error(`Missing AudioMechanism`));
        return;
      }

      //make sur selection is not changed
      audioSelection = audioSelection.clone();

      this._audioMechanism.play(
        audioSelection,
        volume,
        playbackRate,
        playOnHover,
        () => {},
        () => {
          this.subscrManager.add(
            timer(0).subscribe(() => {
              resolve();
            }),
          );
        },
        () => {
          reject();
        },
      );
    });
  }

  /**
   * stops the audio playback.
   */
  public async stopPlayback() {
    await this._audioMechanism?.stop();
  }

  /**
   * pauses the audio playback
   */
  public async pausePlayback() {
    await this.audioMechanism?.pause();
  }

  stopDecoding() {
    this._audioMechanism.stopDecoding();
  }

  /**
   * creates a new audio chunk entry from a given selection and adds it to the list of chunks.
   * @param time
   * @param selection
   */
  public createNewAudioChunk(
    time: AudioSelection,
    selection?: AudioSelection,
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
    this.audioMechanism?.destroy(disconnect);
  }

  /**
   * creates a new SampleUnit
   * @param sample
   */
  public createSampleUnit(sample: number): SampleUnit {
    return new SampleUnit(sample, this.sampleRate);
  }
}

/***
 * AUDIOCHUNK begins here
 */

export class AudioChunk {
  private static _counter = 0;
  public statuschange: Subject<PlayBackStatus> = new Subject<PlayBackStatus>();
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
        this.time.end!.clone(),
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

  get playbackRate(): number {
    return this._audioManger.audioMechanism!.playBackRate;
  }

  set playbackRate(value: number) {
    this._audioManger.audioMechanism!.playBackRate = value;
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
    selection?: AudioSelection,
  ) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error(
        'AudioChunk constructor needs two correct AudioTime objects',
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
                timer(0).subscribe(() => {
                  resolve2();
                }),
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
              this.time.end.clone(),
            );
          }

          if (this._selection.start.equals(this._selection.end)) {
            this.startpos = this._selection.start.clone() as SampleUnit;
          }

          this._lastplayedpos = this._playposition.clone();

          const id = this.subscrManager.add(
            this.audioManager.statechange.subscribe({
              next: (state: PlayBackStatus) => {
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
                        }),
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
              error: (error) => {
                console.error(error);
              },
            }),
          );

          this._audioManger
            .startPlayback(
              this.selection,
              this._volume,
              this.playbackRate,
              playOnHover,
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
  public stopPlayback: () => Promise<void> = async () => {
    if (this._audioManger.isPlaying) {
      await this._audioManger.stopPlayback();
      this.afterPlaybackStopped();
    } else {
      this.afterPlaybackStopped();
    }
  };

  public async pausePlayback() {
    await this._audioManger.pausePlayback();
    if (
      this.audioManager.state !== this.status &&
      this.status === PlayBackStatus.PLAYING
    ) {
      throw new Error(
        `audioManager and chunk have different states: a:${this.audioManager.state}, c:${this.status}`,
      );
    }
    this.afterPlaybackPaused();
  }

  public stepBackward(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!(this.lastplayedpos === undefined || this.lastplayedpos === null)) {
        new Promise<void>((resolve2) => {
          if (this._status === PlayBackStatus.PLAYING) {
            const subscr = this.statuschange.subscribe({
              next: (status) => {
                if (status === PlayBackStatus.PAUSED) {
                  resolve2();
                }
                subscr.unsubscribe();
              },
              error: () => {
                resolve2();
              },
            });
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
          Math.round(backSec * this._audioManger.sampleRate),
      );
      const backSample = new SampleUnit(
        backSamples,
        this._audioManger.sampleRate,
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
      this.statuschange.next(state);
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
