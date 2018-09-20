import {AudioSelection} from './AudioSelection';
import {AudioManager} from './AudioManager';
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

  get audiomanager(): AudioManager {
    return this._audiomanger;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   * @param value
   */
  public set startpos(value: AudioTime) {
    if ((value === null || value === undefined)) {
      throw new Error('start pos is null!');
    }
    if ((this.selection === null || this.selection === undefined)) {
      this.selection = new AudioSelection(value.clone(), this.time.end.clone());
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end.clone();
    }
    this._playposition = this.selection.start.clone();
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
    this._audiomanger.gainNode.gain.value = value;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    if (value > 0) {
      this._speed = value;
      this._audiomanger.source.playbackRate.value = value;
      this._audiomanger.endplaying = this._audiomanger.endplaying * this._speed;
    }
  }

  get playposition(): AudioTime {
    return this._playposition;
  }

  set playposition(value: AudioTime) {
    this._playposition = value;
  }

  get lastplayedpos(): AudioTime {
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

  constructor(time: AudioSelection, audio_manager: AudioManager, selection?: AudioSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('AudioChunk constructor needs two correct AudioTime objects');
    }

    if (!(audio_manager === null || audio_manager === undefined)) {
      this._audiomanger = audio_manager;
      this._playposition = new AudioTime(time.start.samples, this._audiomanger.ressource.info.samplerate);
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
  private _audiomanger: AudioManager;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  private _selection: AudioSelection = null;

  private _time: AudioSelection = null;

  private _id;

  private _state: PlayBackState = PlayBackState.PREPARE;

  private _volume = 1;

  private _speed = 1;

  private _playposition: AudioTime;

  private _lastplayedpos: AudioTime;
  /**
   * calculate current position of the current audio playback.
   * TODO when does this method must be called? Animation of playcursor or at another time else?
   * @returns {number}
   */
  public updatePlayPosition = () => {
    if (!(this.selection === null || this.selection === undefined)) {
      const timestamp = new Date().getTime();

      if ((this._playposition === null || this._playposition === undefined)) {
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

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!(selection === null || selection === undefined)) {
      return this.audiomanager.channel.subarray(selection.start.samples, selection.end.samples);
    }

    return null;
  }

  public startPlayback(drawFunc: () => void, afterAudioEnded: () => void, playonhover: boolean = false): boolean {
    if ((this._selection === null || this._selection === undefined)) {
      this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
    }

    if (this._selection.start.samples === this._selection.end.samples) {
      this.startpos = this._selection.start.clone();
    }

    if (!this._audiomanger.audioplaying) {
      this.setState(PlayBackState.STARTED);

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
        this.selection.start, this.selection.duration, this._volume, this._speed, drawFunc, afterAudioEnded, playonhover
      );
    } else {
      console.error(`can't start playback on chunk because audiomanager is still playing`);
    }
    return false;
  }

  public stopPlayback = (afterAudioEnded: () => void) => {
    this._audiomanger.stopPlayback(() => {
      this.afterPlaybackStopped();
      afterAudioEnded();
    });
  }

  public pausePlayback(afterAudioEnded: () => void): boolean {
    if (this.audiomanager.state !== this.state && this.state === PlayBackState.PLAYING) {
      console.error(`audiomanager and chunk have different states: a:${this.audiomanager.state}, c:${this.state}`);
    }
    return this.audiomanager.pausePlayback(() => {
      this.afterPlaybackPaused();
      afterAudioEnded();
    });
  }

  public rePlayback(): boolean {
    return this._audiomanger.rePlayback();
  }

  public stepBackward(afterAudioEnded: () => void) {
    if (!(this.lastplayedpos === null || this.lastplayedpos === undefined)) {
      this.startpos = this.lastplayedpos.clone();
      const result = this.audiomanager.stepBackward(() => {
        afterAudioEnded();
      });

      return result;
    } else {
      console.error('lastplayedpos is null');
    }

    return false;
  }

  public stepBackwardTime(drawFunc: () => void, afterAudioEnded: () => void, back_sec: number) {
    const back_samples = Math.max(0, (this.playposition.samples
      - (Math.round(back_sec * this.audiomanager.ressource.info.samplerate))));
    this.startpos = new AudioTime(back_samples, this.audiomanager.ressource.info.samplerate);

    const result = this.audiomanager.stepBackward(() => {
      if (this.audiomanager.state !== PlayBackState.PLAYING) {
        this.startPlayback(drawFunc, afterAudioEnded);
      } else {
        afterAudioEnded();
      }
    });

    return result;
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
    this.startpos = this.time.start.clone();
    this.audiomanager.replay = false;
  }

  private afterPlaybackPaused = () => {
    this.startpos = this.playposition.clone();
  }

  private afterPlaybackEnded = () => {
    if (this.selection.end.samples === this.time.end.samples) {
      this.startpos = this.time.start.clone();
    }
  }

  private checkState(newstate: PlayBackState) {
  }
}
