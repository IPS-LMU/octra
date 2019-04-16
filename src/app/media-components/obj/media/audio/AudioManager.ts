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
  SourceType,
  WavFormat
} from '../index';
import {EventEmitter} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {AudioDecoder, SegmentToDecode} from './AudioDecoder';

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

        // const sampleDur = new OriginalSample(Math.min(30 * audioformat.sampleRate, audioformat.duration), audioformat.sampleRate);

        console.log(`decode!`);
        AudioManager.decoder.onaudiodecode.subscribe((obj) => {
          if (obj.result !== null) {
            // get result;
            const audioBuffer = obj.result;
            const result = new AudioManager(audioinfo, audioBuffer.sampleRate);

            audioinfo = new AudioInfo(filename, type, bufferLength, audioBuffer.sampleRate,
              audioBuffer.sampleRate * audioformat.duration / audioformat.sampleRate,
              audioformat.sampleRate, audioBuffer.numberOfChannels, audioinfo.bitrate);

            audioinfo.file = new File([buffer], filename, {type: 'audio/wav'});
            result.setRessource(new AudioRessource(filename, SourceType.ArrayBuffer,
              audioinfo, buffer, audioBuffer, bufferLength));

            result.bufferedOLA.set_audio_buffer(audioBuffer);

            console.log(result.ressource);
            // set duration is very important
            console.log(`sampleRate browser: ${result.browserSampleRate}`);
            console.log(`sampleRate original: ${result.originalSampleRate}`);
            console.log(`original duration ${result.ressource.info.duration.originalSample.seconds}`);
            console.log(`browser duration ${result.ressource.info.duration.browserSample.seconds}`);
            console.log(`audiobuffer duration ${audioBuffer.duration}`);
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
        console.log(`sampleDur has length of ${sampleDur / audioformat.sampleRate} seconds`);

        AudioManager.decoder.decodeChunked(0, sampleDur);
      }
    } else {
      subj.error(`audio format not supported`);
    }

    return subj;
  }


  private static getNumberOfDataParts(fileSize: number): number {
    const mb = fileSize / 1024 / 1024;

    if (mb > 10) {

      // make chunks of 10 mb
      return Math.ceil(mb / 10);
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

  public static isValidFileName(filename: string, audioformats: AudioFormat[]): boolean {
    return AudioManager.getFileFormat(filename.substr(filename.lastIndexOf('.')), audioformats) !== null;
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

  private decodeNewPart(segmentToDecode: SegmentToDecode, isFirst = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`DECODE NEW PART:`);
      const started = Date.now();
      console.log(segmentToDecode);
      const format = new WavFormat();
      format.init(this.ressource.info.name, this.ressource.arraybuffer);
      const decoder = new AudioDecoder(format, this.ressource.arraybuffer);
      console.log(`BROWSER SAMPLERATE IS: ${this._ressource.info.samplerate}`);

      decoder.decodePartOfAudioFile(segmentToDecode).then((audiobuffer2) => {
        const length = Date.now() - started;
        console.log(`NEW BUFFER! ${length / 1000}`);
        if (!isFirst) {
          // append
          const newBuffer = decoder.appendAudioBuffer(this._ressource.audiobuffer, audiobuffer2);
          this._ressource.audiobuffer = newBuffer;
          this.bufferedOLA.set_audio_buffer(this._ressource.audiobuffer);
        } else {
          this._ressource.audiobuffer = audiobuffer2;
          this.bufferedOLA.set_audio_buffer(this._ressource.audiobuffer);
        }

        console.log('buffer set ok!');
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  private decodeAudioChunked(): Subject<{
    progress: number,
    result: AudioBuffer
  }> {
    const subj = new Subject<{
      progress: number,
      result: AudioBuffer
    }>();


    return subj;
  }
}

