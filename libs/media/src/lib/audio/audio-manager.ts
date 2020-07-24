import {EventEmitter} from '@angular/core';
import {Subject, Subscription, timer} from 'rxjs'
import {AudioDecoder} from './audio-decoder';
import {AudioInfo} from './audio-info';
import {AudioRessource} from './audio-ressource';
import {AudioFormat, AudioSelection, PlayBackStatus, SampleUnit, SourceType, WavFormat} from './index';
import {isUnset, SubscriptionManager} from '@octra/utilities';

declare var window: any;

export class AudioManager {
  public static decoder: AudioDecoder;
  private static counter = 0;
  public zeit = {
    start: 0,
    end: 0
  };
  public onChannelDataChange = new Subject<void>();
  public audiobuffered = new Subject<{
    sampleStart: SampleUnit,
    sampleDur: SampleUnit
  }>();

  // events
  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackStatus> = new EventEmitter<PlayBackStatus>();
  public missingPermission = new EventEmitter<void>();

  private _id: number;
  private _stepBackward = false;
  private _statusRequest: PlayBackStatus = PlayBackStatus.INITIALIZED;
  private _playbackEndChecker: Subscription = null;
  private readonly _audio: HTMLAudioElement;

  // variables needed for initializing audio
  private _source: AudioBufferSourceNode | MediaElementAudioSourceNode = null;
  private chunks: AudioChunk[] = [];

  get audio(): HTMLAudioElement {
    return this._audio;
  }

  public get sampleRate(): number {
    return this.ressource.info.sampleRate;
  }

  get isPlaying(): boolean {
    return (this._state === PlayBackStatus.PLAYING);
  }

  private _ressource: AudioRessource;

  get ressource(): AudioRessource {
    return this._ressource;
  }

  private _state: PlayBackStatus;

  get state(): PlayBackStatus {
    return this._state;
  }

  private _mainchunk: AudioChunk;

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  private _playposition: SampleUnit;

  get playposition(): SampleUnit {
    return new SampleUnit(
      SampleUnit.calculateSamples(this._audio.currentTime, this.sampleRate),
      this.sampleRate
    );
  }

  set playposition(value: SampleUnit) {
    this._audio.currentTime = value.seconds;
    this._playposition = value.clone();
  }

  private _playOnHover = false;

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  private _lastUpdate: number;

  get lastUpdate(): number {
    return this._lastUpdate;
  }

  private _audioContext: AudioContext = null;

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  private _gainNode: GainNode = null;

  get gainNode(): any {
    return this._gainNode;
  }

  // only the Audiomanager may have the channel array
  private _channel: Float32Array;

  get channel(): Float32Array {
    return this._channel;
  }

  private _frameSize = 2048;

  get frameSize(): number {
    return this._frameSize;
  }

  private _bufferSize = 2048;

  get bufferSize(): number {
    return this._bufferSize;
  }

  private _channelDataFactor = -1;

  get channelDataFactor(): number {
    return this._channelDataFactor;
  }

  private callBacksAfterEnded: (() => void)[] = [];

  /**
   * initializes audio manager
   * @param audioinfo important info about the audio file linked to this manager
   * @param sampleRate the saample rate of the audio file
   */
  constructor(audioinfo: AudioInfo, sampleRate: number) {
    this._id = ++AudioManager.counter;
    this._audio = new Audio();
    this._audio.autoplay = false;
    this._audio.defaultPlaybackRate = 1;
    this._audio.defaultMuted = false;
    this._audio.loop = false;

    if (!(audioinfo === null || audioinfo === undefined)) {
      // Fix up for prefixing
      this.initAudioContext();

      if (this._audioContext) {
        this._playposition = new SampleUnit(0, sampleRate);
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
  public static getFileFormat(extension: string, audioformats: AudioFormat[]): AudioFormat {
    return audioformats.find((a) => {
      return a.extension === extension;
    });
  }

  public static decodeAudio = (filename: string, type: string, buffer: ArrayBuffer,
                               audioformats: AudioFormat[]): Subject<{
    audioManager: AudioManager,
    decodeProgress: number
  }> => {
    const subj = new Subject<{
      audioManager: AudioManager,
      decodeProgress: number
    }>();

    const audioformat: AudioFormat = AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats);

    if (audioformat !== undefined) {
      audioformat.init(filename, buffer);

      let audioinfo: AudioInfo = null;
      try {
        audioinfo = audioformat.getAudioInfo(filename, type, buffer);

      } catch (err) {
        subj.error(err.message);
      }

      if (audioinfo !== null) {
        const bufferLength = buffer.byteLength;
        // decode first 10 seconds
        const sampleDur = new SampleUnit(Math.min(audioformat.sampleRate * 30, audioformat.duration), audioformat.sampleRate);

        // get result;
        const result = new AudioManager(audioinfo, audioformat.sampleRate);

        audioinfo = new AudioInfo(filename, type, bufferLength, audioformat.sampleRate,
          audioformat.sampleRate * audioformat.duration / audioformat.sampleRate,
          audioformat.sampleRate, audioformat.channels, audioinfo.bitrate);

        audioinfo.file = new File([buffer], filename, {type: 'audio/wav'});
        result.setRessource(new AudioRessource(filename, SourceType.ArrayBuffer,
          audioinfo, buffer, bufferLength));

        // set duration is very important

        const selection = new AudioSelection(
          result.createSampleUnit(0),
          audioinfo.duration.clone()
        );

        result._mainchunk = new AudioChunk(selection, result);

        result.afterdecoded.emit(result.ressource);
        result.prepareAudioPlayBack();

        result.zeit.start = Date.now();
        const subscr = result.updateChannelData(result.createSampleUnit(0), sampleDur).subscribe((statusItem) => {
            if (statusItem.progress === 1) {
              setTimeout(() => {
                subj.next({
                  audioManager: result,
                  decodeProgress: 1
                });
                subj.complete();
              }, 0);
            } else {
              subj.next({
                audioManager: null,
                decodeProgress: statusItem.progress
              });
            }
          },
          (error) => {
            console.error(error);
            subscr.unsubscribe();
          },
          () => {
            subscr.unsubscribe();
          });
      }
    } else {
      subj.error(`audio format not supported`);
    }

    return subj;
  }

  public static isValidFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== null;
  }

  public static isValidAudioFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== undefined;
  }

