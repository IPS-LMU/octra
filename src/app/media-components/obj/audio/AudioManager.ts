import {AudioInfo} from './AudioInfo';
import {EventEmitter} from '@angular/core';
import {interval, Subject, Subscription} from 'rxjs';
import {AudioDecoder} from './AudioDecoder';
import {AudioRessource} from './AudioRessource';
import {AudioFormat, AudioSelection, PlayBackStatus, SampleUnit, SourceType, WavFormat} from './index';
import {SubscriptionManager} from '../SubscriptionManager';
import {isSet} from '../../../core/shared/Functions';

declare var window: any;

export class AudioManager {
  get audio(): HTMLAudioElement {
    return this._audio;
  }

  get lastUpdate(): number {
    return this._lastUpdate;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }


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

  get state(): PlayBackStatus {
    return this._state;
  }

  public get sampleRate(): number {
    return this.ressource.info.sampleRate;
  }

  // timestamp when playing should teminate
  private _playbackInfo = {
    started: 0,
    endAt: 0,
    selection: null
  };

  get playbackInfo(): { endAt: number; started: number, selection: AudioSelection } {
    return this._playbackInfo;
  }

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  get bufferSize(): number {
    return this._bufferSize;
  }

  get frameSize(): number {
    return this._frameSize;
  }

  get ressource(): AudioRessource {
    return this._ressource;
  }

  get isPlaying(): boolean {
    return (this._state === PlayBackStatus.PLAYING);
  }

  public zeit = {
    start: 0,
    end: 0
  };

  public static decoder: AudioDecoder;

  /**
   * initializes audio manager
   * @param audioinfo important info about the audio file linked to this manager
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
      const audioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || window.mozAudioContext
        || false;

      if (audioContext) {
        if ((this._audioContext === null || this._audioContext === undefined)) {
          // reuse old audiocontext
          this._audioContext = new audioContext();
        }

        this._playposition = new SampleUnit(0, sampleRate);
        this._state = PlayBackStatus.PREPARE;
      } else {
        console.error('AudioContext not supported by this samples');
      }
    }
  }

  private static counter = 0;

  public onChannelDataChange = new Subject<void>();

  public audiobuffered = new Subject<{
    sampleStart: SampleUnit,
    sampleDur: SampleUnit
  }>();

  private subscrManager = new SubscriptionManager();
  private _id: number;
  private _ressource: AudioRessource;
  private _state: PlayBackStatus;
  private _mainchunk: AudioChunk;
  private _playposition: SampleUnit;
  private _playOnHover = false;
  private _stepBackward = false;
  private _lastUpdate: number;
  private _statusRequest: PlayBackStatus = PlayBackStatus.INITIALIZED;
  private _playbackChecker: Subscription = null;

  private readonly _audio: HTMLAudioElement;

  private isDecodingNewChunk = false;

  set playbackInfo(value: { endAt: number; started: number, selection: AudioSelection }) {
    this._playbackInfo = value;
  }

  // variables needed for initializing audio
  private _source: AudioBufferSourceNode | MediaElementAudioSourceNode = null;
  private _audioContext: AudioContext = null;
  private _gainNode: GainNode = null;
  // only the Audiomanager may have the channel array
  private _channel: Float32Array;

  private _frameSize = 2048;
  private _bufferSize = 2048;

  private _channelDataFactor = -1;

  get channelDataFactor(): number {
    return this._channelDataFactor;
  }

  private chunks: AudioChunk[] = [];

  // events
  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackStatus> = new EventEmitter<PlayBackStatus>();
  public missingPermission = new EventEmitter<void>();

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
        result.updateChannelData(result.createSampleUnit(0), sampleDur).then(() => {
          setTimeout(() => {
            subj.next({
              audioManager: result,
              decodeProgress: 1
            });
            subj.complete();
          }, 0);
        })
          .catch((error) => {
            console.error(error);
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

  public startPlayback(audioSelection: AudioSelection,
                       volume: number, playbackRate: number, playOnHover: boolean = false
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (isSet(this._gainNode)) {
        this._gainNode = this.audioContext.createGain();
      }
      // create an audio context and hook up the video element as the source
      if (isSet(this._source)) {
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
      this._playbackInfo.started = new Date().getTime();
      this._playbackInfo.endAt = this._playbackInfo.started + audioSelection.start.seconds;
      this._playbackInfo.selection = audioSelection.clone();
      this._statusRequest = PlayBackStatus.PLAYING;
      this.changeState(PlayBackStatus.PLAYING);

      this._audio.addEventListener('pause', this.onPlayBackChanged);
      this._audio.addEventListener('ended', this.onPlayBackChanged);
      this._audio.addEventListener('error', this.onPlaybackFailed);

      this._playbackChecker = interval(40).subscribe(this.onTimeUpdate);

      this._audio.play()
        .catch((error) => {
          if (error.name && error.name === 'NotAllowedError') {
            // no permission
            this.missingPermission.emit();
          }

          console.error(error);
        });
      resolve();
    });
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this.changeState(PlayBackStatus.STOPPED);
        this._audio.pause();
        resolve();
      } else {
        console.log(`can't stop because audio manager is not playing`);
        resolve();
      }
    });
  }

  public pausePlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this.changeState(PlayBackStatus.PAUSED);
        this._audio.pause();
        resolve();
      } else {
        reject('cant pause because not playing');
      }
    });
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
    this._playbackChecker.unsubscribe();
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

  updateChannelData(sampleStart: SampleUnit, sampleDur: SampleUnit): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const format = new WavFormat();
      format.init(this._ressource.info.name, this._ressource.arraybuffer);
      const decoder = new AudioDecoder(format, this._ressource.info, this._ressource.arraybuffer);
      const subj = decoder.onChannelDataCalculate.subscribe((status) => {
          if (status.progress === 1 && status.result !== null) {
            decoder.destroy();
            this._channel = status.result;
            this._channelDataFactor = decoder.channelDataFactor;
            this.onChannelDataChange.next();
            this.onChannelDataChange.complete();
            resolve();
          }
        },
        (error) => {
          console.log(`catched 3`);
          this.onChannelDataChange.error(error);
          reject(error);
        },
        () => {
        });
      decoder.started = Date.now();
      decoder.getChunkedChannelData(sampleStart, sampleDur);
    });
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
  }

  private onPlaybackFailed = (error) => {
    console.error(error);
  }

  private onTimeUpdate = () => {
    const selection = this._playbackInfo.selection as AudioSelection;
    if (this.playposition.sub(selection.end).samples > 0) {
      this.endPlayBack();
    }
  }

  private onPause = () => {
    console.log(`PAUSED!`);
    this.changeState(PlayBackStatus.PAUSED);
  }

  private onStop = () => {
    console.log(`STOPPED!`);
    this.changeState(PlayBackStatus.STOPPED);
  }

  private onEnded = () => {
    console.log(`ENDED normally`);
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
}

/***
 * AUDIOCHUNK begins here
 */

interface Interval {
  start: number;
  end: number;
}

export class AudioChunk {
  get replay(): boolean {
    return this._replay;
  }

