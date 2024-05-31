import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
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
  get state(): PlayBackStatus {
    return this._state;
  }

  get channelDataFactor(): number | undefined {
    return this._channelDataFactor;
  }

  get channel(): Float32Array | undefined {
    return this._channel;
  }

  get resource(): AudioResource | undefined {
    return this._resource;
  }

  protected audioSelection?: AudioSelection;
  protected volume?: number;
  protected _playbackRate = 2;
  protected playOnHover?: boolean;
  protected stepBackward = false;
  protected _gainNode?: GainNode;
  protected _source?: AudioBufferSourceNode | MediaElementAudioSourceNode;
  protected _channel?: Float32Array;
  protected _resource?: AudioResource;
  protected _audioContext?: AudioContext;
  protected _channelDataFactor?: number;
  protected subscrManager = new SubscriptionManager();
  protected _state: PlayBackStatus = PlayBackStatus.PREPARE;

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
  public readonly onChannelDataChange = new Subject<void>();
  public readonly afterDecoded: Subject<AudioResource> =
    new Subject<AudioResource>();
  public readonly statechange: Subject<PlayBackStatus> =
    new Subject<PlayBackStatus>();
  public missingPermission = new Subject<void>();

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
      this._audioContext = new audioContext();
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

  protected changeStatus(newStatus: PlayBackStatus) {
    this._state = newStatus;
    this.statechange.next(this._state);
  }

  /**
   * stops the decoding process.
   */
  public abstract stopDecoding(): void;
}
