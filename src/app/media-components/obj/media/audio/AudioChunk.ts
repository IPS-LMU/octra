import {AudioSelection} from './AudioSelection';
import {EventEmitter} from '@angular/core';
import {AudioManager} from './AudioManager';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {BrowserAudioTime, BrowserSample} from './AudioTime';
import {PlayBackState} from '../index';

interface Interval {
  start: number;
  end: number;
}

export class AudioChunk {
  get replay(): boolean {
    return this._replay;
  }

  static get counter(): number {
    return this._counter;
  }

  get audiomanager(): AudioManager {
    return this._audioManger;
  }

  public get browserSampleRate(): number {
    return this._audioManger.browserSampleRate;
  }

  public get originalSampleRate(): number {
    return this._audioManger.originalSampleRate;
  }

  /**
   * sets the playposition and the audio chunk's selection. Be aware that this methods changes the
   * end position to the last sample every time it's called
   */
  public set startpos(value: BrowserAudioTime) {
    if ((value === null || value === undefined)) {
      throw new Error('start pos is null!');
    }
    if ((this.selection === null || this.selection === undefined)) {
      this.selection = new AudioSelection(value.clone(), this.time.end.clone());
    } else {
      this.selection.start = value.clone();
      this.selection.end = this.time.end.clone();
    }
    this._playposition = this.selection.start.clone() as BrowserAudioTime;
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
    this._audioManger.gainNode.gain.value = value;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    if (value > 0) {
      this._speed = value;
      // TODO does this make sense?
      this._audioManger.playbackInfo.endAt = this._audioManger.playbackInfo.endAt * this._speed;
    }
  }

  get playposition(): BrowserAudioTime {
    return this._playposition;
  }

  set playposition(value: BrowserAudioTime) {
    this._playposition = value;
  }

