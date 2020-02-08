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
// other
import {AudioRessource, AudioTimeCalculator, BrowserAudioTime} from '../../../obj/media/audio';
import {PlayBackState} from '../../../obj/media';
import {AudioplayerService} from './audioplayer.service';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {CanvasAnimation, Line} from '../../../obj';
import {AudioService, KeymappingService} from '../../../../core/shared/service';
import {BrowserInfo} from '../../../../core/shared';
import {AudioChunk, AudioManager} from '../../../obj/media/audio/AudioManager';
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
   */
  public get settings(): any {
    return this.ap.Settings;
  }

  public set settings(value: any) {
    this.ap.Settings = value;
  }

  /**
   * gets the current time of the audio playback
   */
  public get current_time(): number {
    return this.audiochunk.playposition.browserSample.unix;
  }

  private get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
  }

  private get audioressource(): AudioRessource {
    return this.audiomanager.ressource;
  }

  constructor(private audio: AudioService,
              public ap: AudioplayerService,
              private changeDetectorRef: ChangeDetectorRef,
              private keyMap: KeymappingService) {

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown), 'keypress');
  }

  @ViewChild('audioplay', {static: true}) apview;
  @ViewChild('ap_graphicscan', {static: true}) graphicscanRef: ElementRef;
  @ViewChild('ap_overlaycan', {static: true}) overlaynacRef: ElementRef;
  @ViewChild('ap_playcan', {static: true}) playcanRef: ElementRef;

  /**
   * after Shortcut was triggered.
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
  private mouseClickObj = {
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
    if (this.audiomanager.channelData) {
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
  private draw = () => {
    // get canvas
    const line = this.ap.Line;

    if (line) {
      this.clearDisplay();

      this.drawLine();
      this.drawPlayCursorOnly(line);

    } else {
      throw new Error('Line Object not found');
    }
  }

  private onKeyDown = ($event) => {
    if (this.settings.shortcutsEnabled) {
      const comboKey = $event.comboKey;

      const platform = BrowserInfo.platform;
      if (this.settings.shortcuts) {
        let keyActive = false;
        let a = 0;
        for (const shortc in this.settings.shortcuts) {
          if (this.settings.shortcuts.hasOwnProperty(shortc)) {
            a++;
            if (this.settings.shortcuts.hasOwnProperty(shortc)) {
              const focuscheck = this.settings.shortcuts['' + shortc + ''].focusonly === false
                || (this.settings.shortcuts['' + shortc + ''].focusonly === this.focused === true);

              if (focuscheck && this.settings.shortcuts['' + shortc + ''].keys['' + platform + ''] === comboKey) {
                switch (shortc) {
                  case('play_pause'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    if (this.audiomanager.isPlaying) {
                      this.pausePlayback();
                    } else {
                      this.startPlayback(() => {
                        this.update();
                      });
                    }
                    keyActive = true;
                    break;
                  case('stop'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stopPlayback(this.afterAudioStopped);
                    keyActive = true;
                    break;
                  case('step_backward'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stepBackward();
                    keyActive = true;
                    break;
                  case('step_backwardtime'):
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    this.stepBackwardTime(0.5);
                    keyActive = true;
                    break;
                }
              }

              if (keyActive) {
                break;
              }
            }
          }
        }

        if (keyActive) {
          $event.event.preventDefault();
        }
      }
    }
  }

  private onAudioChunkStateChanged = () => {
    this.drawPlayCursor();
  }
  /**
   * draws the playcursor during animation
   */
  private drawPlayCursor = () => {
    // set new position of playcursor
    const absX = this.ap.audioTCalculator.samplestoAbsX(this.audiochunk.playposition.browserSample.value);
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
          (current.time.start.browserSample.value !== previous.time.start.browserSample.value &&
            current.time.end.browserSample.value !== previous.time.end.browserSample.value)) {
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

    const currLine = this.ap.LastLine;

    if (currLine) {
      this.ap.setMouseMovePosition($event.type, x, y, currLine, this.innerWidth);
      this.drawPlayCursorOnly(currLine);
    }
  }

  /**
   * onClick sets the selection to the current x values of the click
   */
  onClick($event) {
    const x = $event.offsetX;
    const y = $event.offsetY;

    const currLine = this.ap.Line;

    if (currLine) {
      if (this.audiochunk.isPlaying) {
        this.mouseClickObj.clicked = true;
        this.mouseClickObj.x = x;
        this.mouseClickObj.y = y;
        this.mouseClickObj.curr_line = currLine;
        this.mouseClickObj.event = $event;
        this.audiochunk.stopPlayback().then(this.afterAudioStopped).catch((error) => {
          console.error(error);
        });
      } else {
        this.ap.setMouseClickPosition(x, y, currLine, $event, this.innerWidth);
      }

      this.drawPlayCursorOnly(currLine);
    }
  }

  /**
   * stops the playback and sets the current playcursor position to 0.
   */
  public stopPlayback(afterAudioEnded: () => void) {
    this.audiochunk.stopPlayback().then(
      () => {
        afterAudioEnded();
        this.afterAudioStopped();
      }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * pause playback
   */
  public pausePlayback() {
    this.audiochunk.pausePlayback().then(this.afterAudioPaused).catch((error) => {
      console.error(error);
    });
  }

  /**
   * start playback
   */
  public startPlayback(afterAudioEnded: () => void) {
    if (!this.audiochunk.isPlaying) {
      this.playSelection(() => {
        afterAudioEnded();
      });
    }
  }

  // sets the loop of playback
  public rePlayback() {
    this.audiochunk.toggleReplay();
  }

  /**
   * steps back to last position
   */
  public stepBackward() {
    this.audiochunk.stepBackward(() => {
      this.drawFunc();
    }).then(() => {
      // this.afterAudioStepBackward();
    }).catch((error) => {
      console.error(error);
    });
  }

  stepBackwardTime(backSec: number) {
    this.audiochunk.stepBackwardTime(backSec, this.drawFunc).then(this.afterAudioBackwardTime).catch((error) => {
      console.error(error);
    });
  }

  /**
   * this method updates the gui on resizing
   */
  @HostListener('window:resize', ['$event'])
  onResize($event) {
    this.width = this.apview.elementRef.nativeElement.clientWidth;
    this.innerWidth = this.width - this.settings.margin.left - this.settings.margin.right;

    if (this.ap.PlayCursor) {
      const ac = new AudioTimeCalculator(this.audioressource.info.samplerate,
        this.audiochunk.time.duration as BrowserAudioTime, this.innerWidth);

      this.ap.audioTCalculator = ac;
      this.ap.PlayCursor.changeSamples(this.audiochunk.playposition.browserSample.value, ac);

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
    const playC = this.playcanvas;
    const overlayC = this.overlaycanvas;
    const line = this.ap.Line;

    if (line) {
      // --- get the appropriate context
      this.context = this.playcanvas.getContext('2d');
      this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);

      // --- get the appropriate context
      this.context = overlayC.getContext('2d');
      this.context.globalAlpha = 1.0;
      this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);
      this.context.strokeStyle = this.settings.cursor.color;

      this.context = playC.getContext('2d');
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
  private playSelection(afterAudioEnded: () => void) {
    this.audiochunk.startPlayback(this.drawFunc).then(afterAudioEnded).catch((error) => {
      console.error(error);
    });
  }

  private drawFunc = () => {
    this.anim.requestFrame(this.drawPlayCursor);
  }

  /**
   * starts the timer needed for updating the timestamps for the gui.
   */
  private startTimer() {
    this.subscrmanager.add(this.timer.subscribe(
      () => {
        if (this.audiomanager.channelData && this.ap.PlayCursor) {
          this.changeDetectorRef.markForCheck();
        }
      }
    ));
  }

  /**
   * draws playcursor at its current position
   */
  private drawPlayCursorOnly(currLine: Line) {
    const relX = this.ap.PlayCursor.absX + this.settings.margin.left;
    const relY = Math.round((currLine.Size.height - this.settings.playcursor.height) / 2);

    if (relX <= currLine.Size.width + this.settings.margin.left) {
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
   * changes the playcursors absolute position in pixels to a new one
   */
  private changePlayCursorAbsX(newValue: number) {
    this.ap.PlayCursor.changeAbsX(newValue, this.ap.audioTCalculator, this.ap.AudioPxWidth, this.audiochunk);
  }

  private afterAudioStopped = () => {
    this.audiochunk.playposition.browserSample.value = 0;
    /*
    if (this.audiochunk.isPlayBackStopped && this.mouseclick_obj.clicked) {
      console.log(`AUDIO STOPPED!`);
      this.mouseclick_obj.clicked = false;
      this.ap.setMouseClickPosition(this.mouseclick_obj.x, this.mouseclick_obj.y,
        this.mouseclick_obj.curr_line, this.mouseclick_obj.event, this.innerWidth);
      setTimeout(() => {
        this.startPlayback(() => {
        });
      }, 200);
    }*/
  }

  private afterAudioPaused = () => {

  }

  private afterAudioStepBackward = () => {
    this.ap.PlayCursor.changeSamples(this.audiochunk.playposition.browserSample.value,
      this.ap.audioTCalculator, this.audiochunk);

    this.startPlayback(() => {
    });
  }

  private afterAudioBackwardTime = () => {
    // do the same
    // this.afterAudioStepBackward();
  }

  public enableShortcuts() {
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown), 'keypress');
  }

  public disableShortcuts() {
    this.subscrmanager.removeByTag('keypress');
  }
}
