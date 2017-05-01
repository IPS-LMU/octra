import {EventEmitter, Injectable} from '@angular/core';
import {Http, RequestOptions, Response, ResponseContentType} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {AudioTime} from '../shared/AudioTime';
import {decodeAudioFile} from 'browser-signal-processing/ts/browser-signal-processing/browser-api/format-conversion';

import {isNullOrUndefined} from 'util';
import {Logger} from '../shared/Logger';

@Injectable()
export class AudioService {
  // REMARKS
  // ALL time relevant variables have to be in samples which
  // is the smallest unit and needed for precision
  // It would be the best if you use the AudioTime class

  set audiobuffer(value: AudioBuffer) {
    this._audiobuffer = value;
  }

  get state(): string {
    return this._state;
  }

  get duration(): AudioTime {
    return this._duration;
  }

  set duration(value: AudioTime) {
    this._duration = value;
  }

  set endplaying(value: number) {
    this._endplaying = value;
  }

  set stepbackward(value: boolean) {
    this._stepbackward = value;
  }

  set gainNode(value: any) {
    this._gainNode = value;
  }

  set speed(value: number) {
    if (value > 0) {
      this._speed = value;
      this._source.playbackRate.value = value;
      this.endplaying = this.endplaying * this._speed;
    }
  }

  get audiocontext(): AudioContext {
    return this._audiocontext;
  }

  get audiobuffer(): AudioBuffer {
    return this._audiobuffer;
  }

  get source(): AudioBufferSourceNode {
    return this._source;
  }

  set replay(value: boolean) {
    this._replay = value;
  }

  set source(value: AudioBufferSourceNode) {
    this._source = value;
  }

  set volume(value: number) {
    this._volume = value;
    this.gainNode.gain.value = value;
  }

