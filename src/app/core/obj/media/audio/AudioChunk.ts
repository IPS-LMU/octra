import {AudioSelection} from './AudioSelection';
import {AudioManager} from './AudioManager';
import {isNullOrUndefined} from 'util';
import {AudioTime} from './AudioTime';
import {PlayBackState} from '../index';
import {EventEmitter} from '@angular/core';

export class AudioChunk {
  get lastplayedpos(): AudioTime {
    return this._lastplayedpos;
  }

  get state(): PlayBackState {
    return this._state;
  }

  get audiomanager(): AudioManager {
    return this._audiomanger;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  get id() {
    return this._id;
  }

  get selection(): AudioSelection {
    return this._selection;
  }

  set selection(value: AudioSelection) {
    this._selection = value;
  }

  get playposition(): AudioTime {
    return this._playposition;
  }

  set playposition(value: AudioTime) {
    this._playposition = value;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   * @param value
   */
  public set startpos(value: AudioTime) {
    if (isNullOrUndefined(this.selection)) {
      this.selection = new AudioSelection(value.clone(), this.time.end.clone());
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end.clone();
    }
    this._playposition = this.selection.start.clone();
  }

  set speed(value: number) {
    if (value > 0) {
      this._speed = value;
      this._audiomanger.source.playbackRate.value = value;
      this._audiomanger.endplaying = this._audiomanger.endplaying * this._speed;
    }
  }

  get speed(): number {
    return this._speed;
  }

  set volume(value: number) {
    this._volume = value;
    this._audiomanger.gainNode.gain.value = value;
  }

  get volume(): number {
    return this._volume;
  }

  private static counter = 0;

  private _selection: AudioSelection = null;
  private _time: AudioSelection = null;
  private _id;
  private _channel: Float32Array;
  private _audiomanger: AudioManager;
  private _state: PlayBackState = PlayBackState.PREPARE;

  private _volume = 1;
  private _speed = 1;
  private _playposition: AudioTime;
  private _lastplayedpos: AudioTime;

  public statechange: EventEmitter<PlayBackState> = new EventEmitter<PlayBackState>();

  get time(): AudioSelection {
    return this._time;
  }

  set time(value: AudioSelection) {
    this._time = value;
  }

  constructor(time: AudioSelection, audio_manager: AudioManager, selection?: AudioSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('AudioChunk constructor needs two correct AudioTime objects');
    }

    if (!isNullOrUndefined(audio_manager)) {
      this._audiomanger = audio_manager;
      this._channel = this.getChannelBuffer(time);
      this._playposition = new AudioTime(time.start.samples, this._audiomanger.ressource.info.samplerate);
      this._state = PlayBackState.INITIALIZED;
    } else {
      throw new Error('AudioChunk needs an audiomanger reference');
    }

    if (!isNullOrUndefined(selection)) {
      this._selection = selection.clone();
    } else {
      this._selection = this._time.clone();
    }

    this._id = ++AudioChunk.counter;
  }

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!isNullOrUndefined(selection)) {
      if (isNullOrUndefined(this._channel) || this._channel.length === 0) {
        let chunk_buffer: Float32Array;

        if (isNullOrUndefined(this._audiomanger.mainchunk) || this._audiomanger.mainchunk.channel.length === 0) {
          chunk_buffer = new Float32Array(this._audiomanger.ressource.audiobuffer.getChannelData(0));
        } else {
          chunk_buffer = new Float32Array(this._audiomanger.mainchunk.channel);
        }
        chunk_buffer = chunk_buffer.subarray(selection.start.samples, selection.end.samples);
        return chunk_buffer;
      }
    }

    return null;
  }

  public startPlayback(drawFunc: () => void, playonhover: boolean = false): Promise<boolean> {

    return new Promise<boolean>((resolve, reject) => {
      if (isNullOrUndefined(this._selection)) {
        this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
      }

      if (this._selection.start.samples === this._selection.end.samples) {
        this.startpos = this._selection.start.clone();
      }

      if (!this._audiomanger.audioplaying) {
        this._state = PlayBackState.STARTED;

        this._lastplayedpos = this.playposition.clone();
        this.audiomanager.playposition = this._lastplayedpos.samples;

        this.setState(PlayBackState.PLAYING);

        // console.log(`play from ${this.selection.start.seconds} to ${this.selection.start.seconds + this.selection.duration.seconds}`);
        return this._audiomanger.startPlayback(
          this.selection.start, this.selection.duration, this._volume, this._speed, drawFunc, playonhover).then((result: boolean) => {
          if (this.state !== PlayBackState.PAUSED && this.state !== PlayBackState.STOPPED) {
            this.setState(PlayBackState.ENDED);
          }

          if (this.state === PlayBackState.PAUSED) {
            this.startpos = this.playposition.clone();
          }
          resolve(result);
        }).catch((err) => {
          reject(err);
        });
      } else {
        resolve(false);
      }
    });
  }

  public stopPlayback(callback: any = null): boolean {
    if (this._audiomanger.stopPlayback(callback)) {
      this.startpos = this.time.start.clone();
      this.setState(PlayBackState.STOPPED);
      return true;
    }

    return false;
  }

  public pausePlayback(): boolean {
    if (this._audiomanger.pausePlayback()) {
      this.setState(PlayBackState.PAUSED);
      return true;
    }

    return false;
  }

  public rePlayback(): boolean {
    return this._audiomanger.rePlayback();
  }

  public stepBackward(callback: () => void) {
    if (this._audiomanger.stepBackward(callback)) {
      this.setState(PlayBackState.PAUSED);
      return true;
    }

    return false;
  }

  public stepBackwardTime(callback: () => void) {
    if (this._audiomanger.stepBackwardTime(callback)) {
      this.setState(PlayBackState.PAUSED);
      return true;
    }

    return false;
  }

  /**
   * calculate current position of the current audio playback.
   * TODO when does this method must be called? Animation of playcursor or at another time else?
   * @returns {number}
   */
  public updatePlayPosition = () => {
    if (!isNullOrUndefined(this.selection)) {
      const timestamp = new Date().getTime();

      if (isNullOrUndefined(this._playposition)) {
        this._playposition = this.time.start.clone();
      }

      if (this._audiomanger.audioplaying) {
        const playduration = (this._audiomanger.endplaying - timestamp) * this.speed;
        this._playposition.unix = this.selection.start.unix + this.selection.duration.unix - playduration;
      } else if (this.state === PlayBackState.ENDED) {
        this._playposition = this.selection.end.clone();
      } else if (this.state === PlayBackState.PAUSED) {
      } else {
      }

      this.audiomanager.playposition = this._playposition.samples;
    } else {
    }
  };

  private setState(state: PlayBackState) {
    if (this._state !== state) {
      this._state = state;
      this.statechange.emit(state);
    }
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

  public clone() {
    return new AudioChunk(this.time.clone(), this.audiomanager, this.selection);
  }
}
