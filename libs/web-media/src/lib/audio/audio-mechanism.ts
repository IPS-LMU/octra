import { AudioSelection, SampleUnit } from '@octra/media';
import { Observable, of, Subject } from 'rxjs';
import { AudioResource } from '@octra/web-media';
import { SubscriptionManager } from '@octra/utilities';

declare let window: any;

export interface AudioMechanismPrepareOptions {
  filename: string;
  type: string;
  buffer?: ArrayBuffer;
  url?: string;
}

export abstract class AudioMechanism {
  get resource(): AudioResource | undefined {
    return this._resource;
  }

  protected audioSelection?: AudioSelection;
  protected volume?: number;
  protected _playbackRate = 1;
  protected playOnHover?: boolean;
  protected stepBackward = false;
  protected _gainNode?: GainNode;
  protected _sampleRate?: number;
  protected _source?: AudioBufferSourceNode | MediaElementAudioSourceNode;
  protected _channel?: Float32Array;
  protected _resource?: AudioResource;
  protected _audioContext?: AudioContext;
  public missingPermission = new Subject<void>();
  protected subscrManager = new SubscriptionManager();

  get audioContext(): AudioContext | undefined {
    return this._audioContext;
  }

  protected statistics = {
    decoding: {
      started: 0,
      duration: 0,
    },
  };

  // events
  public onChannelDataChange = new Subject<void>();
  public afterDecoded: Subject<AudioResource> = new Subject<AudioResource>();

  abstract get playPosition(): SampleUnit | undefined;
  abstract set playPosition(value: SampleUnit | undefined);

  abstract get playBackRate(): number;
  abstract set playBackRate(value: number);

  public prepare(options: AudioMechanismPrepareOptions): Observable<{
    progress: number;
  }> {
    this.initAudioContext();
    return of({
      progress: 0,
    });
  }

  protected abstract decodeAudio(resource: AudioResource): Subject<{
    progress: number;
  }>;

  /**
   * initializes the audio context
   * @private
   */
  protected initAudioContext() {
    const audioContext =
      window.AudioContext || // Default
      window.webkitAudioContext || // Safari and old versions of Chrome
      window.mozAudioContext ||
      false;
    if (audioContext) {
      if (this._audioContext === undefined || this._audioContext === null) {
        // reuse old audiocontext
        this._audioContext = new audioContext();
      }
    }
  }

  public async play(
    audioSelection: AudioSelection,
    volume: number,
    playbackRate: number,
    playOnHover: boolean,
    onPlaying: () => void,
    onEnd: () => void,
    onError: () => void
  ) {
    this.audioSelection = audioSelection;
    this.volume = volume;
    this.playOnHover = playOnHover;
    this._playbackRate = playbackRate;
    this.playOnHover = playOnHover;
    this.stepBackward = false;

    if (
      this._audioContext === undefined ||
      this._audioContext.state === 'closed'
    ) {
      this.initAudioContext();
    }
  }

  public abstract initalizeSource(): void;

  protected afterAudioContextResumed() {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (this._gainNode === undefined) {
      this._gainNode = this.audioContext!.createGain();
    }

    // create an audio context and hook up the video element as the source
    if (this._source === undefined) {
      this.initalizeSource();
    }
  }

  public abstract stop(): Promise<void>;

  public abstract pause(): Promise<void>;

  public async destroy(disconnect = false) {
    if (disconnect) {
      await this._audioContext?.close();
    }
    this.subscrManager.destroy();
  }
}
