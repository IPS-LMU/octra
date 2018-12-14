import {Logger} from '../../../../core/shared/Logger';
import {AudioRessource} from './AudioRessource';
import {EventEmitter} from '@angular/core';
import {AudioTime} from './AudioTime';
import {AudioChunk} from './AudioChunk';
import {AudioSelection} from './AudioSelection';
import {AudioFormat} from './AudioFormats';
import {AudioInfo, PlayBackState, SourceType} from '../index';
import {BrowserInfo} from '../../../../core/shared';

declare var window: any;

export class AudioManager {
  get state(): PlayBackState {
    return this._state;
  }

  get audioplaying(): boolean {
    return (this._state === PlayBackState.PLAYING);
  }

  get id(): number {
    return this._id;
  }

  get ressource(): AudioRessource {
    return this._ressource;
  }

  set ressource(value: AudioRessource) {
    this._ressource = value;
  }

  get originalInfo(): AudioInfo {
    return this._originalInfo;
  }

  get source(): AudioBufferSourceNode {
    return this._source;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  get endplaying(): number {
    return this._endplaying;
  }

  // TODO does this has to be enabled?
  set endplaying(value: number) {
    this._endplaying = value;
  }

  get replay(): boolean {
    return this._replay;
  }

  set replay(value: boolean) {
    this._replay = value;
  }

  get paused(): boolean {
    return this._paused;
  }

  set paused(value: boolean) {
    this._paused = value;
  }

  get stepbackward(): boolean {
    return this._stepbackward;
  }

  set stepbackward(value: boolean) {
    this._stepbackward = value;
  }

  get playonhover(): boolean {
    return this._playonhover;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  get playposition(): number {
    if ((this._playposition === null || this._playposition === undefined)) {
      return 0;
    }
    return this._playposition.samples;
  }

  set playposition(value: number) {
    if ((this._playposition === null || this._playposition === undefined)) {
      this._playposition = new AudioTime(0, this.ressource.info.samplerate);
    }
    this._playposition.samples = value;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  public get sampleRateFactor(): number {
    return (!(this._originalInfo.samplerate === null || this._originalInfo.samplerate === undefined)
      && !(this.ressource.info.samplerate === null || this.ressource.info.samplerate === undefined))
      ? this._originalInfo.samplerate / this.ressource.info.samplerate : 1;
  }

  get javascriptNode(): any {
    return this._javascriptNode;
  }

  constructor(audioinfo) {
    this._id = ++AudioManager.counter;
    this._originalInfo = audioinfo;

    if (!(audioinfo === null || audioinfo === undefined)) {
      // Fix up for prefixing
      const AudioContext = (<any>window).AudioContext // Default
        || (<any>window).webkitAudioContext // Safari and old versions of Chrome
        || (<any>window).mozAudioContext
        || false;
      if (AudioContext) {
        if ((this._audiocontext === null || this._audiocontext === undefined)) {
          // reuse old audiocontext
          this._audiocontext = new AudioContext();
        } else {
          console.log('old audiocontext available');
        }

        this._state = PlayBackState.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
  }

  private static counter = 0;
  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  public loaded = false;
  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();
  private _audiocontext: AudioContext = null;
  private _startplaying = 0;
  private chunks: AudioChunk[] = [];
  private _state = PlayBackState.PREPARE;

  private _id: number;

  private _ressource: AudioRessource;

  private _originalInfo: AudioInfo;

  // variables needed for initializing audio
  private _source: AudioBufferSourceNode = null;

  private _gainNode: any = null;

  private _endplaying = 0;

  private _replay = false;

  private _paused = false;

  private _stepbackward = false;

  private _playonhover = false;

  private _mainchunk: AudioChunk;

  private _playposition: AudioTime;

  // only the Audiomanager may have the channel array
  private _channel: Float32Array;

  private _javascriptNode = null;
  public static decodeAudio = (filename: string, type: string, buffer: ArrayBuffer,
                               audioformats: AudioFormat[], keepbuffer = false): Promise<AudioManager> => {
    return new Promise<AudioManager>((resolve, reject) => {
      Logger.log('Decode audio... ' + filename);

      const audioformat: AudioFormat = AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats);
      audioformat.init(buffer);

      let audioinfo = null;
      try {
        audioinfo = audioformat.getAudioInfo(filename, type, buffer);

      } catch (err) {
        reject(err.message);
      }

      if (audioinfo !== null) {
        let buffer_copy = null;

        if (keepbuffer) {
          buffer_copy = buffer.slice(0);
        }

        const buffer_length = buffer.byteLength;

        AudioManager.decodeAudioFile(buffer, audioinfo.samplerate).then((audiobuffer: AudioBuffer) => {
          console.log(`audio decoded`);
          const result = new AudioManager(audioinfo);

          console.log(`original samplerate: ${audioinfo.samplerate}`);
          audioinfo = new AudioInfo(filename, type, buffer_length, audiobuffer.sampleRate,
            audiobuffer.length, audiobuffer.numberOfChannels, audioinfo.bitrate);

          result.ressource = new AudioRessource(filename, SourceType.ArrayBuffer,
            audioinfo, (buffer_copy === null) ? buffer : buffer_copy, audiobuffer, buffer_length);

          // set duration is very important
          result.ressource.info.duration.samples = audiobuffer.length;
          console.log(`duration: ${result.ressource.info.duration.seconds}`);
          console.log(`dur ${audiobuffer.length / audiobuffer.sampleRate}`);
          console.log(`factor is ${result.sampleRateFactor}!`);
          console.log(`decoded samplerate: ${audiobuffer.sampleRate}`);

          const selection = new AudioSelection(new AudioTime(0, audiobuffer.sampleRate),
            new AudioTime(audiobuffer.length, audiobuffer.sampleRate));
          result._mainchunk = new AudioChunk(selection, result);

          result._state = PlayBackState.INITIALIZED;
          result.afterdecoded.emit(result.ressource);
          result.prepareAudioPlayBack();
          console.log(`audiomanager created`);
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      }
    });
  }

  public static getFileFormat(extension: string, audioformats: AudioFormat[]): AudioFormat {
    for (let i = 0; i < audioformats.length; i++) {
      if (audioformats[i].extension === extension) {
        return audioformats[i];
      }
    }
    return null;
  }

  public static isValidFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== null;
  }

  public static decodeAudioFile(file: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      if (BrowserInfo.browser.indexOf('Safari') > -1) {
        console.log(`safari`);
        if (audioCtx) {
          audioCtx.decodeAudioData(file, function (buffer) {
            resolve(buffer);
          });
        } else {
          reject('AudioContext not supported by the browser.');
        }
      } else {
        // not Safari Browser
        console.log(`not safari`);
        const OfflineAudioContext = (<any>window).OfflineAudioContext // Default
          || (<any>window).webkitOfflineAudioContext // Safari and old versions of Chrome
          || (<any>window).mozOfflineAudioContext
          || false;

        if (OfflineAudioContext === false) {
          console.error(`OfflineAudioContext is not supported!`);
        }

        audioCtx.decodeAudioData(file, function (buffer) {
          // do downsampling in order to allow bigger files
          const context = new OfflineAudioContext(1, Math.ceil(buffer.duration * sampleRate), sampleRate);
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(context.destination);
          source.start();
          context.startRendering().then((rendered) => {
            resolve(rendered);
          }).catch((error) => {
            reject(error);
          });
        });
      }
    });
  }

  /***
   * this method is called after audio playback ended
   */
  private toDoCall = () => {
  }

  private afterAudioEnded = () => {
    if (this._state === PlayBackState.PLAYING) {
      // audio ended normally
      this._state = PlayBackState.ENDED;
    }

    if (this._state === PlayBackState.ENDED || this._state === PlayBackState.PAUSED || this._state === PlayBackState.STOPPED) {
      this.javascriptNode.disconnect();
    }

    // toDoCall is very important. It's relative to its context (pause, stop, back etc.).
    this.toDoCall();
    this.statechange.emit(this._state);
  }

  public stopPlayback(afterAudioEnded: () => void): boolean {
    this._replay = false;
    if (this.audioplaying) {
      // don't use changeState
      this.toDoCall = () => {
        this._state = PlayBackState.STOPPED;
        afterAudioEnded();
      };
      this._source.stop(0);
      return true;
    } else {
      console.log(`can't stop because audio manager is not playing`);
    }
    return false;
  }

  public pausePlayback(afterAudioEnded: () => void): boolean {
    if (this.audioplaying) {
      this._paused = true;

      // do this after paused
      this.toDoCall = () => {
        // don't use changeState
        this._state = PlayBackState.PAUSED;
        afterAudioEnded();
      };
      this._source.stop(0);

      return true;
    } else {
      this.statechange.error(new Error('cant pause because not playing'));
      return false;
    }
  }

  public startPlayback(begintime: AudioTime,
                       duration: AudioTime = new AudioTime(0, this._ressource.info.samplerate),
                       volume: number, speed: number, drawFunc: () => void,
                       afterAudioEnded: () => void, playonhover: boolean = false
  ): boolean {
    if (!this.audioplaying) {
      this._playonhover = playonhover;
      this.changeState(PlayBackState.STARTED);
      this._stepbackward = false;
      this._source = this.getSource();
      this._source.buffer = this._ressource.audiobuffer;
      this._javascriptNode = this._audiocontext.createScriptProcessor(2048, 1, 1);

      // connect modules of Web Audio API
      this._gainNode.gain.value = volume;
      this._source.playbackRate.value = speed;
      this._source.connect(this._gainNode);
      this._javascriptNode.connect(this._audiocontext.destination);
      this._gainNode.connect(this._audiocontext.destination);
      this.toDoCall = afterAudioEnded;
      this._source.onended = this.afterAudioEnded;

      this._startplaying = new Date().getTime();
      this._endplaying = this._startplaying + (duration.unix / speed);
      this._javascriptNode.onaudioprocess = drawFunc;

      this.changeState(PlayBackState.PLAYING);

      if (duration.samples <= 0) {
        // important: source.start needs seconds, not samples!
        this._source.start(0, Math.max(0, begintime.seconds));
      } else {
        // important: source.start needs seconds, not samples!
        this._source.start(0, Math.max(0, begintime.seconds), duration.seconds);
      }

      return true;
    } else {
      this.statechange.error(new Error('AudioManager: Can\'t play audio because it is already playing'));
      return false;
    }
  }

  public rePlayback(): boolean {
    this._replay = !this._replay;
    return this._replay;
  }

  public stepBackward(afterAudioEnded: () => void): boolean {
    this._stepbackward = true;
    if (this.audioplaying) {

      this.toDoCall = () => {
        this.changeState(PlayBackState.STOPPED);
        afterAudioEnded();
      };
      this._source.stop();
      return true;
    } else {
      afterAudioEnded();
    }
    return false;
  }

  public prepareAudioPlayBack() {
    this._gainNode = this._audiocontext.createGain();
    this._source = this.getSource();

    // get channel data
    if ((this._channel === null || this._channel === undefined) || this._channel.length === 0) {
      this._channel = new Float32Array(this._ressource.audiobuffer.getChannelData(0));
      // clear audiobuffer otherwise this would need to much memory space
    } else {
      console.log('audio manager already has channel data');
    }

    this.loaded = true;
    this.afterloaded.emit({status: 'success', error: ''});
  }

  public destroy(disconnect: boolean = true) {
    if (!(this._audiocontext === null || this._audiocontext === undefined)) {
      if (disconnect) {
        this._audiocontext.close()
          .then(() => {
            console.log('AudioManager successfully destroyed its AudioContext');
          })
          .catch(
            (error) => {
              console.error(error);
            }
          );
      }

      if (!(this._source === null || this._source === undefined)) {
        this._source.disconnect();
      }
    }
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

  private getSource(): AudioBufferSourceNode {
    this._source = this._audiocontext.createBufferSource();
    return this._source;
  }

  private changeState(newstate: PlayBackState) {
    this._state = newstate;
    this.statechange.emit(newstate);
  }
}
