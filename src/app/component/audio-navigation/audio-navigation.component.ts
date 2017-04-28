import {ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';

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
}

@Component({
  selector: 'app-audio-navigation',
  templateUrl: './audio-navigation.component.html',
  styleUrls: ['./audio-navigation.component.css']
})
export class AudioNavigationComponent {
  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this.volumechange.emit({
      old_value: Number(this._volume),
      new_value: Number(value),
      timestamp: Date.now()
    });
    this._volume = value;
  }

  @Input() audioplaying = false;
  @Input() responsive = false;
  @Input() easymode = false;

  @Output() buttonclick = new EventEmitter<{ type: string, timestamp: number }>();
  @Output() volumechange = new EventEmitter<{ old_value: number, new_value: number, timestamp: number }>();
  @Output() aftervolumechange = new EventEmitter<{ new_value: number, timestamp: number }>();
  @Output() speedchange = new EventEmitter<{ old_value: number, new_value: number, timestamp: number }>();
  @Output() afterspeedchange = new EventEmitter<{ new_value: number, timestamp: number }>();

  private _volume = 1;
  private _speed = 1;
  public replay = false;

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this.speedchange.emit({
      old_value: Number(this._speed),
      new_value: Number(value),
      timestamp: Date.now()
    });
    this._speed = value;
  }

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
    }
  };

  constructor(private cd: ChangeDetectorRef) {
  }

  /**
   * called when button of navigation has been clicked
   * @param type "play", "pause", "stop", "replay" or "backward"
   */
  onButtonClick(type: string) {
    switch (type) {
      case('play'):
        this.buttonclick.emit({type: 'play', timestamp: Date.now()});
        break;
      case('pause'):
        this.buttonclick.emit({type: 'pause', timestamp: Date.now()});
        break;
      case('stop'):
        this.buttonclick.emit({type: 'stop', timestamp: Date.now()});
        break;
      case('replay'):
        this.buttonclick.emit({type: 'replay', timestamp: Date.now()});
        break;
      case('backward'):
        this.buttonclick.emit({type: 'backward', timestamp: Date.now()});
        break;
      case('default'):
        break;
    }
    this.cd.detectChanges();
  }

  /***
   * after value of volume was changed
   */
  afterVolumeChange() {
    this.aftervolumechange.emit({
      new_value: this.volume,
      timestamp: Date.now()
    });
  }

  /***
   * after value of speed was changed
   */
  afterSpeedChange() {
    this.afterspeedchange.emit({
      new_value: this.speed,
      timestamp: Date.now()
    });
  }
}