  public static getNumberOfDataParts(fileSize: number): number {
    const mb = fileSize / 1024 / 1024;

    if (mb > 50) {

      // make chunks of 50 mb
      return Math.ceil(mb / 50);
    }

    return 1;
  }

  public static stopDecoding() {
    if (!(AudioManager.decoder === null || AudioManager.decoder === undefined)) {
      AudioManager.decoder.requeststopDecoding();
    }
  }

  public startPlayback(audioSelection: AudioSelection, volume: number, playbackRate: number, playOnHover: boolean = false
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (isUnset(this._audioContext)) {
        this.initAudioContext();
      }

      this._audioContext.resume().then(() => {
        if (isUnset(this._gainNode)) {
          this._gainNode = this.audioContext.createGain();
        }
        // create an audio context and hook up the video element as the source
        if (isUnset(this._source)) {
          this._source = this._audioContext.createMediaElementSource(this._audio);
        }
        this.changeState(PlayBackStatus.STARTED);

        // Firefox issue causes playBackRate working only for volume up to 1

        // create a gain node
        this._gainNode.gain.value = volume;
        this._source.connect(this._gainNode);

        // connect the gain node to an output destination
        this._gainNode.connect(this._audioContext.destination);

        this._audio.playbackRate = playbackRate;
        this._audio.onerror = reject;

        this._playOnHover = playOnHover;
        this._stepBackward = false;
        this.playposition = audioSelection.start.clone();
        this._statusRequest = PlayBackStatus.PLAYING;
        this.changeState(PlayBackStatus.PLAYING);

        this._audio.addEventListener('pause', this.onPlayBackChanged);
        this._audio.addEventListener('ended', this.onPlayBackChanged);
        this._audio.addEventListener('error', this.onPlaybackFailed);

        this._audio.play()
          .then(() => {
            this._playbackEndChecker = timer(Math.round(audioSelection.duration.unix / playbackRate)).subscribe(() => {
              this.endPlayBack();
            });

            resolve();
          })
          .catch((error) => {
            this._playbackEndChecker.unsubscribe();
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
      }).catch((error) => {
        this._playbackEndChecker.unsubscribe();
        this.statechange.error(new Error(error));
        reject(error);
      });
    });
  }

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
    this._audio.src = URL.createObjectURL(new File([this._ressource.arraybuffer], this._ressource.info.fullname));

