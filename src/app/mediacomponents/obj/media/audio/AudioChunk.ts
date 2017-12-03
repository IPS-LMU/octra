import {AudioSelection} from './AudioSelection';
import {AudioManager} from './AudioManager';
import {isNullOrUndefined} from 'util';
import {AudioTime} from './AudioTime';
import {PlayBackState} from '../index';
import {EventEmitter} from '@angular/core';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';

interface Interval {
  start: number;
  end: number;
}

export class AudioChunk {
  static get counter(): number {
    return this._counter;
  }

  get lastplayedpos(): AudioTime {
    return this._lastplayedpos;
  }

  get state(): PlayBackState {
    return this._state;
  }

  get audiomanager(): AudioManager {
    return this._audiomanger;
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

  private static _counter = 0;

  private _selection: AudioSelection = null;
  private _time: AudioSelection = null;
  private _id;
  private _audiomanger: AudioManager;
  private _state: PlayBackState = PlayBackState.PREPARE;

  private _volume = 1;
  private _speed = 1;
  private _playposition: AudioTime;
  private _lastplayedpos: AudioTime;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

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

    this._id = ++AudioChunk._counter;
  }

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!isNullOrUndefined(selection)) {
      return this.audiomanager.channel.subarray(selection.start.samples, selection.end.samples);
    }

    return null;
  }

  public startPlayback(drawFunc: () => void, playonhover: boolean = false): boolean {
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
      const id = this.subscrmanager.add(this.audiomanager.statechange.subscribe(
        (state: PlayBackState) => {
          this.checkState(state);
          this.setState(state);

          if (state === PlayBackState.STOPPED || state === PlayBackState.PAUSED || state === PlayBackState.ENDED) {
            this.subscrmanager.remove(id);
          }
        },
        (error) => {
          console.error(error);
        }
      ));

      return this._audiomanger.startPlayback(
        this.selection.start, this.selection.duration, this._volume, this._speed, drawFunc, playonhover
      );
    }
    return false;
  }

  public stopPlayback(): boolean {
    const stopped = this._audiomanger.stopPlayback();
    this.startpos = this.time.start.clone();

    if (!stopped) {
      // audio was not playing
      this.setState(PlayBackState.STOPPED);
    }

    return true;
  }

  public pausePlayback(): boolean {
    return this.audiomanager.pausePlayback();
  }

  public rePlayback(): boolean {
    return this._audiomanger.rePlayback();
  }

  public stepBackward() {
    if (!isNullOrUndefined(this.lastplayedpos)) {
      this.startpos = this.lastplayedpos.clone();
      const result = this.audiomanager.stepBackward();

      if (!result) {
        // audio was not playing
        this.audiomanager.stepbackward = true;
        this.setState(PlayBackState.STOPPED);
      }

      return result;
    } else {
      console.error('lastplayedpos is null');
    }

    return false;
  }

  public stepBackwardTime(back_sec: number) {
    const back_samples = Math.max(0, (this.playposition.samples
      - (Math.round(back_sec * this.audiomanager.ressource.info.samplerate))));
    this.startpos = new AudioTime(back_samples, this.audiomanager.ressource.info.samplerate);

    const result = this.audiomanager.stepBackwardTime(back_samples);

    if (!result) {
      // audio was not playing
      this.audiomanager.stepbackward = true;
      this.setState(PlayBackState.STOPPED);
    }
    return result;
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

      if (this.isPlaying) {
        const playduration = (this._audiomanger.endplaying - timestamp) * this.speed;
        this._playposition.unix = this.selection.start.unix + this.selection.duration.unix - playduration;

      } else if (this.state === PlayBackState.ENDED) {
        this._playposition = this.selection.start.clone();
      } else if (this.state === PlayBackState.PAUSED) {
      }

      this.audiomanager.playposition = this._playposition.samples;
    }
  }

  private setState(state: PlayBackState) {
    if (this._state !== state || state === PlayBackState.STOPPED) {
      this._state = state;
      this.statechange.emit(state);
    }
  }

  private afterPlaybackStopped() {
    this.startpos = this.time.start.clone();
    this.audiomanager.replay = false;
  }

  private afterPlaybackPaused() {
    this.startpos = this.playposition.clone();
  }

  private afterPlaybackEnded() {
    if (this.selection.end.samples === this.time.end.samples) {
      this.startpos = this.time.start.clone();
    }
  }

  private checkState(newstate: PlayBackState) {
    switch (newstate) {
      case(PlayBackState.STOPPED):
        if (!this.audiomanager.stepbackward) {
          this.afterPlaybackStopped();
        }
        break;
      case (PlayBackState.PAUSED):
        this.afterPlaybackPaused();
        break;
      case (PlayBackState.ENDED):
        this.afterPlaybackEnded();
        break;
      default:
        break;
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

  public get isPlayBackStopped(): boolean {
    return this._state === PlayBackState.STOPPED;
  }

  public clone() {
    return new AudioChunk(this.time.clone(), this.audiomanager, this.selection);
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
