import {Logger} from '../../../shared/Logger';
import {AudioRessource} from './AudioRessource';
import {isNullOrUndefined} from 'util';
import {EventEmitter} from '@angular/core';
import {decodeAudioFile} from 'browser-signal-processing/ts/browser-signal-processing/browser-api/format-conversion';
import {AudioTime} from './AudioTime';
import {SourceType} from '../index';
import {AudioChunk} from './AudioChunk';
import {AudioSelection} from './AudioSelection';
import {AudioFormat} from './AudioFormats/AudioFormat';

export class AudioManager {
  get gainNode(): any {
    return this._gainNode;
  }

  // TODO does this has to be enabled?
  set endplaying(value: number) {
    this._endplaying = value;
  }

  get source(): AudioBufferSourceNode {
    return this._source;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  set ressource(value: AudioRessource) {
    this._ressource = value;
  }


  set replay(value: boolean) {
    this._replay = value;
  }

  get endplaying(): number {
    return this._endplaying;
  }

  set paused(value: boolean) {
    this._paused = value;
  }

  set stepbackward(value: boolean) {
    this._stepbackward = value;
  }

  get paused(): boolean {
    return this._paused;
  }

  get playbackstate(): string {
    return this._playbackstate;
  }

  get replay(): boolean {
    return this._replay;
  }

  get stepbackward(): boolean {
    return this._stepbackward;
  }

  get javascriptNode(): any {
    return this._javascriptNode;
  }

  get audioplaying(): boolean {
    return this._audioplaying;
  }

  get ressource(): AudioRessource {
    return this._ressource;
  }

  get id(): number {
    return this._id;
  }

  private static counter = 0;
  private _id: number;
  private _ressource: AudioRessource;

  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  private _audiocontext: AudioContext = null;

  // variables needed for initializing audio
  private _source: AudioBufferSourceNode = null;
  private _gainNode: any = null;

  private _audioplaying = false;
  private _startplaying = 0;
  private _endplaying = 0;
  private _replay = false;
  private _playbackstate = 'stopped';
  private _paused = false;
  private _stepbackward = false;
  public loaded = false;
  private chunks: AudioChunk[] = [];
  private _mainchunk: AudioChunk;

  private _javascriptNode = null;

  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<{ state: string, playonhover: boolean }> = new EventEmitter<{ state: string, playonhover: boolean }>();

  private error: any;
  private newstate = 'uninitialized';

  public static getFileFormat(extension: string, audioformats: AudioFormat[]): AudioFormat {
    for (let i = 0; i < audioformats.length; i++) {
      if (audioformats[i].extension === extension) {
        return audioformats[i];
      }
    }
    return null;
  }

  public static isValidFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename, audioformats) === null;
  }

  public static decodeAudio = (filename: string, buffer: ArrayBuffer, audioformats: AudioFormat[]): Promise<AudioManager> => {
    Logger.log('Decode audio...');

    const audioformat: AudioFormat = AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats);

    const result = new AudioManager(filename);
    let audioinfo = null;
    try {
      audioinfo = audioformat.getAudioInfo(buffer);
    } catch (err) {
      console.error(err.message);
    }

    return decodeAudioFile(buffer, audioinfo.samplerate).then((audiobuffer: AudioBuffer) => {
      Logger.log('Audio decoded.');

      result.ressource = new AudioRessource(filename, SourceType.ArrayBuffer,
        audioinfo, buffer, buffer.byteLength);

      // set duration is very important
      result.ressource.info.duration.samples = audiobuffer.length;
      result.ressource.content = audiobuffer;

      const selection = new AudioSelection(new AudioTime(0, audioinfo.samplerate), new AudioTime(audiobuffer.length, audioinfo.samplerate));
      result._mainchunk = new AudioChunk(selection, result);
      console.log('dur audiomanager ' + result.ressource.info.duration.samples);
      console.log('dur audiobuffer ' + audiobuffer.length);

      result.newstate = 'ready';
      result.afterdecoded.emit(result.ressource);
      result.prepareAudioPlayBack();
      return result;
    });
  };


  constructor(filename: string) {
    this._id = ++AudioManager.counter;

    if (!isNullOrUndefined(filename)) {
      // Fix up for prefixing
      const AudioContext = (<any>window).AudioContext // Default
        || (<any>window).webkitAudioContext // Safari and old versions of Chrome
        || (<any>window).mozAudioContext
        || false;
      if (AudioContext) {
        if (isNullOrUndefined(this._audiocontext)) {
          // reuse old audiocontext
          this._audiocontext = new AudioContext();
        } else {
          console.log('old audiocontext available');
        }

        this.newstate = 'pending';
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
  }

  public stopPlayback(callback: any = null): boolean {
    if (this._audioplaying) {
      if (callback) {
        const call = () => {
          this._audioplaying = false;
          callback();
        };
        this._source.onended = call;
      }
      this._playbackstate = 'stopped';
      this._source.stop(0);
    } else {
      if (callback) {
        callback();
      }
      return false;
    }

    return true;
  }

  public pausePlayback(): boolean {
    if (this._audioplaying) {
      this._paused = true;
      this._playbackstate = 'paused';
      this._source.stop(0);

      return true;
    } else {
      console.log('cant pause because not playing');
    }

    return false;
  }

  public startPlayback(begintime: AudioTime, duration: AudioTime = new AudioTime(0, this._ressource.info.samplerate),
                       volume: number, speed: number, drawFunc: () => void, endPlayback: () => void,
                       playonhover: boolean = false): boolean {

    if (!this._audioplaying) {
      this._playbackstate = 'started';
      this._stepbackward = false;
      this._source = this.getSource();
      this._source.buffer = this._ressource.content;
      this._javascriptNode = this._audiocontext.createScriptProcessor(2048, 1, 1);

      // connect modules of Web Audio API
      this._gainNode.gain.value = volume;
      this._source.playbackRate.value = speed;
      this._source.connect(this._gainNode);
      this._javascriptNode.connect(this._audiocontext.destination);
      this._gainNode.connect(this._audiocontext.destination);

      this._audioplaying = true;
      this._paused = false;

      this._source.onended = () => {
        this._audioplaying = false;
        this.javascriptNode.disconnect();
        endPlayback();
        if (this._playbackstate === 'started' && !this._stepbackward) {
          this.statechange.emit({
            state: 'ended',
            playonhover: playonhover
          });
        } else {
          this.statechange.emit({
            state: this._playbackstate,
            playonhover: playonhover
          });
        }
      };

      this._startplaying = new Date().getTime();
      this._endplaying = this._startplaying + (duration.unix / speed);
      this._javascriptNode.onaudioprocess = drawFunc;


      if (duration.samples <= 0) {
        // important: source.start needs seconds, not samples!
        this._source.start(0, Math.max(0, begintime.seconds));
      } else {
        // important: source.start needs seconds, not samples!
        this._source.start(0, Math.max(0, begintime.seconds), duration.seconds);
      }
      this.statechange.emit({
        state: 'started',
        playonhover: playonhover
      });

      return true;
    }

    return false;
  }

  public rePlayback(): boolean {
    this._replay = !this._replay;
    return this._replay;
  }

  public stepBackward(callback: () => void): boolean {
    this._stepbackward = true;
    if (this._audioplaying) {
      this._playbackstate = 'backward';
      const obj: EventListenerOrEventListenerObject = () => {
        this._source.removeEventListener('ended', obj);
        callback();
        this._stepbackward = false;
      };

      this._source.addEventListener('ended', obj);
      this._source.stop(0);
      return true;
    } else {
      callback();
      return false;
    }
  }

  public stepBackwardTime(callback: () => void): boolean {
    this._stepbackward = true;

    if (this._audioplaying) {
      this._playbackstate = 'backward time';
      const obj: EventListenerOrEventListenerObject = () => {
        this._source.removeEventListener('ended', obj);
        callback();
      };

      this._source.addEventListener('ended', obj);
      this._source.stop(0);
      return true;
    } else {
      callback();
      return false;
    }
  }

  private getSource(): AudioBufferSourceNode {
    this._source = this._audiocontext.createBufferSource();
    return this._source;
  }

  public prepareAudioPlayBack() {
    this._gainNode = this._audiocontext.createGain();
    this._source = this.getSource();

    this.loaded = true;
    this.afterloaded.emit({status: 'success', error: ''})
  }

  /*
   public getChannel(audiobuffer: AudioBuffer): Float32Array {
   if (!isNullOrUndefined(audiobuffer)) {
   return audiobuffer.getChannelData(0);
   }
   return null;
   }
   */

  public destroy(disconnect: boolean = true) {
    if (!isNullOrUndefined(this._audiocontext)) {
      if (disconnect) {
        this._audiocontext.close()
          .then(() => {
            console.log('AdioManager X successfully destroyed its AudioContext');
          })
          .catch(
            (re) => {
              console.error('close audiocontext error:');
            }
          );
      }

      if (!isNullOrUndefined(this._source)) {
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
}