  get audioManager(): AudioManager {
    return this._audioManger;
  }

  get sampleRate(): number {
    return this._audioManger.sampleRate;
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

  public get startpos(): SampleUnit {
    return this._selection.start;
  }

  get selection(): AudioSelection {
    return this._selection;
  }

  set selection(value: AudioSelection) {
    this._selection = value;
  }

  get time(): AudioSelection {
    return this._time;
  }

  set time(value: AudioSelection) {
    this._time = value;
  }

  get id() {
    return this._id;
  }

  get status(): PlayBackStatus {
    return this._status;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    if (!isSet(this._audioManger.gainNode)) {
      this._audioManger.gainNode.gain.value = value;
    }
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    if (value > 0) {
      this._playbackRate = value;
      this._audioManger.audio.playbackRate = value;
      // TODO does this make sense?
      this._audioManger.playbackInfo.endAt = this._audioManger.playbackInfo.endAt * this._playbackRate;
    }
  }

  get playposition(): SampleUnit {
    if (this._status === PlayBackStatus.PLAYING) {
      return this.audioManager.playposition.sub(this._time.start);
    }

    return this._playposition;
  }

  set playposition(value: SampleUnit) {
    this._playposition = value;
  }

  get lastplayedpos(): SampleUnit {
    return this._lastplayedpos;
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

  private static _counter = 0;
  public statuschange: EventEmitter<PlayBackStatus> = new EventEmitter<PlayBackStatus>();
  private _audioManger: AudioManager;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  private _selection: AudioSelection = null;
  private _time: AudioSelection = null;
  private _id;
  private _status: PlayBackStatus = PlayBackStatus.PREPARE;
  private _volume = 1;
  private _playbackRate = 1;
  private _playposition: SampleUnit;
  private _lastplayedpos: SampleUnit;
  private _replay = false;

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!(selection === null || selection === undefined)) {
      return this.audioManager.channel.subarray(selection.start.samples, selection.end.samples);
    }

    return null;
  }

