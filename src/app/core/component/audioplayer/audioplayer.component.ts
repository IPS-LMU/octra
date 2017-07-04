// angular
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Observable} from 'rxjs/Rx';
// other
import {AudioTimeCalculator, BrowserInfo, CanvasAnimation, Line, Logger, SubscriptionManager} from '../../shared';
import {AudioService, KeymappingService} from '../../shared/service';
import {AudioplayerService} from './service/audioplayer.service';

@Component({
  selector: 'app-audioplayer',
  templateUrl: './audioplayer.component.html',
  styleUrls: ['./audioplayer.component.css'],
  providers: [AudioplayerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioplayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('audioplay') apview;
  @ViewChild('ap_graphicscan') graphicscanRef: ElementRef;
  @ViewChild('ap_overlaycan') overlaynacRef: ElementRef;
  @ViewChild('ap_playcan') playcanRef: ElementRef;

  /**
   * after Shortcut was triggered.
   * @type {EventEmitter<any>}
   */
  @Output() shortcuttriggered = new EventEmitter<any>();

  /**
   * gets data object that contains informations about the current state of audio playback
   * @returns {{distance: (number|string), duration: number, playduration: number, current: number}}
   * @constructor
   */
  @Output('Data') get Data(): any {
    return {
      distance: (this.ap && this.ap.Distance) ? this.ap.Distance : '',
      duration: (this.audio.duration) ? this.audio.duration.unix : 0,
      playduration: (this.ap.playduration) ? this.ap.playduration.unix : 0,
      current: (this.ap.PlayCursor && this.ap.PlayCursor.time_pos) ? this.ap.PlayCursor.time_pos.unix : 0
    };
  }

  /**
   * gets or sets the settings of this audioplayer component
   * @returns {any}
   * @constructor
   */
  public get settings(): any {
    return this.ap.Settings;
  }

  public set settings(value: any) {
    this.ap.Settings = value;
  }

  /**
   * gets the total time (from start to end)
   * @returns {number}
   */
  public get total_time(): number {
    return this.ap.total_time;
  }

  /**
   * gets the current time of the audio playback
   * @returns {number}
   */
  public get current_time(): number {
    return this.ap.current_time;
  }

  private subscrmanager: SubscriptionManager;

  // canvas Elements
  private graphicscanvas: HTMLCanvasElement = null;
  private overlaycanvas: HTMLCanvasElement = null;
  private playcanvas: HTMLCanvasElement = null;

  // animation for requesting AnimationFrames
  private anim: CanvasAnimation;

  // canvas contexts
  private context: CanvasRenderingContext2D = null;

  // timer for updating the time with interval of 200ms
  private timer = null;

  // size informations
  private width = 0;
  private height = 0;
  private innerWidth = 0;
  private oldInnerWidth = 0;
  public focused = false;

  constructor(private audio: AudioService,
              private ap: AudioplayerService,
              private changeDetectorRef: ChangeDetectorRef,
              private keyMap: KeymappingService) {

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  ngOnInit() {
    this.anim = new CanvasAnimation(25);
    this.timer = Observable.timer(0, 200);
  }

  ngAfterViewInit() {
    // initialization of canvases
    this.graphicscanvas = this.graphicscanRef.nativeElement;
    this.playcanvas = this.playcanRef.nativeElement;
    this.overlaycanvas = this.overlaynacRef.nativeElement;

    // initailization of width and height of the control
    this.width = this.apview.elementRef.nativeElement.clientWidth;
    this.innerWidth = this.width - this.settings.margin.left - this.settings.margin.right;
    this.oldInnerWidth = this.innerWidth;

    this.ap.init(this.innerWidth);
    this.audio.updateChannel();
    this.update();
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopPlayback();
    this.subscrmanager.destroy();
  }

  /**
   * updates the GUI
   */
  private update = () => {
    this.updateCanvasSizes();
    if (this.audio.channel) {
      this.draw();
    }

    // update oldinnerWidth
    this.oldInnerWidth = this.innerWidth;
  }

  /**
   * updateCanvasSizes is needed to update the size of the canvas respective to window resizing
   */
  private updateCanvasSizes() {
    this.width = Number(this.apview.elementRef.nativeElement.clientWidth);
    this.innerWidth = Number(this.width - this.settings.margin.left - this.settings.margin.right);
    this.height = (this.settings.margin.top + this.settings.height + this.settings.margin.bottom);
    // set width
    this.graphicscanvas.width = this.width;
    this.overlaycanvas.width = this.width;
    this.playcanvas.width = this.width;

    // set height
    this.graphicscanvas.height = this.height;
    this.overlaycanvas.height = this.height;
    this.playcanvas.height = this.height;
    this.apview.changeStyle('height', this.height.toString() + 'px');

    this.ap.updateLines(this.innerWidth);
  }

  /**
   * drawSignal(array) draws the min-max pairs of values in the canvas
   *
   * in a different color. This is probable due to there being only a final
   * stroke()-command after the loop.
   *
   */
  private draw = function () {
    // get canvas
    const line = this.ap.Line;

    if (line) {
      this.clearDisplay();

      this.drawLine();
      this.drawPlayCursorOnly(line);

    } else {
      throw new Error('Line Object not found');
    }
  };

  /**
   * drawGrid(h, v) draws a grid with h horizontal and v vertical lines over the canvas
   */
  private drawLine() {
    this.context = this.graphicscanvas.getContext('2d');
    this.context.globalAlpha = 1.0;
    this.context.fillStyle = this.settings.slider.color;

    const x = this.settings.margin.left;
    const h = this.settings.height;
    const middle = Math.round(h / 2) - (this.settings.slider.height / 2);

    this.context.fillRect(x, middle, this.innerWidth, this.settings.slider.height);
    this.context.stroke();
  };

  /**
   * clearDisplay() draws a rectangle with the given canvas size and
   * fills it with a slightly smaller rectangle in the given color.
   */
  private clearDisplay() {
    // get canvas
    const play_c = this.playcanvas;
    const overlay_c = this.overlaycanvas;
    const line = this.ap.Line;

    if (line) {
      // --- get the appropriate context
      this.context = this.playcanvas.getContext('2d');
      this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);

      // --- get the appropriate context
      this.context = overlay_c.getContext('2d');
      this.context.globalAlpha = 1.0;
      this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);
      this.context.strokeStyle = this.settings.cursor.color;

      this.context = play_c.getContext('2d');
      this.context.globalAlpha = 1.0;
      this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);
      this.context.strokeStyle = this.settings.playcursor.color;

      this.context = this.graphicscanvas.getContext('2d');
      this.context.globalAlpha = 1.0;
      this.context.strokeStyle = this.settings.framecolor;
      this.context.fillStyle = this.settings.backgroundcolor;
      this.context.fillRect(0, 0, this.width, this.height);
      // context.strokeRect(line_obj.Pos.x, line_obj.Pos.y, w, settings.height);
    } else {
      throw new Error('Line Object not found');
    }
  }

  /**
   * onMouseMove sets the selection to the current x values of the mouse move
   */
  onMouseMove($event) {
    const x = $event.offsetX;
    const y = $event.offsetY;

    const curr_line = this.ap.LastLine;

    if (curr_line) {
      this.ap.setMouseMovePosition($event.type, x, y, curr_line, this.innerWidth);
      this.drawPlayCursorOnly(curr_line);
    }
  }

  /**
   * onClick sets the selection to the current x values of the click
   */
  onClick($event) {
    const x = $event.offsetX;
    const y = $event.offsetY;

    const curr_line = this.ap.Line;

    if (curr_line) {
      this.ap.setMouseClickPosition(x, y, curr_line, $event, this.innerWidth);

      this.drawPlayCursorOnly(curr_line);
    }
  }

  private onKeyDown = ($event) => {
    if (this.settings.shortcuts_enabled) {
      const comboKey = $event.comboKey;

      const platform = BrowserInfo.platform;
      if (this.settings.shortcuts) {
        let key_active = false;
        for (const shortc in this.settings.shortcuts) {
          if (this.settings.shortcuts.hasOwnProperty(shortc)) {
            const focuscheck = this.settings.shortcuts['' + shortc + ''].focusonly === false
              || (this.settings.shortcuts['' + shortc + ''].focusonly === this.focused === true);

            if (focuscheck && this.settings.shortcuts['' + shortc + '']['keys']['' + platform + ''] === comboKey) {
              switch (shortc) {
                case('play_pause'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                  if (this.audio.audioplaying) {
                    this.pausePlayback();
                  } else {
                    this.startPlayback();
                  }
                  key_active = true;
                  break;
                case('stop'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                  this.stopPlayback();
                  key_active = true;
                  break;
                case('step_backward'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                  this.stepBackward();
                  key_active = true;
                  break;
                case('step_backwardtime'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                  this.stepBackwardTime(3, 0.5);
                  key_active = true;
                  break;
              }
            }

            if (key_active) {
              break;
            }
          }
        }

        if (key_active) {
          $event.event.preventDefault();
        }
      }
    }
  }

  /**
   * playSelection() plays the selected signal fragment. Playback start and duration
   * depend on the current selection.
   */
  private playSelection(computetimes: boolean = true) {
    // calculate time from which audio is played
    if (computetimes) {
            this.ap.begintime = this.ap.calculateBeginTime();
      this.ap.updatePlayDuration();
      this.ap.updateDistance();
    }

    // define callback for end event
    const endPlaybackEvent = () => {
      this.audio.audioplaying = false;
      this.audio.javascriptNode.disconnect();

      this.ap.current.samples = this.ap.PlayCursor.time_pos.samples;
      if (this.audio.replay === true) {
        this.playSelection();
      }

      this.audio.stepbackward = false;
      this.audio.paused = false;
    };

    const drawFunc = () => {
      this.anim.requestFrame(this.drawPlayCursor);
    };

    this.ap.lastplayedpos = this.ap.begintime.clone();
    this.audio.startPlayback(this.ap.begintime, this.ap.playduration, drawFunc, endPlaybackEvent);
  }

  /**
   * stops the playback and sets the current playcursor position to 0.
   */
  public stopPlayback() {
    if (this.audio.stopPlayback()) {
      // state was not audioplaying
      this.ap.current.samples = 0;
      this.changePlayCursorAbsX(0);
      this.drawPlayCursorOnly(this.ap.Line);
    }
  }

  /**
   * pause playback
   */
  public pausePlayback() {
    this.audio.pausePlayback();
  }

  /**
   * start playback
   */
  public startPlayback(computetimes: boolean = true) {
    if (!this.audio.audioplaying) {
      this.playSelection(computetimes);
    }
  }

  /**
   * starts the timer needed for updating the timestamps for the gui.
   */
  private startTimer() {
    this.subscrmanager.add(this.timer.subscribe(
      () => {
        if (this.audio.audiobuffer && this.ap.PlayCursor) {
          this.ap.current_time = Math.round(this.ap.PlayCursor.time_pos.unix);
          this.ap.total_time = this.ap.Chunk.time.end.unix - this.ap.Chunk.time.start.unix;
          this.changeDetectorRef.markForCheck();
        }
      }
    ));
  }

  // sets the loop of playback
  public rePlayback(): boolean {
    return this.audio.rePlayback();
  }

  /**
   *
   steps back to last position
   */
  public stepBackward() {
    this.audio.stepBackward(() => {
      // audio not playing

      if (this.ap.lastplayedpos !== null) {
        this.ap.current = this.ap.lastplayedpos.clone();
        this.ap.PlayCursor.changeSamples(this.ap.lastplayedpos.samples, this.ap.audioTCalculator);
        this.drawPlayCursorOnly(this.ap.LastLine);
        this.ap.begintime = this.ap.lastplayedpos.clone();
        this.startPlayback();
      }
    });
  }

  stepBackwardTime(duration_sec: number, back_sec: number) {
    this.audio.stepBackwardTime(() => {
            this.ap.PlayCursor.changeSamples(this.ap.current.samples - (back_sec * this.audio.samplerate), this.ap.audioTCalculator, this.ap.Chunk);
      this.drawPlayCursorOnly(this.ap.LastLine);
      this.ap.current.samples = Math.max(0, (this.ap.current.samples - (Math.floor(back_sec * this.audio.samplerate))));
      this.ap.begintime.samples = this.ap.current.samples;
      this.ap.playduration.samples = duration_sec * (this.audio.samplerate);
      this.ap.Distance = this.ap.audioTCalculator.samplestoAbsX(this.ap.playduration.samples);
            this.startPlayback(false);
    });
  }

  /**
   * draws the playcursor during animation
   */
  private drawPlayCursor = () => {
    // get actual time and calculate progress in percentage
    const timestamp = new Date().getTime();
    const currentAbsX = this.ap.audioTCalculator.samplestoAbsX(this.ap.current.samples);
    let progress = 0;
    let absX = 0;

    if (this.audio.endplaying > timestamp && this.audio.audioplaying) {
      // set new position of playcursor
      progress = Math.min(
        (
          ((this.ap.playduration.unix) - (this.audio.endplaying - timestamp))
          / (this.ap.playduration.unix)
        ) * this.audio.speed, 1);
      absX = Math.max(0, currentAbsX + (this.ap.Distance * progress));
      this.changePlayCursorAbsX(absX);
      console.log(this.ap.current);
    }

    const line = this.ap.Line;

    if (line) {
      this.drawPlayCursorOnly(line);
    }
  }

  /**
   * draws playcursor at its current position
   * @param curr_line
   */
  private drawPlayCursorOnly(curr_line: Line) {
    const relX = this.ap.PlayCursor.absX + this.settings.margin.left;
    const relY = Math.round((curr_line.Size.height - this.settings.playcursor.height) / 2);

    if (relX <= curr_line.Size.width + this.settings.margin.left) {
      this.context = this.playcanvas.getContext('2d');
      this.context.clearRect(0, 0, this.width, this.height);
      this.context.strokeStyle = this.settings.playcursor.color;
      this.context.beginPath();
      this.context.moveTo(relX, relY + 1);
      this.context.lineTo(relX, relY + this.settings.playcursor.height);
      this.context.globalAlpha = 1;
      this.context.lineWidth = this.settings.playcursor.width;
      this.context.stroke();
    }
  }

  /**
   * changes the playcursors absolute position in pixels to a new one.
   * @param new_value
   */
  private changePlayCursorAbsX(new_value: number) {
    this.ap.PlayCursor.changeAbsX(new_value, this.ap.audioTCalculator, this.ap.AudioPxWidth, this.ap.Chunk);
  }


  /**
   * this method updates the gui on resizing
   * @param $event
   */
  @HostListener('window:resize', ['$event'])
  onResize($event) {
    this.width = this.apview.elementRef.nativeElement.clientWidth;
    this.innerWidth = this.width - this.settings.margin.left - this.settings.margin.right;

    const ratio = this.innerWidth / this.oldInnerWidth;
    if (this.ap.PlayCursor) {
      const ac = new AudioTimeCalculator(this.audio.samplerate, this.ap.playduration, this.innerWidth);
      Logger.log('' + this.ap.current.samples);

      this.ap.audioTCalculator = ac;
      this.ap.PlayCursor.changeSamples(this.ap.current.samples, ac);

      this.update();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onReload($event) {
    this.subscrmanager.destroy();
  }
}
