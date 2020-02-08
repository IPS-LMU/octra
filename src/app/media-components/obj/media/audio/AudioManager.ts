import {AudioInfo} from './AudioInfo';
import {AudioFormat, AudioRessource, AudioSelection, BrowserAudioTime, BrowserSample} from './index';
import {EventEmitter} from '@angular/core';
import {interval, Subject, Subscription} from 'rxjs';
import {AudioDecoder} from './AudioDecoder';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {PlayBackState, SourceType} from '../index';
import {BrowserInfo} from '../../../../core/shared';
import {isNullOrUndefined} from '../../../../core/shared/Functions';

declare var window: any;

export class AudioManager {
  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  get playposition(): BrowserAudioTime {
    return this._playposition;
  }

  set playposition(value: BrowserAudioTime) {
    this._playposition = value;
  }

  get originalInfo(): AudioInfo {
    return this._originalInfo;
  }

  get state(): PlayBackState {
    return this._state;
  }

  public get browserSampleRate(): number {
    return this._ressource.info.duration.browserSample.sampleRate;
  }

  public get originalSampleRate(): number {
    return this._originalInfo.samplerate;
  }

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  get channelData(): {
    sampleRate: number,
    factor: number,
    data: Float32Array
  } {
    return this._channelData;
  }

  get source(): MediaElementAudioSourceNode {
    return this._source;
  }

