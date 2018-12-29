import {AudioInfo} from './AudioInfo';
import {
  AudioChunk,
  AudioFormat,
  AudioRessource,
  AudioSelection,
  BrowserAudioTime,
  BrowserSample,
  OriginalAudioTime,
  OriginalSample,
  PlayBackState,
  SourceType
} from '../index';
import {EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs';

declare var window: any;

export class AudioManager {
  get lastUpdate(): number {
    return this._lastUpdate;
  }
  get bufferedOLA(): any {
    return this._bufferedOLA;
  }

  get mainchunk(): AudioChunk {
    return this._mainchunk;
  }

  get isScriptProcessorCanceled(): boolean {
    return this._isScriptProcessorCanceled;
  }

  get playposition(): BrowserAudioTime {
    return this._playposition;
  }

  get originalInfo(): AudioInfo {
    return this._originalInfo;
  }

  get state(): PlayBackState {
    return this._state;
  }

  public get browserSampleRate(): number {
    return this._ressource.audiobuffer.sampleRate;
  }

  public get originalSampleRate(): number {
    return this._originalInfo.samplerate;
  }

  set playbackInfo(value: { endAt: number; started: number }) {
    this._playbackInfo = value;
  }

  get playbackInfo(): { endAt: number; started: number } {
    return this._playbackInfo;
  }

  get playOnHover(): boolean {
    return this._playOnHover;
  }

  set playposition(value: BrowserAudioTime) {
    this._playposition = value;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  /*
  get source(): AudioBufferSourceNode {
    return this._source;
  }*/

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

  /**
   * return the factor of the difference between the original and the decoded sample rate. If it's not Safari, the factor is always 1.
   */

  /*
  public get sampleRateFactor(): number {
    return (!(this._originalInfo.samplerate === null || this._originalInfo.samplerate === undefined)
      && !(this.ressource.info.samplerate === null || this.ressource.info.samplerate === undefined))
      ? this._originalInfo.samplerate / this.ressource.info.samplerate : 1;
  }*/

  get isPlaying(): boolean {
    return (this._state === PlayBackState.PLAYING);
  }

  /**
   * initializes audio manager
   * @param audioinfo important info about the audio file linked to this manager
   */
  constructor(audioinfo: AudioInfo, browserSampleRate: number) {
    this._id = ++AudioManager.counter;
    this._originalInfo = audioinfo;
    this._bufferedOLA = new BufferedOLA(this._bufferSize);
    this._bufferedOLA.set_window_type('Triangular');

    if (!(audioinfo === null || audioinfo === undefined)) {
      // Fix up for prefixing
      const AudioContext = (<any>window).AudioContext // Default
        || (<any>window).webkitAudioContext // Safari and old versions of Chrome
        || (<any>window).mozAudioContext
        || false;
      if (AudioContext) {
        if ((this._audioContext === null || this._audioContext === undefined)) {
          // reuse old audiocontext
          this._audioContext = new AudioContext();
        }

        this._playposition = new BrowserAudioTime(new BrowserSample(0, browserSampleRate), audioinfo.samplerate);
        this._state = PlayBackState.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
      }
    }
  }

  private static counter = 0;
  private _id: number;
  private _ressource: AudioRessource;
  private _originalInfo: AudioInfo;
  private _state: PlayBackState;
  private _mainchunk: AudioChunk;
  private _playposition: BrowserAudioTime;
  private _playOnHover = false;
  private _stepBackward = false;
  private stateRequest: PlayBackState = null;
  private _isScriptProcessorCanceled = false;
  private _bufferedOLA: any;
  private _lastUpdate: number;

  // timestamp when playing should teminate
  private _playbackInfo = {
    started: 0,
    endAt: 0
  };

  // variables needed for initializing audio
  // private _source: AudioBufferSourceNode = null;
  private _audioContext: AudioContext = null;
  private _gainNode: GainNode = null;
  private _scriptProcessorNode: ScriptProcessorNode = null;
  // only the Audiomanager may have the channel array
  private _channel: Float32Array;

  private _frameSize = 2048;
  private _bufferSize = 2048;

  private chunks: AudioChunk[] = [];

  // events
  public afterdecoded: EventEmitter<AudioRessource> = new EventEmitter<AudioRessource>();
  public afterloaded: EventEmitter<any> = new EventEmitter<any>();
  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();


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
                               audioformats: AudioFormat[], keepbuffer = false): Promise<AudioManager> => {
    return new Promise<AudioManager>((resolve, reject) => {
      console.log(`Decode audio... ${filename}`);

      const audioformat: AudioFormat = AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats);

      if (audioformat !== undefined) {
        audioformat.init(buffer);

        let audioinfo = null;
        try {
          audioinfo = audioformat.getAudioInfo(filename, type, buffer);

        } catch (err) {
          reject(err.message);
        }

        if (audioinfo !== null) {
          const buffer_length = buffer.byteLength;
          let buffer_copy = null;

          if (keepbuffer) {
            buffer_copy = buffer.slice(0);
          }
          AudioManager.decodeAudioFile(buffer, audioinfo.samplerate).then((audiobuffer: AudioBuffer) => {

            console.log(`audio decoded, samplerate ${audioinfo.samplerate}, ${audiobuffer.sampleRate}`);

            console.log(`audioinfo:`);
            console.log(audioinfo);
            const result = new AudioManager(audioinfo, audiobuffer.sampleRate);
            result.bufferedOLA.set_audio_buffer(audiobuffer);

            console.log(`original samplerate: ${audioinfo.samplerate}`);
            audioinfo = new AudioInfo(filename, type, buffer_length, audiobuffer.sampleRate,
              audiobuffer.length, audiobuffer.numberOfChannels, audioinfo.bitrate);

            result.setRessource(new AudioRessource(filename, SourceType.ArrayBuffer,
              audioinfo, (buffer_copy === null) ? buffer : buffer_copy, audiobuffer, buffer_length));

            // set duration is very important
            result.ressource.info.duration.browserSample.value = audiobuffer.length;
            console.log(`duration browser: ${result.ressource.info.duration.browserSample.seconds}`);
            console.log(`duration original: ${result.ressource.info.duration.originalSample.seconds}`);
            console.log(`dur ${audiobuffer.length / audiobuffer.sampleRate}`);
            console.log(`decoded samplerate: ${audiobuffer.sampleRate}`);

            const selection = new AudioSelection(
              result.createBrowserAudioTime(0),
              result.createBrowserAudioTime(audiobuffer.length)
            );
            result._mainchunk = new AudioChunk(selection, result);

            result.afterdecoded.emit(result.ressource);
            result.prepareAudioPlayBack();
            resolve(result);
          }).catch((error) => {
            reject(error);
          });
        }
      } else {
        reject(`audio format not supported`);
      }
    });
  }

  /**
   * decodes the audio file and keeps its samplerate using OfflineAudioContext
   * @param file the files content as ArrayBuffer
   * @param sampleRate the file's sample rate
   */
  public static decodeAudioFile(file: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      audioCtx.decodeAudioData(file, function (buffer) {
        resolve(buffer);
      });
      /*
      // TODO CHANGE!
      if ('Firefox'.indexOf('Safari') > -1) {
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
          const context = new OfflineAudioContext(2, Math.ceil(buffer.duration * sampleRate), sampleRate);
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
      }*/
    });
  }

  public static isValidFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== null;
  }

  public startPlayback(begintime: BrowserAudioTime,
                       duration: BrowserAudioTime = new BrowserAudioTime(
                         new BrowserSample(0, this.browserSampleRate), this.originalSampleRate
                       ),
                       volume: number, speed: number, onProcess: () => void, playOnHover: boolean = false
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isPlaying) {
        this._playOnHover = playOnHover;
        this.changeState(PlayBackState.STARTED);
        this._stepBackward = false;
        this._scriptProcessorNode = this._audioContext.createScriptProcessor(this._bufferSize, 2, 2);

        // connect modules of Web Audio API
        this._gainNode.gain.value = volume;
        let lastCheck = Date.now();
        this._scriptProcessorNode.connect(this._audioContext.destination);
        this._gainNode.connect(this._audioContext.destination);

        this._playbackInfo.started = new Date().getTime();
        this._playbackInfo.endAt = this._playbackInfo.started + (duration.browserSample.unix / speed);

        this._playposition = begintime.clone();
        this._bufferedOLA.position = this._playposition.browserSample.value;
        this._scriptProcessorNode.addEventListener('audioprocess', (e) => {
          if (this.stateRequest === PlayBackState.PLAYING) {
            // start playback
            this.stateRequest = null;
            this.changeState(PlayBackState.PLAYING);
            lastCheck = Date.now();
          }
          if (!this._isScriptProcessorCanceled) {
            if (this.stateRequest === PlayBackState.STOPPED || this.stateRequest === PlayBackState.PAUSED) {
              // audio ended
              this.afterAudioEnded();
            } else {
              this._isScriptProcessorCanceled = false;
              if (this.isPlaying) {
                this._playposition.browserSample.value = this._bufferedOLA.position;
                onProcess();
                const endTime = this.createBrowserAudioTime(begintime.browserSample.value + duration.browserSample.value);
                if (this._playposition.browserSample.unix <= endTime.browserSample.unix) {
                  this._bufferedOLA.alpha = 1 / speed;
                  this._bufferedOLA.process(e.inputBuffer, e.outputBuffer);
                } else {
                  this.afterAudioEnded();
                }
              }
            }
            lastCheck = Date.now();
            this._lastUpdate = lastCheck;
          }
        });

        this.changeState(PlayBackState.PLAYING);

        return true;
      } else {
        this.statechange.error(new Error('AudioManager: Can\'t play audio because it is already playing'));
        return false;
      }
    });
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this.stateRequest = PlayBackState.STOPPED;
        const subscr: Subscription = this.statechange.subscribe((state) => {
          if (state === PlayBackState.STOPPED) {
            subscr.unsubscribe();
            resolve();
          }
        }, (error) => {
          reject(error);
        });

      } else {
        reject(`can't stop because audio manager is not playing`);
      }
    });
  }

  public pausePlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPlaying) {
        this.stateRequest = PlayBackState.PAUSED;
        const subscr: Subscription = this.statechange.subscribe((state) => {
          if (state === PlayBackState.PAUSED) {
            subscr.unsubscribe();
            resolve();
          }
        }, (error) => {
          reject(error);
        });
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
    this._scriptProcessorNode.disconnect();
    this._isScriptProcessorCanceled = false;

    if (this._state === PlayBackState.PLAYING && this.stateRequest === null) {
      // audio ended normally
      this.playposition.browserSample.value = 0;
      this.changeState(PlayBackState.ENDED);
    } else if (this.stateRequest !== null) {
      this.changeState(this.stateRequest);
      this.stateRequest = null;
    }
    // toDoCall is very important. It's relative to its context (pause, stop, back etc.).
    // this.toDoCall();
  }

  /**
   * prepares the audio manager for play back
   */
  public prepareAudioPlayBack() {
    this._gainNode = this._audioContext.createGain();

    // get channel data
    if ((this._channel === null || this._channel === undefined) || this._channel.length === 0) {
      this._channel = new Float32Array(this._ressource.audiobuffer.getChannelData(0));
    }

    this._state = PlayBackState.INITIALIZED;
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

      /*
      if (!(this._source === null || this._source === undefined)) {
        this._source.disconnect();
      }*/
    }
  }

  public createBrowserAudioTime(sample: number): BrowserAudioTime {
    return new BrowserAudioTime(new BrowserSample(sample, this.browserSampleRate), this.originalSampleRate);
  }

  public createOriginalAudioTime(sample: number): OriginalAudioTime {
    return new OriginalAudioTime(new OriginalSample(sample, this.originalSampleRate), this.browserSampleRate);
  }
}

