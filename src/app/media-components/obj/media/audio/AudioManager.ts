import {AudioInfo} from './AudioInfo';
import {
  AudioChunk,
  AudioFormat,
  AudioRessource,
  AudioSelection,
  BrowserAudioTime,
  BrowserSample,
  PlayBackState,
  SourceType
} from '../index';
import {EventEmitter} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {AudioDecoder} from './AudioDecoder';

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

  get channelData(): {
    sampleRate: number,
    factor: number,
    data: Float32Array
  } {
    return this._channelData;
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
      const audioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || window.mozAudioContext
        || false;
      if (audioContext) {
        if ((this._audioContext === null || this._audioContext === undefined)) {
          // reuse old audiocontext
          this._audioContext = new audioContext();
        }

        this._playposition = new BrowserAudioTime(new BrowserSample(0, browserSampleRate), audioinfo.samplerate);
        this._state = PlayBackState.PREPARE;
      } else {
        console.error('AudioContext not supported by this browser');
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
  private stateRequest: PlayBackState = null;
  private _isScriptProcessorCanceled = false;
  private readonly _bufferedOLA: any;
  private _lastUpdate: number;

  // timestamp when playing should teminate
  private _playbackInfo = {
    started: 0,
    endAt: 0
  };

  // variables needed for initializing audio
  // private _source: AudioBufferSourceNode = null;
  private readonly _audioContext: AudioContext = null;
  private _gainNode: GainNode = null;
  private _scriptProcessorNode: ScriptProcessorNode = null;
  // only the Audiomanager may have the channelData array
  private _channelData: {
    sampleRate: number,
    factor: number,
    data: Float32Array
  };

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
  public static getFileFormat(extension: string, audioformats: AudioFormat[]): AudioFormat | undefined {
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
              audioinfo, bufferCopy, audioBuffer, bufferLength));

            result.bufferedOLA.set_audio_buffer(audioBuffer);

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

            result.afterdecoded.emit(result.ressource);
            result.prepareAudioPlayBack();

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

    // get channelData data
    if ((this._channelData === null || this._channelData === undefined) || this._channelData.data.length === 0) {
      this._channelData = {
        data: this._ressource.audiobuffer.getChannelData(0),
        factor: 1,
        sampleRate: this._ressource.audiobuffer.sampleRate
      };

      console.log(`channel hast length of ${this._channelData.data.byteLength} bytes and ${this._channelData.data.length} values`);
      console.log(this.ressource.audiobuffer.length);
      this.minimizeChannelArray();
    }

    this._state = PlayBackState.INITIALIZED;
    this.afterloaded.emit({status: 'success', error: ''});
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

  public createBrowserAudioTime(sample: number): BrowserAudioTime {
    return new BrowserAudioTime(new BrowserSample(sample, this.browserSampleRate), this.originalSampleRate);
  }
}