    this._channel = null;
    this._state = PlayBackStatus.INITIALIZED;
    this.afterloaded.emit({status: 'success', error: ''});
  }

  /**
   * sets the ressource. Can be set only once.
   * @param ressource the audio ressource
   */
  public setRessource(ressource: AudioRessource) {
    if (this._ressource === undefined) {
      this._ressource = ressource;
    }
  }

  /**
   * return the source node
   */

  /*
  private getSource(): AudioBufferSourceNode {
    this._source = this._audioContext.createBufferSource();
    return this._source;
  }*/

  public createNewAudioChunk(time: AudioSelection, selection?: AudioSelection): AudioChunk {
    if (
      time.start.samples + time.duration.samples <= this.ressource.info.duration.samples
    ) {
      const chunk = new AudioChunk(time, this, selection);
      this.addChunk(chunk);
      return chunk;
    }
    return null;
  }

  public addChunk(chunk: AudioChunk) {
    if (
      this.chunks.filter(
        (a) => {
          if (a.id === chunk.id) {
            return true;
          }
        }
      ).length === 0) {
      this.chunks.push(chunk);
    }
  }

  public removeChunk(chunk: AudioChunk) {

    // remove by id
    this.chunks = this.chunks.filter(
      (a) => {
        return a.id !== chunk.id;
      }
    );
  }

  public destroy(disconnect: boolean = true) {
    if (!(this._audioContext === null || this._audioContext === undefined)) {
      if (disconnect) {
        this._audioContext.close()
          .then(() => {
            console.log('AudioManager successfully destroyed its AudioContext');
          })
          .catch(
            (error) => {
              console.error(error);
            }
          );
      }
    }
  }

  public createSampleUnit(sample: number): SampleUnit {
    return new SampleUnit(sample, this.sampleRate);
  }

  updateChannelData(sampleStart: SampleUnit, sampleDur: SampleUnit): Subject<{
    progress: number
  }> {
    const result = new Subject<{ progress: number }>();

    const format = new WavFormat();
    format.init(this._ressource.info.name, this._ressource.arraybuffer);
    AudioManager.decoder = new AudioDecoder(format, this._ressource.info, this._ressource.arraybuffer);
    const subj = AudioManager.decoder.onChannelDataCalculate.subscribe((status) => {
        if (status.progress === 1 && status.result !== null) {
          AudioManager.decoder.destroy();
          this._channel = status.result;
          this._channelDataFactor = AudioManager.decoder.channelDataFactor;
          this.onChannelDataChange.next();
          this.onChannelDataChange.complete();

          subj.unsubscribe();
        }

        result.next({progress: status.progress});
        if (status.progress === 1 && status.result !== null) {
          result.complete();
        }
      },
      (error) => {
        console.log(`catched 3`);
        this.onChannelDataChange.error(error);
        result.error(error);
      },
      () => {
      });
    AudioManager.decoder.started = Date.now();
    AudioManager.decoder.getChunkedChannelData(sampleStart, sampleDur).catch((error) => {
      console.error(error);
    });

    return result;
  }

  private initAudioContext() {
    const audioContext = window.AudioContext // Default
      || window.webkitAudioContext // Safari and old versions of Chrome
      || window.mozAudioContext
      || false;
    if (audioContext) {
      if ((this._audioContext === null || this._audioContext === undefined)) {
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
    this._gainNode.disconnect();
    this._source.disconnect();
    this._playbackEndChecker.unsubscribe();
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
  }

  private onPlaybackFailed = (error) => {
    console.error(error);
  }

  private onPause = () => {
    this.changeState(PlayBackStatus.PAUSED);
  }

  private onStop = () => {
    this.changeState(PlayBackStatus.STOPPED);
  }

  private onEnded = () => {
    if (this._state === PlayBackStatus.PLAYING) {
      // audio ended normally
      this.changeState(PlayBackStatus.ENDED);
      this.playposition = this.createSampleUnit(0);
    }

    this.gainNode.disconnect();
  }

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
  public statuschange: EventEmitter<PlayBackStatus> = new EventEmitter<PlayBackStatus>();
  private readonly _audioManger: AudioManager;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private _playposition: SampleUnit;

  get audioManager(): AudioManager {
    return this._audioManger;
  }

  get sampleRate(): number {
    return this._audioManger.sampleRate;
  }

  public get startpos(): SampleUnit {
    return this._selection.start;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   */
  public set startpos(value: SampleUnit) {
    if ((value === null || value === undefined)) {
      throw new Error('start pos is null!');
    }
    if ((this.selection === null || this.selection === undefined)) {
      this.selection = new AudioSelection(value.clone(), this.time.end.clone());
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end.clone();
    }
    this._playposition = this.selection.start.clone() as SampleUnit;
  }

  get relativePlayposition(): SampleUnit {
    let result;

    if (this._status === PlayBackStatus.PLAYING) {
      result = this.audioManager.playposition.sub(this._time.start);
    } else {
      result = this._playposition.sub(this._time.start);
    }

    if (result.samples < 0) {
      console.error(`samples of relativePlayposition is less than 0!`);
    }

    return result;
  }

  set relativePlayposition(value: SampleUnit) {
    if (!isUnset(value) && this._time.end.samples >= value.samples && value.samples > -1) {
      this._playposition = this._time.start.add(value);
    } else {
      console.error(`invalid value for relative sample unit!`);
    }
  }

  get absolutePlayposition(): SampleUnit {
    if (this.status === PlayBackStatus.PLAYING && this._audioManger.isPlaying) {
      return this._audioManger.playposition;
    }
    return this._playposition;
  }

  set absolutePlayposition(value: SampleUnit) {
    if (!isUnset(value) && value.samples >= this._time.start.samples && value.samples <= this._time.end.samples) {
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

  private _selection: AudioSelection = null;

  get selection(): AudioSelection {
    return this._selection;
  }

  set selection(value: AudioSelection) {
    this._selection = value;
  }

  private _time: AudioSelection = null;

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
    if (!isUnset(this._audioManger.gainNode)) {
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

  private _lastplayedpos: SampleUnit;

  get lastplayedpos(): SampleUnit {
    return this._lastplayedpos;
  }

  private _replay = false;

  get replay(): boolean {
    return this._replay;
  }

  constructor(time: AudioSelection, audioManager: AudioManager, selection?: AudioSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('AudioChunk constructor needs two correct AudioTime objects');
    }

    if (!(audioManager === null || audioManager === undefined)) {
      this._audioManger = audioManager;
      this._playposition = time.start.clone() as SampleUnit;
      this._status = PlayBackStatus.INITIALIZED;
    } else {
      throw new Error('AudioChunk needs an audiomanger reference');
    }

    if (!(selection === null || selection === undefined)) {
      this._selection = selection.clone();
    } else {
      this._selection = this._time.clone();
    }

    this._id = ++AudioChunk._counter;
  }

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!(selection === null || selection === undefined)) {
      return this.audioManager.channel.subarray(selection.start.samples, selection.end.samples);
    }

    return null;
  }

  public startPlayback(playOnHover: boolean = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      new Promise<void>((resolve2, reject2) => {
        if (!this._audioManger.isPlaying) {
          resolve2();
        } else {
          this._audioManger.pausePlayback().then(() => {
            setTimeout(resolve2, 500);
          }).catch((error) => {
            reject2(error);
          });
        }
      }).then(() => {
        if (isUnset(this._selection)) {
          this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
        }

        if (this._selection.start.equals(this._selection.end)) {
          this.startpos = this._selection.start.clone() as SampleUnit;
        }

        this._lastplayedpos = this._playposition.clone();

        const id = this.subscrmanager.add(this.audioManager.statechange.subscribe(
          (state: PlayBackStatus) => {
            if (state === PlayBackStatus.STOPPED || state === PlayBackStatus.PAUSED || state === PlayBackStatus.ENDED) {
              this.subscrmanager.removeById(id);
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
                return new Promise<void>((resolve2, reject2) => {
                  setTimeout(() => {
                    this.startPlayback(playOnHover).then(() => {
                      resolve2();
                    })
                      .catch((error) => {
                        console.error(error);
                        reject2(error);
                      });
                  }, 200);
                });
              } else {
                this.setState(state);
                resolve();
              }
            } else {
              this.setState(state);
            }
          },
          (error) => {
            console.error(error);
          }
        ));

        this._audioManger.startPlayback(this.selection, this._volume, this._playbackRate, playOnHover
        ).catch(reject);
      }).catch((error) => {
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
  }

  public pausePlayback() {
    return new Promise<void>((resolve, reject) => {
      this._audioManger.pausePlayback().then(() => {
        if (this.audioManager.state !== this.status && this.status === PlayBackStatus.PLAYING) {
          reject(new Error(`audioManager and chunk have different states: a:${this.audioManager.state}, c:${this.status}`));
        }
        this.afterPlaybackPaused();
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public stepBackward(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!(this.lastplayedpos === null || this.lastplayedpos === undefined)) {
        new Promise<void>((resolve2) => {
          if (this._status === PlayBackStatus.PLAYING) {
            const subscr = this.statuschange.subscribe((status) => {
                if (status === PlayBackStatus.PAUSED) {
                  resolve2();
                }
                subscr.unsubscribe();
              },
              () => {
                resolve2();
              },
              () => {
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
        reject('lastplayedpos is null');
      }
    });
  }

  public stepBackwardTime(backSec: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const backSamples = Math.max(0, (this.absolutePlayposition.samples
        - (Math.round(backSec * this._audioManger.sampleRate))));
      const backSample = new SampleUnit(backSamples, this._audioManger.sampleRate);

      new Promise<void>((resolve2) => {
        if (this._status === PlayBackStatus.PLAYING) {
          this.pausePlayback().then(() => {
            resolve2();
          }).catch((error) => {
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
    this.subscrmanager.destroy();
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
    this.startpos = this.time.start.clone() as SampleUnit;
    this._audioManger.playposition = this.time.start.clone();
  }

  private afterPlaybackPaused = () => {
    this.absolutePlayposition = this.audioManager.playposition.clone();
    this.startpos = this.absolutePlayposition.clone();
  }
}