  get gainNode(): any {
    return this._gainNode;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  get volume(): number {
    return this._volume;
  }

  get speed(): number {
    return this._speed;
  }

  get audioplaying(): boolean {
    return this._audioplaying;
  }

  get startplaying(): number {
    return this._startplaying;
  }

  get endplaying(): number {
    return this._endplaying;
  }

  set audioplaying(value: boolean) {
    this._audioplaying = value;
  }

  get replay(): boolean {
    return this._replay;
  }

  get paused(): boolean {
    return this._paused;
  }

  set startplaying(value: number) {
    this._startplaying = value;
  }

  get stepbackward(): boolean {
    return this._stepbackward;
  }

  get samplerate(): number {
    return this._audiobuffer.sampleRate;
  }

  set javascriptNode(value: any) {
    this._javascriptNode = value;
  }

  get javascriptNode(): any {
    return this._javascriptNode;
  }

  set paused(value: boolean) {
    this._paused = value;
  }

  // variables needed for initializing audio
  private _audiocontext: AudioContext = null;
  private _audiobuffer: AudioBuffer = null;
  private _source: AudioBufferSourceNode = null;
  private _gainNode: any = null;
  private _channel: Float32Array = null;
  private _duration: AudioTime = null;
  private _volume = 1;
  private _speed = 1;

  private _audioplaying = false;
  private _startplaying = 0;
  private _endplaying = 0;
  private _replay = false;
  private _state = 'stopped';

  private _javascriptNode = null;

  private _paused = false;
  private _stepbackward = false;

  public afterloaded: EventEmitter<any>;
  public statechange: EventEmitter<string>;
  public loaded = false;

  private error: any;

  /***
   * Constructor
   */
  constructor(private http: Http) {
    this.init();

    this.afterloaded = new EventEmitter<any>();
    this.statechange = new EventEmitter<string>();
  }

  public init() {
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
        console.info('old audiocontext available');
      }
    } else {
      console.error('AudioContext not supported by this browser');
    }
  }

  public stopPlayback(callback: any = null): boolean {
    if (this.audioplaying) {
      if (callback) {
        const call = () => {
          this.audioplaying = false;
          callback();
        };
        this.source.onended = call;
      }
      this._state = 'stopped';
      this.source.stop(0);
    } else {
      if (callback) {
        callback();
      }
      return false;
    }

    return true;
  }

  public pausePlayback(): boolean {
    if (this.audioplaying) {
      this.paused = true;
      this._state = 'paused';
      this.source.stop(0);

      return true;
    }

    return false;
  }

  public startPlayback(begintime: AudioTime, duration: AudioTime = new AudioTime(0, this.samplerate),
                       drawFunc: () => void, endPlayback: () => void): boolean {
    if (!this.audioplaying) {
      this._state = 'started';
      this._stepbackward = false;
      this.source = this.getSource();
      this.source.buffer = this._audiobuffer;
      this.javascriptNode = this.audiocontext.createScriptProcessor(2048, 1, 1);

      // connect modules of Web Audio API
      this.gainNode.gain.value = this.volume;
      this.source.playbackRate.value = this.speed;
      this.source.connect(this.gainNode);
      this.javascriptNode.connect(this.audiocontext.destination);
      this.gainNode.connect(this.audiocontext.destination);

      this._duration.sample_rate = this.samplerate;

      this.audioplaying = true;
      this.paused = false;

      this.source.onended = () => {
        endPlayback();
        if (this._state === 'started' && !this.stepbackward) {
          this.statechange.emit('ended');
        } else {
          this.statechange.emit(this._state);
        }

      };

      this.startplaying = new Date().getTime();
      this.endplaying = this.startplaying + duration.unix;
      this.javascriptNode.onaudioprocess = drawFunc;
      if (duration.samples <= 0) {
        // important: source.start needs seconds, not samples!
        this.source.start(0, begintime.seconds);
      } else {
        // important: source.start needs seconds, not samples!
        this.source.start(0, begintime.seconds, duration.seconds);
      }
      this.statechange.emit('started');

      return true;
    }

    return false;
  }

  public rePlayback(): boolean {
    this.replay = !this.replay;
    return this.replay;
  }

  public stepBackward(callback: () => void) {
    this.stepbackward = true;
    if (this.audioplaying) {
      this._state = 'backward';
      const obj: EventListenerOrEventListenerObject = () => {
        this.source.removeEventListener('ended', obj);
        callback();
        this.stepbackward = false;
      };

      this.source.addEventListener('ended', obj);
      this.source.stop(0);
    } else {
      callback();
    }
  }

  /**
   * loadAudio(url) loads the audio data referred to via the URL in an AJAX call.
   * The audiodata is written to the local audiobuffer field.
   *
   * audio data; for longer data, a MediaElementAudioSourceNode should be used.
   */
  public loadAudio = (url: string, callback: any = () => {
  }, errorcallback?: (err: any) => void) => {
    this.loaded = false;

    const options = new RequestOptions({
      responseType: ResponseContentType.ArrayBuffer
    });

    const request = this.http.get(url, options).subscribe(
      (result) => {

        const buffer = this.extractData(result);
        Logger.info('Audio (Length: ' + buffer.byteLength + ') loaded. Decode now...');
        this.decodeAudio(buffer, callback, errorcallback);
      },
      error => {
        errorcallback(error);
      }
    );
  }

  public decodeAudio = (result: ArrayBuffer, callback: any = () => {
  }, errorcallback?: (any) => void) => {
    Logger.log('Decode audio...');
    const samplerate = this.getSampleRate(result);
    decodeAudioFile(result, samplerate).then((buffer) => {
      Logger.log('Audio decoded.');
      this._audiobuffer = buffer;
      this.duration = new AudioTime(buffer.length, buffer.sampleRate);
      this.gainNode = this.audiocontext.createGain();
      this.source = this.getSource();

      this.loaded = true;
      this.afterloaded.emit({status: 'success', error: ''});
      callback();
    }, () => {
      this.loaded = false;
      errorcallback({});
      this.afterloaded.emit({status: 'error', error: 'Error decoding audio file'});
    });
  }

  private extractData(result: Response) {
    const data = result.arrayBuffer();
    return data;
  }

  public getSource(): AudioBufferSourceNode {
    this._source = this._audiocontext.createBufferSource();
    return this._source;
  }

  public updateChannel(): Float32Array {
    if (this.audiobuffer) {
      this._channel = this.audiobuffer.getChannelData(0);
      return this._channel;
    }
    return null;
  }

  public getChannelBuffer(chunk: any, innerWidth: number): Float32Array {
    if (chunk && !isNullOrUndefined(this.channel)) {
      // if channel is detached, fix for firefox
      if (this.channel.length === 0) {
        this.updateChannel();
      }

      const new_float: Float32Array = new Float32Array(this._channel);
      let chunk_buffer = new_float; // copy array

      chunk_buffer = chunk_buffer.subarray(chunk.time.start.samples, chunk.time.end.samples);
      return chunk_buffer;
    }

    return null;
  }

  public createNewAudiobuffer(chunk: any, innerWidth: number): AudioBuffer {

    const channel_data = this.getChannelBuffer(chunk, innerWidth);
    const new_buffer = this._audiocontext.createBuffer(this.audiobuffer.numberOfChannels, channel_data.length, this.audiobuffer.sampleRate);
    const new_channel_data = new_buffer.getChannelData(0);

    // copy frames
    for (let i = 0; i < channel_data.length; i++) {
      new_channel_data[i] = channel_data[i];
    }

    return new_buffer;
  }

  public changeAudiobuffer(chunk: any, innerWidth: number) {
    this._audiobuffer = this.createNewAudiobuffer(chunk, innerWidth);
    this.duration = AudioTime.fromSeconds(this._audiobuffer.duration, this.samplerate);
  }

  private handleError(err: any) {
    const errMsg = err;
    console.log('err:');
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }

  private getSampleRate(buf: ArrayBuffer): number {
    const bufferPart = buf.slice(24, 28);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  public getDataRate(buf: ArrayBuffer): number {
    const bufferPart = buf.slice(34, 36);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  public destroy(disconnect: boolean = true) {
    if (!isNullOrUndefined(this._audiocontext)) {
      if (disconnect) {
        this._audiocontext.close()
          .then(() => {
            console.info('audioservice successfully destroyed');
          })
          .catch(
            (re) => {
              console.error('close audiocontext error:');
              console.log(re);
            }
          );
      }

      if (!isNullOrUndefined(this._source)) {
        this._source.disconnect();
      }

      this._audiobuffer = null;
      this._source = null;
      this._gainNode = null;
      this._channel = null;
      this._duration = null;
    }
  }
}
