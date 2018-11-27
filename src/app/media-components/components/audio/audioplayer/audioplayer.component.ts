// angular
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import 'rxjs/add/observable/timer';
// other
// import {AudioplayerService} from './audioplayer.service';
import {AudioChunk, AudioRessource, AudioTimeCalculator} from '../../../obj/media/audio';
import {PlayBackState} from '../../../obj/media';
import {AudioplayerService} from './audioplayer.service';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {CanvasAnimation} from '../../../obj/CanvasAnimation';
import {AudioService, KeymappingService} from '../../../../core/shared/service';
import {BrowserInfo, Logger} from '../../../../core/shared';
import {Line} from '../../../obj';
import {AudioManager} from '../../../obj/media/audio/AudioManager';
import {timer} from 'rxjs';

@Component({
  selector: 'app-audioplayer',
  templateUrl: './audioplayer.component.html',
  styleUrls: ['./audioplayer.component.css'],
  providers: [AudioplayerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioplayerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

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
   * gets the current time of the audio playback
   * @returns {number}
   */
  public get current_time(): number {
    return this.audiochunk.playposition.unix;
  }

  private get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
  }

  private get audioressource(): AudioRessource {
    return this.audiomanager.ressource;
  }

  constructor(private audio: AudioService,
              private ap: AudioplayerService,
              private changeDetectorRef: ChangeDetectorRef,
              private keyMap: KeymappingService) {

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  @ViewChild('audioplay') apview;
  @ViewChild('ap_graphicscan') graphicscanRef: ElementRef;
  @ViewChild('ap_overlaycan') overlaynacRef: ElementRef;
  @ViewChild('ap_playcan') playcanRef: ElementRef;

  /**
   * after Shortcut was triggered.
   * @type {EventEmitter<any>}
   */
  @Output() shortcuttriggered = new EventEmitter<any>();
  @Input() audiochunk: AudioChunk;
  public focused = false;
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
  private mouseclick_obj = {
    clicked: false,
    x: 0,
    y: 0,
    curr_line: null,
    event: null
  };
  /**
   * updates the GUI
   */
  public update = () => {
    this.updateCanvasSizes();
    if (this.audiomanager.channel) {
      this.draw();
      this.drawPlayCursor();
    }

    // update oldinnerWidth
    this.oldInnerWidth = this.innerWidth;
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
  private onKeyDown = ($event) => {
    if (this.settings.shortcuts_enabled) {
      const comboKey = $event.comboKey;

      const platform = BrowserInfo.platform;
      if (this.settings.shortcuts) {
        let key_active = false;
        let a = 0;
        for (const shortc in this.settings.shortcuts) {
          if (this.settings.shortcuts.hasOwnProperty(shortc)) {
            a++;
            if (this.settings.shortcuts.hasOwnProperty(shortc)) {
              const focuscheck = this.settings.shortcuts['' + shortc + ''].focusonly === false
                || (this.settings.shortcuts['' + shortc + ''].focusonly === this.focused === true);

              if (focuscheck && this.settings.shortcuts['' + shortc + '']['keys']['' + platform + ''] === comboKey) {
                switch (shortc) {
                  case('play_pause'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    if (this.audiochunk.isPlaying) {
                      this.pausePlayback();
                    } else {
                      this.startPlayback(() => {
                      });
                    }
                    key_active = true;
                    break;
                  case('stop'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stopPlayback(this.afterAudioStopped);
                    key_active = true;
                    break;
                  case('step_backward'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stepBackward();
                    key_active = true;
                    break;
                  case('step_backwardtime'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stepBackwardTime(0.5);
                    key_active = true;
                    break;
                }
              }

              if (key_active) {
                break;
              }
            }
          }
        }

        if (key_active) {
          $event.event.preventDefault();
        }
      }
    }
  }

  private onAudioChunkStateChanged = () => {

    this.audiomanager.stepbackward = false;
    this.audiomanager.paused = false;
    this.drawPlayCursor();
  }
  /**
   * draws the playcursor during animation
   */
  private drawPlayCursor = () => {
    // set new position of playcursor
    const absX = this.ap.audioTCalculator.samplestoAbsX(this.audiochunk.playposition.samples);
    this.changePlayCursorAbsX(absX);
    const line = this.ap.Line;

    if (line) {
      this.drawPlayCursorOnly(line);
    }
  }

  ngOnInit() {
    this.anim = new CanvasAnimation(25);
    this.timer = timer(0, 200);

    this.subscrmanager.add(this.audiochunk.statechange.subscribe(
      (state: PlayBackState) => {
        this.onAudioChunkStateChanged();
      }
    ));
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

    this.ap.init(this.innerWidth, this.audiochunk);
    // this.audiochunk.updateChannel();
    this.update();
    this.startTimer();
  }

  ngOnChanges(obj) {
    if (obj.hasOwnProperty('audiochunk')) {
      const previous: AudioChunk = obj.audiochunk.previousValue;
      const current: AudioChunk = obj.audiochunk.currentValue;

      if (!obj.audiochunk.firstChange) {
        if (((previous === null || previous === undefined) && !(current === null || current === undefined)) ||
          (current.time.start.samples !== previous.time.start.samples &&
            current.time.end.samples !== previous.time.end.samples)) {
          // audiochunk changed
          this.ap.init(this.innerWidth, this.audiochunk);
          this.update();
        }
      }
    }
  }

  ngOnDestroy() {
    this.stopPlayback(() => {
    });
    this.subscrmanager.destroy();
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
      if (this.audiochunk.isPlaying) {
        this.mouseclick_obj.clicked = true;
        this.mouseclick_obj.x = x;
        this.mouseclick_obj.y = y;
        this.mouseclick_obj.curr_line = curr_line;
        this.mouseclick_obj.event = $event;
        this.audiochunk.stopPlayback(this.afterAudioStopped);
      } else {
        this.ap.setMouseClickPosition(x, y, curr_line, $event, this.innerWidth);
      }

      this.drawPlayCursorOnly(curr_line);
    }
  }

  /**
   * stops the playback and sets the current playcursor position to 0.
   */
  public stopPlayback(afterAudioEnded: () => void) {
    this.audiochunk.stopPlayback(afterAudioEnded);
  }

  /**
   * pause playback
   */
  public pausePlayback() {
    this.audiochunk.pausePlayback(this.afterAudioPaused);
  }

  /**
   * start playback
   */
  public startPlayback(afterAudioEnded: () => void): boolean {
    if (!this.audiochunk.isPlaying) {
      return this.playSelection(afterAudioEnded);
    } else {
      return false;
    }
  }

  // sets the loop of playback
  public rePlayback(): boolean {
    return this.audiochunk.rePlayback();
  }

  /**
   *
   steps back to last position
   */
  public stepBackward() {
    this.audiochunk.stepBackward(this.afterAudioStepBackward);
  }

  stepBackwardTime(back_sec: number) {
    this.audiochunk.stepBackwardTime(this.drawFunc, this.afterAudioBackwardTime, back_sec);
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
      const ac = new AudioTimeCalculator(this.audioressource.info.samplerate, this.audiochunk.time.duration, this.innerWidth);
      Logger.log('' + this.audiochunk.playposition.samples);

      this.ap.audioTCalculator = ac;
      this.ap.PlayCursor.changeSamples(this.audiochunk.playposition.samples, ac);

      this.update();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onReload($event) {
    this.subscrmanager.destroy();
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
  }

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
   * playSelection() plays the selected signal fragment. Playback start and duration
   * depend on the current selection.
   */
  private playSelection(afterAudioEnded: () => void): boolean {
    return this.audiochunk.startPlayback(this.drawFunc, afterAudioEnded);
  }

  private drawFunc = () => {
    this.audiochunk.updatePlayPosition();
    this.anim.requestFrame(this.drawPlayCursor);
  }

  /**
   * starts the timer needed for updating the timestamps for the gui.
   */
  private startTimer() {
    this.subscrmanager.add(this.timer.subscribe(
      () => {
        if (this.audiomanager.channel && this.ap.PlayCursor) {
          this.changeDetectorRef.markForCheck();
        }
      }
    ));
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
    this.ap.PlayCursor.changeAbsX(new_value, this.ap.audioTCalculator, this.ap.AudioPxWidth, this.audiochunk);
  }

  private afterAudioStopped = () => {
    if (this.audiochunk.isPlayBackStopped && this.mouseclick_obj.clicked) {
      this.mouseclick_obj.clicked = false;
      this.ap.setMouseClickPosition(this.mouseclick_obj.x, this.mouseclick_obj.y,
        this.mouseclick_obj.curr_line, this.mouseclick_obj.event, this.innerWidth);
      setTimeout(() => {
        this.startPlayback(() => {
        });
      }, 200);
    }
  }

  private afterAudioPaused = () => {

  }

  private afterAudioStepBackward = () => {
    this.ap.PlayCursor.changeSamples(this.audiochunk.playposition.samples,
      this.ap.audioTCalculator, this.audiochunk);

    this.startPlayback(() => {
    });
  }

  private afterAudioBackwardTime = () => {
    // do the same
    this.afterAudioStepBackward();
  }
}
