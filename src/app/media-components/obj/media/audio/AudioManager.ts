import {Logger} from '../../../../core/shared/Logger';
import {AudioRessource} from './AudioRessource';
import {isNullOrUndefined} from 'util';
import {EventEmitter} from '@angular/core';
import {AudioTime} from './AudioTime';
import {PlayBackState, SourceType} from '../index';
import {AudioChunk} from './AudioChunk';
import {AudioSelection} from './AudioSelection';
import {AudioFormat} from './AudioFormats/AudioFormat';

export class AudioManager {
  get channel(): Float32Array {
    return this._channel;
  }

  get playonhover(): boolean {
    return this._playonhover;
  }

  set playposition(value: number) {
    if (isNullOrUndefined(this._playposition)) {
      this._playposition = new AudioTime(0, this.ressource.info.samplerate);
    }
    this._playposition.samples = value;
  }

  get playposition(): number {
    if (isNullOrUndefined(this._playposition)) {
      return 0;
    }
    return this._playposition.samples;
  }

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
    return (this.state === PlayBackState.PLAYING);
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

  private _startplaying = 0;
  private _endplaying = 0;
  private _replay = false;
  private _paused = false;
  private _stepbackward = false;
  private _playonhover = false;
  public loaded = false;
  private chunks: AudioChunk[] = [];
  private _mainchunk: AudioChunk;
  private _playposition: AudioTime;
  // only the Audiomanager may have the channel array
  private _channel: Float32Array;

  private _javascriptNode = null;

  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();

  private state = PlayBackState.PREPARE;

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

  public static decodeAudio = (filename: string, buffer: ArrayBuffer,
                               audioformats: AudioFormat[], keepbuffer = false): Promise<AudioManager> => {
    Logger.log('Decode audio... ' + filename);

    const audioformat: AudioFormat = AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats);

    const result = new AudioManager(filename);
    let audioinfo = null;
    try {
      audioinfo = audioformat.getAudioInfo(buffer);
    } catch (err) {
      console.error(err.message);
    }

    let buffer_copy = null;

    if (keepbuffer) {
      buffer_copy = buffer.slice(0);
    }

    const buffer_length = buffer.byteLength;

    return AudioManager.decodeAudioFile(buffer, audioinfo.samplerate).then((audiobuffer: AudioBuffer) => {
      Logger.log('Audio decoded.');

      result.ressource = new AudioRessource(filename, SourceType.ArrayBuffer,
        audioinfo, (buffer_copy === null) ? buffer : buffer_copy, audiobuffer, buffer_length);

      // set duration is very important
      result.ressource.info.duration.samples = audiobuffer.length;

      const selection = new AudioSelection(new AudioTime(0, audioinfo.samplerate), new AudioTime(audiobuffer.length, audioinfo.samplerate));
      result._mainchunk = new AudioChunk(selection, result);

      result.state = PlayBackState.INITIALIZED;
      result.afterdecoded.emit(result.ressource);
      result.prepareAudioPlayBack();
      return result;
    });
  }

  /**
   * Decode an audio file to an AudioBuffer object.
   *
   * Supported input formats are determined by the browser. The WebAudio API
   * re-samples the signal to the given sample rate. If resampling is
   * undesired, the source sample rate must be known beforehand.
   *
   * @param file An object containing the encoded input file.
   * @param sampleRate The sample rate of the target AudioBuffer object.
   * @returns A promise resolving to the requested AudioBuffer.
   */
  public static decodeAudioFile(file: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    /* adapted function from
       "browser-signal-processing" package (MIT)
       author: Markus Jochim (markusjochim@phonetik.uni-muenchen.de)
    */

    const OfflineAudioContext = (<any>window).OfflineAudioContext // Default
      || (<any>window).webkitOfflineAudioContext // Safari and old versions of Chrome
      || (<any>window).mozOfflineAudioContext
      || false;

    return new Promise<AudioBuffer>((resolve, reject) => {
      const context = new OfflineAudioContext(1, 4096, sampleRate);
      context.decodeAudioData(file, (result) => {
        resolve(result);
      }, (reason) => {
        reject({
          message: 'Could not decode audio file',
          action: 'decodeAudioFile',
          previousError: reason
        });
      });
    });
  }

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

        this.state = PlayBackState.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
  }

  public stopPlayback(): boolean {
    this._replay = false;
    if (this.audioplaying) {
      this.state = PlayBackState.STOPPED;
      this._source.stop(0);
      return true;
    }
    return false;
  }

  public pausePlayback(): boolean {
    if (this.audioplaying) {
      this._paused = true;
      this.state = PlayBackState.PAUSED;
      this._source.stop(0);
      return true;
    } else {
      this.statechange.error(new Error('cant pause because not playing'));
      return false;
    }
  }

  public startPlayback(begintime: AudioTime, duration: AudioTime = new AudioTime(0, this._ressource.info.samplerate),
                       volume: number, speed: number, drawFunc: () => void, playonhover: boolean = false): boolean {

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
      this.statechange.error(new Error('Can\'t play audio because it is already playing'));
      return false;
    }
  }

  private afterAudioEnded = () => {
    if (this.state === PlayBackState.PLAYING) {
      // audio ended normally
      this.state = PlayBackState.ENDED;
    }

    if (this.state === PlayBackState.ENDED || this.state === PlayBackState.PAUSED || this.state === PlayBackState.STOPPED) {
      this.javascriptNode.disconnect();
    }
    /*
    if (this.state === PlayBackState.PLAYING && !this._stepbackward) {
      this.state = PlayBackState.ENDED;
    }
    */
    this.statechange.emit(this.state);
  }

  public rePlayback(): boolean {
    this._replay = !this._replay;
    return this._replay;
  }

  public stepBackward(): boolean {
    this._stepbackward = true;
    if (this.audioplaying) {
      /* const obj: EventListenerOrEventListenerObject = () => {
        this._source.removeEventListener('ended', obj);
        callback();
        this._stepbackward = false;
      };
      this._source.addEventListener('ended', obj);
      */

      this.state = PlayBackState.STOPPED;
      this._source.stop(0);
      return true;
    }
    return false;
  }

  public stepBackwardTime(back_samples: number): boolean {
    this._stepbackward = true;

    if (this.audioplaying) {
      /*
      const obj: EventListenerOrEventListenerObject = () => {
        this._source.removeEventListener('ended', obj);
        callback();
        this._stepbackward = false;
      };

      this._source.addEventListener('ended', obj);
      */

      this.state = PlayBackState.STOPPED;
      this._source.stop(0);
      return true;
    }
    return false;
  }

  private getSource(): AudioBufferSourceNode {
    this._source = this._audiocontext.createBufferSource();
    return this._source;
  }

  public prepareAudioPlayBack() {
    this._gainNode = this._audiocontext.createGain();
    this._source = this.getSource();

    // get channel data
    if (isNullOrUndefined(this._channel) || this._channel.length === 0) {
      this._channel = new Float32Array(this._ressource.audiobuffer.getChannelData(0));
      // clear audiobuffer otherwise this would need to much memory space
    } else {
      console.log('audio manager already has channel data');
    }

    this.loaded = true;
    this.afterloaded.emit({status: 'success', error: ''});
  }

  public destroy(disconnect: boolean = true) {
    if (!isNullOrUndefined(this._audiocontext)) {
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

      if (!isNullOrUndefined(this._source)) {
        this._source.disconnect();
      }
    }
  }

  private changeState(newstate: PlayBackState) {
    this.state = newstate;
    this.statechange.emit(newstate);
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