  get lastplayedpos(): BrowserAudioTime {
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

  constructor(time: AudioSelection, audioManager: AudioManager, selection?: AudioSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('AudioChunk constructor needs two correct AudioTime objects');
    }

    if (!(audioManager === null || audioManager === undefined)) {
      this._audioManger = audioManager;
      this._playposition = this._audioManger.createBrowserAudioTime(time.start.browserSample.value);
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
  private readonly _audioManger: AudioManager;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  private _selection: AudioSelection = null;

  private _time: AudioSelection = null;

  private readonly _id;

  private _state: PlayBackState = PlayBackState.PREPARE;

  private _volume = 1;

  private _speed = 1;

  private _playposition: BrowserAudioTime;

  private _lastplayedpos: BrowserAudioTime;

  private _replay = false;
  /**
   * calculate current position of the current audio playback.
   * TODO when does this method must be called? Animation of playcursor or at another time else?
   */
  public updatePlayPosition = () => {
    if (!(this.selection === null || this.selection === undefined)) {
      const timestamp = new Date().getTime();

      if ((this._playposition === null || this._playposition === undefined)) {
        this._playposition = this.time.start.clone() as BrowserAudioTime;
      } else {
        this._playposition.browserSample.value = this._audioManger.playposition.browserSample.value;
      }
    }
  }

  public getChannelBuffer(selection: AudioSelection): Float32Array {
    if (!(selection === null || selection === undefined)) {
      return this.audiomanager.channel.subarray(selection.start.browserSample.value, selection.end.browserSample.value);
    }

    return null;
  }

  public startPlayback(onProcess: () => void = () => {
  }, playOnHover: boolean = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isPlaying) {
        if ((this._selection === null || this._selection === undefined)) {
          this.selection = new AudioSelection(this.time.start.clone(), this.time.end.clone());
        }

        if (this._selection.start.browserSample.value === this._selection.end.browserSample.value) {
          this.startpos = this._selection.start.clone() as BrowserAudioTime;
        }

        this.setState(PlayBackState.STARTED);

        this._lastplayedpos = this.playposition.clone();
        this.audiomanager.playposition = this._lastplayedpos.clone();

        this.setState(PlayBackState.PLAYING);

        // console.log(`play from ${this.selection.start.seconds} to ${this.selection.start.seconds + this.selection.duration.seconds}`);
        const id = this.subscrmanager.add(this.audiomanager.statechange.subscribe(
          (state: PlayBackState) => {
            this.setState(state);

            if (state === PlayBackState.STOPPED || state === PlayBackState.PAUSED || state === PlayBackState.ENDED) {
              this.subscrmanager.remove(id);
            }

            if (state === PlayBackState.ENDED) {
              // reset to beginning of selection
              if (this._replay) {
                this.playposition = this.selection.start.clone() as BrowserAudioTime;
                this.startPlayback(onProcess, playOnHover);
              } else {
                this.startpos = this._time.start.clone() as BrowserAudioTime;
                resolve();
              }
            }
          },
          (error) => {
            console.error(error);
          }
        ));

        this._audioManger.startPlayback(
          this.selection.start as BrowserAudioTime, this.selection.duration as BrowserAudioTime, this._volume, this._speed, () => {
            this.updatePlayPosition();
            onProcess();
          }, playOnHover
        ).catch(reject);
      } else {
        reject(`can't start playback on chunk because audiomanager is still playing`);
      }
    });
  }

  /**
   * stops the playback
   */
  public stopPlayback: () => Promise<void> = () => {
    return new Promise<void>((resolve, reject) => {
      this._audioManger.stopPlayback().then(() => {
        this.afterPlaybackStopped();
        resolve();
      }).catch(reject);
    });
  }

  public pausePlayback(): Promise<void> {
    return this._audioManger.pausePlayback().then(() => {
      if (this.audiomanager.state !== this.state && this.state === PlayBackState.PLAYING) {
        console.error(`audiomanager and chunk have different states: a:${this.audiomanager.state}, c:${this.state}`);
      }
      this.afterPlaybackPaused();
    });
  }

  public stepBackward(onProcess: () => void = () => {
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!(this.lastplayedpos === null || this.lastplayedpos === undefined)) {
        if (this.audiomanager.isPlaying) {
          this.audiomanager.stopPlayback().then(() => {
            this.startpos = this.lastplayedpos.clone();
            this._audioManger.startPlayback(
              this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
                this.updatePlayPosition();
                onProcess();
              }
            ).then(resolve).catch(reject);
          }).catch(reject);
        } else {
          this.startpos = this.lastplayedpos.clone();
          this._audioManger.startPlayback(
            this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
              this.updatePlayPosition();
              onProcess();
            }
          ).then(resolve).catch(reject);
        }
      } else {
        reject('lastplayedpos is null');
      }
    });
  }

  public stepBackwardTime(backSec: number, onProcess: () => void = () => {
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const backSamples = Math.max(0, (this.playposition.browserSample.value
        - (Math.round(backSec * this._audioManger.browserSampleRate))));
      const backSample = new BrowserSample(backSamples, this._audioManger.browserSampleRate);

      if (this.audiomanager.isPlaying) {
        this.audiomanager.stopPlayback().then(() => {
          this.startpos = this._audioManger.createBrowserAudioTime(backSample.value);

          this._audioManger.startPlayback(
            this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
              this.updatePlayPosition();
              onProcess();
            }
          ).then(resolve).catch(reject);
        }).catch(reject);
      } else {
        this.startpos = this._audioManger.createBrowserAudioTime(backSample.value);

        this._audioManger.startPlayback(
          this.selection.start.clone() as BrowserAudioTime, this.selection.duration.clone() as BrowserAudioTime, 1, 1, () => {
            this.updatePlayPosition();
            onProcess();
          }
        ).then(resolve).catch(reject);
      }
    });
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
    this.startpos = this.time.start.clone() as BrowserAudioTime;
    if (this._replay) {
      this.toggleReplay();
    }
  }

  private afterPlaybackPaused = () => {
    this.playposition = this.audiomanager.playposition.clone();
    this.startpos = this.playposition.clone();
  }

  public toggleReplay() {
    this._replay = !this._replay;
  }
}
