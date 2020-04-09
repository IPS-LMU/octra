import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {AudioChunk} from '../../../obj/audio/AudioManager';
import {SubscriptionManager} from '../../../obj/SubscriptionManager';
import {PlayBackStatus} from '../../../obj/audio';
import {isSet} from '../../../../core/shared/Functions';

export interface Buttons {
  play: {
    label: string,
    shortcut: string
  };
  pause: {
    label: string,
    shortcut: string
  };
  stop: {
    label: string,
    shortcut: string
  };
  replay: {
    label: string,
    shortcut: string
  };
  backward: {
    label: string,
    shortcut: string
  };
  backwardtime: {
    label: string,
    shortcut: string
  };
}

@Component({
  selector: 'octra-audio-navigation',
  templateUrl: './audio-navigation.component.html',
  styleUrls: ['./audio-navigation.component.css']
})
export class AudioNavigationComponent implements AfterViewInit, OnInit, OnChanges, OnDestroy {
  get isReady(): boolean {
    return this._isReady;
  }

  get replay(): boolean {
    return this._replay;
  }

  get isAudioPlaying(): boolean {
    return this._isAudioPlaying;
  }

  set volume(value: number) {
    this.volumeChange.emit({
      old_value: Number(this._volume),
      new_value: Number(value),
      timestamp: Date.now()
    });
    this._volume = value;
    this.audioChunk.volume = value;
  }

  get volume(): number {
    return this._volume;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    this.playbackRateChange.emit({
      old_value: Number(this._playbackRate),
      new_value: Number(value),
      timestamp: Date.now()
    });
    this._playbackRate = value;
    this.audioChunk.playbackRate = value;
  }

  @Output() buttonClick = new EventEmitter<{ type: string, timestamp: number }>();
  @Output() volumeChange = new EventEmitter<{ old_value: number, new_value: number, timestamp: number }>();
  @Output() afterVolumeChange = new EventEmitter<{ new_value: number, timestamp: number }>();
  @Output() playbackRateChange = new EventEmitter<{ old_value: number, new_value: number, timestamp: number }>();
  @Output() afterPlaybackRateChange = new EventEmitter<{ new_value: number, timestamp: number }>();

  @Input() responsive = false;
  @Input() easyMode = false;
  @Input() audioChunk: AudioChunk;
  @Input() stepBackwardTime = 500;

  private _replay = false;
  private _isReady = false;
  private _isAudioPlaying = false;
  private _volume = 1;
  private _playbackRate = 1;

  private subscrManager = new SubscriptionManager();

  @Input() buttons: Buttons = {
    play: {
      label: 'Play',
      shortcut: 'TAB'
    },
    pause: {
      label: 'Pause',
      shortcut: 'TAB'
    },
    stop: {
      label: 'Stop',
      shortcut: 'ESC'
    },
    replay: {
      label: 'Replay',
      shortcut: ''
    },
    backward: {
      label: 'Backward',
      shortcut: 'SHIFT + DEL'
    },
    backwardtime: {
      label: 'Backward in time',
      shortcut: 'SHIFT + DEL'
    }
  };

  constructor(private cd: ChangeDetectorRef) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  /**
   * this method is called only after a input changed (dirty check)
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!isSet(changes.audioChunk)) {
      const newAudioChunk: AudioChunk = changes.audioChunk.currentValue;

      console.log(`audio chunk changed`);
      if (!isSet(newAudioChunk)) {
        this.subscrManager.destroy();
        this.connectEvents();
        this._isReady = true;
      } else {
        // not ready
        this._isReady = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscrManager.destroy();
  }

  private connectEvents() {
    this.subscrManager.add(this.audioChunk.statuschange.subscribe((status: PlayBackStatus) => {
        this._isAudioPlaying = status === PlayBackStatus.PLAYING;
      },
      (error) => {
        console.error(error);
      },
      () => {

      }));
  }

  /**
   * called when button of navigation has been clicked
   * @param type "play", "pause", "stop", "replay" or "backward"
   */
  onButtonClick(type: string) {
    switch (type) {
      case('play'):
        this.onPlayButtonClicked();
        break;
      case('pause'):
        this.onPauseButtonClicked();
        break;
      case('stop'):
        this.onStopButtonClicked();
        break;
      case('replay'):
        this.onReplayButtonClicked();
        break;
      case('backward'):
        this.onBackwardButtonClicked();
        break;
      case('backward time'):
        this.onBackwardTimeButtonClicked();
        break;
      case('default'):
        console.error('button not found');
        break;
    }
    this.cd.detectChanges();
  }

  private onPlayButtonClicked() {
    this.triggerButtonClick('play');
    this.audioChunk.startPlayback(false);
  }

  private onPauseButtonClicked() {
    this.triggerButtonClick('pause');
    this.audioChunk.pausePlayback();
  }

  private onStopButtonClicked() {
    this.triggerButtonClick('stop');
    this.audioChunk.stopPlayback();
  }

  private onReplayButtonClicked() {
    this.audioChunk.toggleReplay();
    this.triggerButtonClick('replay');
    this._replay = this.audioChunk.replay;
  }

  private onBackwardButtonClicked() {
    this.triggerButtonClick('backward');
    this.audioChunk.stepBackward();
  }

  private onBackwardTimeButtonClicked() {
    this.triggerButtonClick('backward time');
    this.audioChunk.stepBackwardTime(500 / 1000);
  }

  private triggerButtonClick(type: string) {
    this.buttonClick.emit({type, timestamp: Date.now()});
  }

  /***
   * after value of volume was changed
   */
  afterVolumeChanged() {
    this.afterVolumeChange.emit({
      new_value: this.volume,
      timestamp: Date.now()
    });
  }

  /***
   * after value of playbackRate was changed
   */
  afterPlaybackRateChanged() {
    this.afterPlaybackRateChange.emit({
      new_value: this.playbackRate,
      timestamp: Date.now()
    });
  }
}