  get audioContext(): AudioContext {
    return this._audioContext;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  get ressource(): AudioRessource {
    return this._ressource;
  }

  get isPlaying(): boolean {
    return (this._state === PlayBackState.PLAYING);
  }

  private _startedAt = 0;
  private _audio: HTMLAudioElement;

  private _positionInterval: Subscription;

  /**
   * initializes audio manager
   * @param audioinfo important info about the audio file linked to this manager
   */
  constructor(audioinfo: AudioInfo, browserSampleRate: number) {
    this._id = ++AudioManager.counter;
    this._originalInfo = audioinfo;

    if (!(audioinfo === null || audioinfo === undefined)) {
      // Fix up for prefixing
      this.initAudioContext();

      if (this._audioContext) {
        this._playposition = new BrowserAudioTime(new BrowserSample(0, browserSampleRate), audioinfo.samplerate);
        this._state = PlayBackState.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
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

  private static counter = 0;
  private static decoder: AudioDecoder;
  private _id: number;
  private _ressource: AudioRessource;
  private readonly _originalInfo: AudioInfo;
  private _state: PlayBackState;
  private _mainchunk: AudioChunk;
  private _playposition: BrowserAudioTime;
  private _playOnHover = false;
  private _stepBackward = false;
  private _lastUpdate: number;

  // variables needed for initializing audio
  private _source: MediaElementAudioSourceNode = null;
  private _audioContext: AudioContext = null;
  private _gainNode: GainNode = null;
  // only the Audiomanager may have the channelData array
  private _channelData: {
    sampleRate: number,
    factor: number,
    data: Float32Array
  };

  private chunks: AudioChunk[] = [];
  private lastPlaybackViaVolume = false;

  // events
  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();


  /**
   * returns the FileFormat instance relative of the file extension or undefined if not found.
   * @param extension file extension
   * @param audioformats list of supported audio formats
   */
  public static getFileFormat(extension: string, audioformats: AudioFormat[]): AudioFormat | undefined {
    return audioformats.find((a) => {
      return a.extension.toLowerCase() === extension;
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
        AudioManager.decoder = new AudioDecoder(audioformat, buffer);

        const bufferCopy = buffer.slice(0);

        AudioManager.decoder.onaudiodecode.subscribe((obj) => {
          if (obj.result !== null) {
            // get result;
            const audioBuffer = obj.result;
            const result = new AudioManager(audioinfo, audioBuffer.sampleRate);

            audioinfo = new AudioInfo(filename, type, bufferLength, audioBuffer.sampleRate,
              audioBuffer.length, audioformat.channels, audioformat.bitsPerSample, audioformat.sampleRate);

            // audioinfo.file = new File([buffer], filename, {type: 'audio/wav'});
            result.setRessource(new AudioRessource(filename, SourceType.ArrayBuffer,
              audioinfo, bufferCopy, bufferLength));

            // set duration is very important
            console.log(`sampleRate browser: ${result.browserSampleRate}`);
            console.log(`sampleRate original: ${result.originalSampleRate}`);
            console.log(`original duration in samples = ${result.ressource.info.duration.originalSample.value}`);
            console.log(`browser duration in samples = ${result.ressource.info.duration.browserSample.value}`);
            console.log(`original duration ${result.ressource.info.duration.originalSample.seconds}`);
            console.log(`browser duration ${result.ressource.info.duration.browserSample.seconds}`);
            console.log(`audiobuffer duration ${audioBuffer.length}`);
            console.log(`decoded samplerate: ${audioBuffer.sampleRate}`);

            const selection = new AudioSelection(
              result.createBrowserAudioTime(0),
              result.createBrowserAudioTime(audioinfo.duration.browserSample.value)
            );

            result._mainchunk = new AudioChunk(selection, result);

            result.prepareAudioPlayBack(audioBuffer);
            result.afterdecoded.emit(result.ressource);

            subj.next({
              audioManager: result,
              decodeProgress: 1
            });
            subj.complete();
          } else {
            subj.next({
              audioManager: null,
              decodeProgress: obj.progress
            });
          }
        }, error => console.error(error));

        const numOfParts = AudioManager.getNumberOfDataParts(bufferLength);
        let sampleDur = Math.round(audioformat.duration / numOfParts);
        // tweak that enables to decode full seconds

        if (numOfParts > 1) {
          sampleDur = Math.round(sampleDur / audioformat.sampleRate) * audioformat.sampleRate;
        }

        AudioManager.decoder.decodeChunked(0, sampleDur);
      }
    } else {
      subj.error(`audio format not supported`);
    }

    return subj;
  }

  public static getNumberOfDataParts(fileSize: number): number {
    const mb = fileSize / 1024 / 1024;

    if (mb > 50) {

      // make chunks of 50 mb
      return Math.ceil(mb / 50);
    }

    return 1;
  }

  /**
   * decodes the audio file and keeps its samplerate using OfflineAudioContext
   * @param file the files content as ArrayBuffer
   * @param sampleRate the file's sample rate
   */
  public static decodeAudioFile(file: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const audioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || window.mozAudioContext
        || false;

      if (audioContext) {
        audioContext.decodeAudioData(file, (buffer) => {
          resolve(buffer);
        }, (error) => {
          reject(error);
        });
      } else {
        reject(new Error(`audio context could not be initialized.`));
      }
    });
  }

  public static isValidAudioFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== undefined;
  }

  public static stopDecoding() {
    if (!(AudioManager.decoder === null || AudioManager.decoder === undefined)) {
      AudioManager.decoder.requeststopDecoding();
    }
  }

  public startPlayback(begintime: BrowserAudioTime,
                       duration: BrowserAudioTime = new BrowserAudioTime(
                         new BrowserSample(0, this.browserSampleRate), this.originalSampleRate
                       ),
                       volume: number, speed: number, onProcess: () => void, playOnHover: boolean = false
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isPlaying) {
        this.audioContext.resume().then(() => {
          this._playOnHover = playOnHover;
          this._stepBackward = false;
          this.changeState(PlayBackState.STARTED);

          this.checkBrowserCompatibility(volume, speed).then(() => {
            // connect modules of Web Audio API
            let lastCheck = Date.now();

            this._playposition = begintime.clone();
            this._playposition.browserSample.value = begintime.browserSample.value;

            if (!isNullOrUndefined(this._positionInterval)) {
              this._positionInterval.unsubscribe();
            }

            this._positionInterval = interval(35).subscribe(() => {
              if (this.isPlaying) {
                const currentSamples = Math.round(this._audio.currentTime * begintime.browserSample.sampleRate);
                if (currentSamples < duration.browserSample.value + begintime.browserSample.value) {
                  this._playposition.browserSample.value = currentSamples;
                  onProcess();
                } else {
                  this._audio.pause();
                  this._playposition.browserSample.value = duration.browserSample.value + begintime.browserSample.value;
                  this.afterAudioEnded();
                  resolve();
                }
              }
              this._lastUpdate = lastCheck;
            });

            this._audio.playbackRate = speed;
            this._audio.currentTime = begintime.browserSample.seconds;

            this._audio.play().then(() => {
              this._startedAt = Date.now();
              this.changeState(PlayBackState.PLAYING);
            }).catch((error) => {
              this.statechange.error(new Error(error));
              reject(error);
            });
          });
        }).catch((error) => {
          this.statechange.error(new Error(error));
          reject(error);
        });
      } else {
        this.statechange.error(new Error('AudioManager: Can\'t play audio because it is already playing'));
        reject('AudioManager: Can\'t play audio because it is already playing');
      }
    });
  }

  private checkBrowserCompatibility(volume: number, speed: number) {
    return new Promise<void>((resolve, reject) => {
      if (BrowserInfo.browser.indexOf('Firefox') > -1) {
        this.disconnectSource();
        this.disconnectGain();
        if (volume > 1) {
          if (isNullOrUndefined(this._gainNode)) {
            this._gainNode = this._audioContext.createGain();
            this._gainNode.gain.value = volume;
          }
          if (isNullOrUndefined(this._source)) {
            this._source = this._audioContext.createMediaElementSource(this._audio);
          }
          this._source.connect(this._gainNode);
          this._gainNode.connect(this._audioContext.destination);
          this.lastPlaybackViaVolume = false;
          resolve();
        } else {
          if (!this.lastPlaybackViaVolume) {
            this._audio = new Audio(this._ressource.objectURL);
            this._audio.addEventListener('ended', this.afterAudioEnded);

            const check = () => {
              this._audio.removeEventListener('canplay', check);
              this.lastPlaybackViaVolume = true;
              resolve();
            };
            this._audio.addEventListener('canplay', check);
          } else {
            resolve();
          }
          this._audio.playbackRate = speed;
          this._audio.volume = volume;
        }
      } else {
        if (isNullOrUndefined(this._gainNode)) {
          this._gainNode = this._audioContext.createGain();
        }
        if (isNullOrUndefined(this._source)) {
          this.audioContext.destination.disconnect();
          this._source = this._audioContext.createMediaElementSource(this._audio);
        }
        this._gainNode.gain.value = volume;
        this._source.connect(this._gainNode);
        this._gainNode.connect(this._audioContext.destination);
        resolve();
      }
    });
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this.changeState(PlayBackState.STOPPED);
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
        this.changeState(PlayBackState.PAUSED);
        this._audio.pause();
        resolve();
      } else {
        reject('cant pause because not playing');
      }
    });
  }

  private changeState(newstate: PlayBackState) {
    this._state = newstate;
    this.statechange.emit(newstate);
  }

  private afterAudioEnded = () => {
    this._positionInterval.unsubscribe();
    this._positionInterval = null;

    if (this._state === PlayBackState.PLAYING) {
      // audio ended normally
      this.changeState(PlayBackState.ENDED);
    }
  }

  private disconnectSource() {
    if (!isNullOrUndefined(this._source)) {
      this._source.disconnect();
      this._source = null;
    }
  }

  private disconnectGain() {
    if (!isNullOrUndefined(this._gainNode)) {
      this._gainNode.disconnect();
      this._gainNode = null;
    }
  }

  /**
   * prepares the audio manager for play back
   */
  private prepareAudioPlayBack(audiobuffer: AudioBuffer) {
    this._audio = new Audio(this._ressource.objectURL);
    this._audio.addEventListener('ended', this.afterAudioEnded);

    // get channelData data
    if ((this._channelData === null || this._channelData === undefined) || this._channelData.data.length === 0) {
      this._channelData = {
        data: audiobuffer.getChannelData(0),
        factor: 1,
        sampleRate: audiobuffer.sampleRate
      };

      this.minimizeChannelArray();
    }

    this._state = PlayBackState.INITIALIZED;

    const check = () => {
      console.log(`FINISHED LOADING!`);
      this.afterloaded.emit({status: 'success', error: ''});
      this._audio.removeEventListener('canplay', check);
    };

    this._audio.addEventListener('canplay', check)
  }

  public minimizeChannelArray() {
    let factor = 0;

    if (this.ressource.info.samplerate === 48000) {
      factor = 3;
      // samplerate = 16000
    } else if (this.ressource.info.samplerate === 44100) {
      factor = 2;
      // samplerate = 22050
    } else {
      factor = 1;
    }

    const newSampleRate = this.ressource.info.samplerate / factor;

    if (newSampleRate !== this.ressource.info.samplerate) {
      const result = new Float32Array(Math.ceil(this.ressource.info.duration.browserSample.seconds * newSampleRate));

      let counter = 0;
      for (let i = 0; i < this._channelData.data.length; i++) {

        let sum = 0;
        for (let j = 0; j < factor; j++) {
          sum += this._channelData.data[i + j];
        }

        result[counter] = sum / factor;
        i += factor - 1;
        counter++;
      }

      this._channelData.data = result;
      this._channelData.factor = factor;
      this._channelData.sampleRate = newSampleRate;
      console.log(`minimized channel (${newSampleRate}, ${factor}) has ${result.byteLength} bytes and ${result.length} items`);
    } else {
      // do nothing
      this._channelData.factor = 1;
      this._channelData.sampleRate = this.ressource.info.samplerate;
    }
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

  public createNewAudioChunk(time: AudioSelection, selection?: AudioSelection): AudioChunk {
    if (
      time.start.browserSample.value + time.duration.browserSample.value <= this.ressource.info.duration.browserSample.value
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
    console.log(`destroy audio manager!`);
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
    console.log(`revoke URL!`);
    URL.revokeObjectURL(this._ressource.objectURL);
  }

  public createBrowserAudioTime(sample: number): BrowserAudioTime {
    return new BrowserAudioTime(new BrowserSample(sample, this.browserSampleRate), this.originalSampleRate);
  }
}

interface Interval {
  start: number;
  end: number;
}

export class AudioChunk {
  get replay(): boolean {
    return this._replay;
  }

  static get counter(): number {
    return this._counter;
  }

  get audiomanager(): AudioManager {
    return this._audioManger;
  }

  public get browserSampleRate(): number {
    return this._audioManger.browserSampleRate;
  }

  public get originalSampleRate(): number {
    return this._audioManger.originalSampleRate;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   */
  public set startpos(value: BrowserAudioTime) {
    if ((value === null || value === undefined)) {
      throw new Error('start pos is null!');
    }
    if ((this.selection === null || this.selection === undefined)) {
      this.selection = new AudioSelection(value.clone(), this.time.end.clone());
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end.clone();
    }
    this._playposition = this.selection.start.clone() as BrowserAudioTime;
    this._audioManger.playposition = this._playposition;
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

  get state(): PlayBackState {
    return this._state;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    if (!isNullOrUndefined(this._audioManger.gainNode)) {
      this._audioManger.gainNode.gain.value = value;
    }
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    if (value > 0) {
      this._speed = value;
    }
  }

  get playposition(): BrowserAudioTime {
    return this._playposition;
  }

  set playposition(value: BrowserAudioTime) {
    this._playposition = value;
    this._audioManger.playposition = value;
  }

  get lastplayedpos(): BrowserAudioTime {
    return this._lastplayedpos;
  }

  public get isPlaybackEnded(): boolean {
    return this._state === PlayBackState.ENDED;
  }

  public get isPlaybackStarted(): boolean {
    return this._state === PlayBackState.STARTED;
  }

  public get isPlaying(): boolean {
    return this._state === PlayBackState.PLAYING;
  }

  public get isPlayBackStopped(): boolean {
    return this._state === PlayBackState.STOPPED;
  }

  constructor(time: AudioSelection, audioManager: AudioManager, selection?: AudioSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('AudioChunk constructor needs two correct AudioTime objects');
    }

    if (!(audioManager === null || audioManager === undefined)) {
      this._audioManger = audioManager;
      this._playposition = this._audioManger.createBrowserAudioTime(time.start.browserSample.value);
      this._state = PlayBackState.INITIALIZED;
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
  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();
  private readonly _audioManger: AudioManager;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  private _selection: AudioSelection = null;

  private _time: AudioSelection = null;

  private readonly _id;

  private _state: PlayBackState = PlayBackState.PREPARE;

  private _volume = 1;

  private _speed = 1;

  private _playposition: BrowserAudioTime;

  private _lastplayedpos: BrowserAudioTime;

  private _replay = false;
  /**
   * calculate current position of the current audio playback.
   * TODO when does this method must be called? Animation of playcursor or at another time else?
   */
  private updatePlayPosition = () => {
    if (!(this.selection === null || this.selection === undefined)) {
      const timestamp = new Date().getTime();

      if ((this._playposition === null || this._playposition === undefined)) {
        this._playposition = this.time.start.clone() as BrowserAudioTime;
      } else {
        this._playposition.browserSample.value = this._audioManger.playposition.browserSample.value;
      }
      this._audioManger.playposition = this._playposition;
    }
  }

  public startPlayback(onProcess: () => void = () => {
  }, playOnHover: boolean = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isPlaying) {
        if ((this._selection === null || this._selection === undefined)) {
          this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
        }

        if (this._selection.start.browserSample.value === this._selection.end.browserSample.value) {
          this.startpos = this._selection.start.clone() as BrowserAudioTime;
        }

        this.setState(PlayBackState.STARTED);

        this._lastplayedpos = this.playposition.clone();
        this.audiomanager.playposition = this._lastplayedpos.clone();

        this.setState(PlayBackState.PLAYING);

        // console.log(`play from ${this.selection.start.seconds} to ${this.selection.start.seconds + this.selection.duration.seconds}`);
        const id = this.subscrmanager.add(this.audiomanager.statechange.subscribe(
          (state: PlayBackState) => {
            this.setState(state);

            if (state === PlayBackState.STOPPED || state === PlayBackState.PAUSED || state === PlayBackState.ENDED) {
              this.subscrmanager.removeById(id);
            }

            if (state === PlayBackState.ENDED) {
              // reset to beginning of selection
              if (this._replay) {
                this.playposition = this.selection.start.clone() as BrowserAudioTime;
                this.startPlayback(onProcess, playOnHover).then(resolve).catch(reject);
              } else {
                this.startpos = this._time.start.clone() as BrowserAudioTime;
                resolve();
              }
            }
          },
          (error) => {
            console.error(error);
            reject(error);
          }
        ));

        this._audioManger.startPlayback(
          this.selection.start as BrowserAudioTime, this.selection.duration as BrowserAudioTime, this._volume, this._speed, () => {
            this.updatePlayPosition();
            onProcess();
          }, playOnHover
        ).then(resolve).catch(reject);
      } else {
        reject(`can't start playback on chunk because audiomanager is still playing`);
      }
    });
  }

  /**
   * stops the playback
   */
  public stopPlayback: () => Promise<void> = () => {
    return new Promise<void>((resolve, reject) => {
      this._audioManger.stopPlayback().then(() => {
        this.afterPlaybackStopped();
        resolve();
      }).catch(reject);
    });
  }

  public pausePlayback(): Promise<void> {
    return this._audioManger.pausePlayback().then(() => {
      if (this.audiomanager.state !== this.state && this.state === PlayBackState.PLAYING) {
        console.error(`audiomanager and chunk have different states: a:${this.audiomanager.state}, c:${this.state}`);
      }
      this.afterPlaybackPaused();
    });
  }

  public stepBackward(onProcess: () => void = () => {
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!(this.lastplayedpos === null || this.lastplayedpos === undefined)) {
        if (this.audiomanager.isPlaying) {
          this.audiomanager.stopPlayback().then(() => {
            this.startpos = this.lastplayedpos.clone();
            this._audioManger.startPlayback(
              this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
                this.updatePlayPosition();
                onProcess();
              }
            ).then(resolve).catch(reject);
          }).catch(reject);
        } else {
          this.startpos = this.lastplayedpos.clone();
          this._audioManger.startPlayback(
            this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
              this.updatePlayPosition();
              onProcess();
            }
          ).then(resolve).catch(reject);
        }
      } else {
        reject('lastplayedpos is null');
      }
    });
  }

  public stepBackwardTime(backSec: number, onProcess: () => void = () => {
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const backSamples = Math.max(0, (this.playposition.browserSample.value
        - (Math.round(backSec * this._audioManger.browserSampleRate))));
      const backSample = new BrowserSample(backSamples, this._audioManger.browserSampleRate);

      if (this.audiomanager.isPlaying) {
        this.audiomanager.stopPlayback().then(() => {
          this.startpos = this._audioManger.createBrowserAudioTime(backSample.value);

          this._audioManger.startPlayback(
            this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
              this.updatePlayPosition();
              onProcess();
            }
          ).then(resolve).catch(reject);
        }).catch(reject);
      } else {
        this.startpos = this._audioManger.createBrowserAudioTime(backSample.value);

        this._audioManger.startPlayback(
          this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
            this.updatePlayPosition();
            onProcess();
          }
        ).then(resolve).catch(reject);
      }
    });
  }

  public clone() {
    return new AudioChunk(this.time.clone(), this.audiomanager, this.selection);
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  private setState(state: PlayBackState) {
    if (this._state !== state || state === PlayBackState.STOPPED) {
      this._state = state;
      this.statechange.emit(state);
    }
  }

  private afterPlaybackStopped = () => {
    this.startpos = this.time.start.clone() as BrowserAudioTime;
    if (this._replay) {
      this.toggleReplay();
    }
  }

  private afterPlaybackPaused = () => {
    this.playposition = this.audiomanager.playposition.clone();
    this.startpos = this.playposition.clone();
  }

  public toggleReplay() {
    this._replay = !this._replay;
  }
}