  public startPlayback(playOnHover: boolean = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isPlaying) {
        if ((this._selection === null || this._selection === undefined)) {
          this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
        }

        if (this._selection.start.equals(this._selection.end)) {
          this.startpos = this._selection.start.clone() as SampleUnit;
        }

        this._lastplayedpos = this.playposition.clone();

        // console.log(`play from ${this.selection.start.seconds} to ${this.selection.start.seconds + this.selection.duration.seconds}`);
        const id = this.subscrmanager.add(this.audioManager.statechange.subscribe(
          (state: PlayBackStatus) => {
            if (state === PlayBackStatus.STOPPED || state === PlayBackStatus.PAUSED || state === PlayBackStatus.ENDED) {
              this.subscrmanager.removeById(id);
            }

            if (state === PlayBackStatus.STOPPED) {
              this._playposition = this.time.start.clone();
            }

            if (state === PlayBackStatus.ENDED) {
              // reset to beginning of selection
              if (this.playposition.samples >= this.time.end.samples) {
                this.startpos = this.time.start.clone();
              } else {
                this._playposition = this.selection.start.clone();
              }
              if (this._replay) {
                console.log(`REPLAY!`);
                return new Promise<void>((resolve2, reject2) => {
                  setTimeout(() => {
                    this.startPlayback(playOnHover).then((result) => {
                      resolve2();
                    })
                      .catch((error) => {
                        console.error(error);
                        reject2(error);
                      });
                  }, 200);
                });
              } else {
                console.log(`REPLAY OFF!`);
                resolve();
              }
            }
            this.setState(state);
          },
          (error) => {
            console.error(error);
          }
        ));

        this._audioManger.startPlayback(this.selection, this._volume, this._playbackRate, playOnHover
        ).catch(reject);
      } else {
        reject(`can't start playback on chunk because audioManager is still playing`);
      }
    });
  }

  /**
   * stops the playback
   */
  public stopPlayback: () => Promise<void> = () => {
    return new Promise<void>((resolve, reject) => {
      if (this._audioManger.isPlaying) {
        const subscr = this._audioManger.statechange.subscribe((status) => {
            if (status === PlayBackStatus.STOPPED) {
              this.afterPlaybackStopped();
              subscr.unsubscribe();
              resolve();
            }
          },
          (error) => {
          },
          () => {
          });

        this._audioManger.stopPlayback();
      } else {
        this.afterPlaybackStopped();
        resolve();
      }
    });
  }

  public pausePlayback() {
    this._audioManger.pausePlayback();
    if (this.audioManager.state !== this.status && this.status === PlayBackStatus.PLAYING) {
      console.error(new Error(`audioManager and chunk have different states: a:${this.audioManager.state}, c:${this.status}`));
    }
    this.afterPlaybackPaused();
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
              (error) => {
                resolve2();
              },
              () => {
              });
            this.audioManager.pausePlayback();
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
      const backSamples = Math.max(0, (this.playposition.samples
        - (Math.round(backSec * this._audioManger.sampleRate))));
      const backSample = new SampleUnit(backSamples, this._audioManger.sampleRate);

      if (!(this.lastplayedpos === null || this.lastplayedpos === undefined)) {
        new Promise<void>((resolve2) => {
          if (this._status === PlayBackStatus.PLAYING) {
            const subscr = this.statuschange.subscribe((status) => {
                if (status === PlayBackStatus.PAUSED) {
                  resolve2();
                }
                subscr.unsubscribe();
              },
              (error) => {
                resolve2();
              },
              () => {
              });
            this.audioManager.pausePlayback();
          } else {
            resolve2();
          }
        }).then(() => {
          this.startpos = backSample.clone();
          this.startPlayback(false).then(resolve).catch(reject);
        });
      } else {
        reject('lastplayedpos is null');
      }
    });
  }

  public clone() {
    return new AudioChunk(this.time.clone(), this.audioManager, this.selection);
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  private setState(state: PlayBackStatus) {
    if (this._status !== state || state === PlayBackStatus.STOPPED) {
      this._status = state;
      this.statuschange.emit(state);
    }
  }

  private afterPlaybackStopped = () => {
    console.log(`after playpack stopped!`);
    this.startpos = this.time.start.clone() as SampleUnit;
    this._audioManger.playposition = this.time.start.clone();
  }

  private afterPlaybackPaused = () => {
    this.playposition = this.audioManager.playposition.clone();
    this.startpos = this.playposition.clone();
  }

  public toggleReplay() {
    this._replay = !this._replay;
  }
}
