import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import {AudioviewerService} from './audioviewer.service';
import {TranslateService} from '@ngx-translate/core';
import {AudioManager} from '../../../obj/media/audio/AudioManager';
import {AudioRessource} from '../../../obj/media/audio/AudioRessource';
import {BrowserAudioTime, BrowserSample, PlayBackState} from '../../../obj/media/index';
import {Interval, Margin, Rectangle} from '../../../objects';
import {AudioviewerConfig} from './audioviewer.config';
import {AudioChunk, AudioSelection} from '../../../obj/media/audio';
import {AVMousePos} from '../../../obj/AVMousePos';
import {PlayCursor} from '../../../obj/PlayCursor';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {CanvasAnimation} from '../../../obj/CanvasAnimation';
import {KeymappingService, TranscriptionService} from '../../../../core/shared/service';
import {Line} from '../../../obj/Line';
import {BrowserInfo, Logger} from '../../../../core/shared';
import {Segment} from '../../../../core/obj/Annotation/Segment';
import {Timespan2Pipe} from '../../../pipe/timespan2.pipe';
import {isNullOrUndefined} from '../../../../core/shared/Functions';
import {TaskManager} from '../../../../core/obj/TaskManager';

@Component({
  selector: 'app-audioviewer',
  templateUrl: './audioviewer.component.html',
  styleUrls: ['./audioviewer.component.css'],
  providers: [AudioviewerService]
})
export class AudioviewerComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  public get Chunk(): AudioChunk {
    return this.audiochunk;
  }

  get focused(): boolean {
    return this.av.focused;
  }

  set focused(value: boolean) {
    this.av.focused = value;
  }

  get MouseCursor(): AVMousePos {
    return this.av.Mousecursor;
  }

  public get Settings(): AudioviewerConfig {
    return this.av.Settings;
  }

  public set Settings(new_settings: AudioviewerConfig) {
    this.av.Settings = new_settings;
  }

  get AudioPxWidth(): number {
    return this.av.AudioPxWidth;
  }

  public get selection(): AudioSelection {
    return this.audiochunk.selection;
  }

  public get PlayCursor(): PlayCursor {
    return this.av.PlayCursor;
  }

  public get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
  }

  public get audioressource(): AudioRessource {
    return this.audiochunk.audiomanager.ressource;
  }

  get visibleLines(): Interval {
    return this.av.visibleLines;
  }

  get viewRect(): Rectangle {
    return this.av.viewRect;
  }

  get realRect(): Rectangle {
    return this.av.realRect;
  }

  get round_values(): boolean {
    return this.Settings.round_values;
  }

  set round_values(value: boolean) {
    this.Settings.round_values = value;
  }

  @Output('pos_time')
  get pos_time(): number {
    return this.av.PlayCursor.time_pos.browserSample.value;
  }

  get innerWidth(): number {
    return this._innerWidth;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get deactivate_shortcuts(): boolean {
    return this._deactivate_shortcuts;
  }

  set deactivate_shortcuts(value: boolean) {
    this._deactivate_shortcuts = value;
  }

  constructor(public av: AudioviewerService,
              private transcr: TranscriptionService,
              private keyMap: KeymappingService,
              private langService: TranslateService,
              private cd: ChangeDetectorRef) {

    this.av.initializeSettings();

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  subscrmanager: SubscriptionManager;
  @ViewChild('audioview') aview;
  @ViewChild('graphicscan') graphicscanRef;
  @ViewChild('graphicscan2') graphicscanRef2;
  @ViewChild('overlaycan') overlaynacRef;
  @ViewChild('playcan') playcanRef;
  @ViewChild('mousecan') mousecanRef;
  @ViewChild('textcan') textcanRef;
  // EVENTS
  @Output() selchange = new EventEmitter<AudioSelection>();
  @Output() segmententer: EventEmitter<any> = new EventEmitter<any>();
  @Output() segmentchange: EventEmitter<number> = new EventEmitter<number>();
  @Output() mousecursorchange = new EventEmitter<AVMousePos>();
  @Output() playcursorchange = new EventEmitter<PlayCursor>();
  @Output() shortcuttriggered = new EventEmitter<any>();
  @Output() alerttriggered = new EventEmitter<{ type: string, message: string }>();
  @Output() scrolling = new EventEmitter<{ state: string }>();
  @Output() scrollbarchange = new EventEmitter<{ state: string }>();
  @Input() margin: Margin = new Margin(0, 0, 0, 0);
  @Input() audiochunk: AudioChunk;
  @Input() name: string;
  public scrollbar = {
    dragging: false,
    mouseover: false
  };
  public updating = false;
  public audioplaying = false;
  // canvas
  private graphicscanvas: HTMLCanvasElement = null;
  private overlaycanvas: HTMLCanvasElement = null;
  private playcanvas: HTMLCanvasElement = null;
  private mousecanvas: HTMLCanvasElement = null;
  private textcanvas: HTMLCanvasElement = null;
  // contexts
  private g_context: CanvasRenderingContext2D = null;
  private p_context: CanvasRenderingContext2D = null;
  private o_context: CanvasRenderingContext2D = null;
  private m_context: CanvasRenderingContext2D = null;
  private t_context: CanvasRenderingContext2D = null;

  private wheeling;
  private resizing = false;
  // for animation of playcursor
  private anim: CanvasAnimation;
  private oldInnerWidth = 0;

  // size settings
  private _innerWidth = 0;
  private secondsPerLine = 5;

  private _initialized = false;

  private _deactivate_shortcuts = false;
  /**
   * update and redraw audioviewer
   * @param computeDisplayData should display data be recomputed?
   */
  public update = (computeDisplayData: boolean = false) => {
    if (this.AudioPxWidth > 0) {
      this.updateVisibleLines();
      if (!this.updating) {
        this.updating = true;

        const draw = () => {
          this.av.updateLines(this._innerWidth);
          if (this.av.LinesArray.length > 0) {
            let startSamples = 0;
            let endSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.LinesArray[0].Size.width, this.audiochunk);
            for (let i = this.av.visibleLines.start; i <= this.av.visibleLines.end; i++) {
              const line = this.av.LinesArray[i];
              if (!(line === null || line === undefined)) {
                this.clearDisplay(i);
                this.drawGrid(startSamples, endSamples, 3, line);
                startSamples = endSamples;
                endSamples += this.av.audioTCalculator.absXChunktoSamples(this.av.LinesArray[i].Size.width, this.audiochunk);
              } else {
                break;
              }
            }
            this.drawSegments();
            if (this.Settings.cropping !== 'none') {
              this.av.Mousecursor.relPos.x = Math.round(this._innerWidth / 2);
              this.drawCropBorder();
            }

            if (this.Settings.timeline.enabled) {
              this.drawTimeLine();
            }

            // draw signal. Separate for loop because of performance issues
            for (let i = this.av.visibleLines.start; i <= this.av.visibleLines.end; i++) {
              if (!this.drawSignal(i)) {
                break;
              }
            }
            if (this.Settings.cropping !== 'none') {
              this.av.Mousecursor.relPos.x = Math.round(this._innerWidth / 2);
              this.drawCursor(this.av.LinesArray[0]);
              this.drawCropBorder();
            }
            if (this.Settings.selection.enabled) {
              this.drawPlayCursor();
              this.drawCursor(this.av.Mousecursor.line);
            }
            this._initialized = true;
          } else {
            console.error('0 lines?');
          }
        };

        if (!(this.audiomanager.channel === null || this.audiomanager.channel === undefined)) {
          if (computeDisplayData) {
            this.av.refresh().then(() => {
              draw();
            }).catch((err) => {
              console.error(err);
            });
          } else {
            draw();
          }
        } else {
          console.error('audio channel is null');
        }

        this.oldInnerWidth = this._innerWidth;
        this.updating = false;
      }
    } else {
      console.error('audiopx 0');
    }
  }
  /**
   * drawSignal(array) draws the min-max pairs of values in the canvas
   *
   * in a different color. This is probable due to there being only a final
   * stroke()-command after the loop.
   *
   */
  drawSignal = (line_num) => {
    // get canvas
    const line_obj = this.av.LinesArray[line_num];
    const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;

    if (!(line_obj === null || line_obj === undefined)) {
      // line_obj found
      const midline = Math.round((this.Settings.lineheight - timeline_height) / 2);
      const x_pos = line_num * this.innerWidth;

      const zoomX = this.av.zoomX;
      const zoomY = this.av.zoomY;

      this.g_context.strokeStyle = this.Settings.data.color;
      this.g_context.beginPath();
      this.g_context.moveTo(line_obj.Pos.x, line_obj.Pos.y + midline - this.av.minmaxarray[x_pos] - this.av.viewRect.position.y);

      if (!(midline === null || midline === undefined) &&
        !(line_obj.Pos === null || line_obj.Pos === undefined)
        && !(this.av.minmaxarray === null || this.av.minmaxarray === undefined)
        && !(zoomY === null || zoomY === undefined)) {
        for (let x = 0; (x + x_pos) < x_pos + line_obj.Size.width; x++) {
          const x_draw = (!this.Settings.round_values) ? line_obj.Pos.x + (x * zoomX) : Math.round(line_obj.Pos.x + (x * zoomX));
          const y_draw = (!this.Settings.round_values)
            ? (line_obj.Pos.y - this.av.viewRect.position.y + midline - (this.av.minmaxarray[x + x_pos] * zoomY))
            : Math.round(line_obj.Pos.y - this.av.viewRect.position.y + midline - (this.av.minmaxarray[x + x_pos] * zoomY));

          if (!isNaN(y_draw) && !isNaN(x_draw)) {
            this.g_context.lineTo(x_draw, y_draw);
          } else {
            break;
          }

        }
      } else {
        if ((midline === null || midline === undefined)) {
          throw Error('midline is null!');
        } else if ((line_obj.Pos === null || line_obj.Pos === undefined)) {
          throw Error('Pos is null!');
        } else if ((this.av.minmaxarray === null || this.av.minmaxarray === undefined)) {
          throw Error('MinMax Array is null!');
        } else if ((zoomY === null || zoomY === undefined)) {
          throw Error('ZoomY is null!');
        }
      }
      this.g_context.stroke();
      return true;
    }
    return false;
  }

  /**
   * on key pressed down, searches for shortcuts and takes action if shortcut found
   *
   */
  onKeyDown = (event) => {
    const comboKey = event.comboKey;
    this.av.shift_pressed = comboKey === 'SHIFT';

    if (this.Settings.shortcuts_enabled && !this.deactivate_shortcuts) {
      const platform = BrowserInfo.platform;

      if (this.av.focused && this.isDisabledKey(comboKey)) {
        // key pressed is disabled by config
        event.event.preventDefault();
      }

      if (this.Settings.shortcuts) {
        let key_active = false;
        for (const shortc in this.Settings.shortcuts) {
          if (this.Settings.shortcuts.hasOwnProperty(shortc)) {
            const shortcut = this.Settings.shortcuts['' + shortc + ''];
            const focuscheck = (!(shortcut === null || shortcut === undefined)) && (shortcut.focusonly === false
              || (shortcut.focusonly === this.focused === true));

            if (focuscheck && this.Settings.shortcuts['' + shortc + '']['keys']['' + platform + ''] === comboKey) {
              switch (shortc) {
                case('play_pause'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});
                  if (this.audiomanager.state === PlayBackState.PLAYING) {
                    this.pausePlayback(() => {
                    });
                  } else {
                    this.startPlayback();
                  }
                  key_active = true;
                  break;
                case('stop'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stopPlayback(() => {
                  });
                  key_active = true;
                  break;
                case('step_backward'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackward(() => {
                  });
                  key_active = true;
                  break;
                case('step_backwardtime'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackwardTime(() => {
                  }, 0.5);
                  key_active = true;
                  break;
                case('set_boundary'):
                  if (this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly && this.av.focused) {
                    const result = this.av.addSegment();
                    if (result !== null && result.msg !== null) {
                      if (result.msg.text && result.msg.text !== '') {
                        this.alerttriggered.emit({
                          type: result.msg.type,
                          message: result.msg.text
                        });
                      } else if (result.type !== null) {
                        this.shortcuttriggered.emit({
                          shortcut: comboKey,
                          value: result.type,
                          type: 'boundary',
                          samplepos: result.seg_samples
                        });
                        this.drawSegments();
                      }
                    }
                    key_active = true;
                  }
                  break;
                case('set_break'):
                  if (this.Settings.boundaries.enabled && this.av.focused) {
                    const xSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.Mousecursor.absX, this.audiochunk);

                    if (xSamples > -1) {
                      const segment_i = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                        new BrowserSample(xSamples, this.audiomanager.browserSampleRate)
                      );
                      const segment = this.transcr.currentlevel.segments.get(segment_i);
                      if (segment_i > -1) {
                        if (segment.transcript !== this.transcr.break_marker.code) {
                          segment.transcript = this.transcr.break_marker.code;
                          this.shortcuttriggered.emit({shortcut: comboKey, value: 'set_break', type: 'segment'});
                        } else {
                          segment.transcript = '';
                          this.shortcuttriggered.emit({shortcut: comboKey, value: 'remove_break', type: 'segment'});
                        }
                        this.update(false);
                        this.drawCursor(this.av.Mousecursor.line);
                        this.transcr.currentlevel.segments.onsegmentchange.emit();
                      }
                    }

                    key_active = true;
                  }
                  break;
                case('play_selection'):
                  if (this.av.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                    const xSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.Mousecursor.absX, this.audiochunk);

                    const boundary_select = this.av.getSegmentSelection(this.av.Mousecursor.timePos.browserSample.value);
                    if (boundary_select) {
                      const segment_i = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                        new BrowserSample(xSamples, this.audiomanager.browserSampleRate));
                      if (segment_i > -1) {
                        const segment = this.transcr.currentlevel.segments.get(segment_i);
                        const start_time = this.transcr.currentlevel.segments.getStartTime(segment_i);
                        // make shure, that segments boundaries are visible
                        if (start_time.browserSample.value >= this.audiochunk.time.start.browserSample.value &&
                          segment.time.browserSample.value <= this.audiochunk.time.end.browserSample.value) {
                          const absX = this.av.audioTCalculator.samplestoAbsX(
                            this.transcr.currentlevel.segments.get(segment_i).time.browserSample.value
                          );
                          this.audiochunk.selection = boundary_select.clone();
                          this.av.drawnselection = boundary_select.clone();
                          this.selchange.emit(this.audiochunk.selection);
                          this.drawSegments();

                          let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));
                          if (segment_i > 0) {
                            begin = this.transcr.currentlevel.segments.get(segment_i - 1);
                          }
                          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);

                          const posY1 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((beginX / this._innerWidth) + 1) *
                            (this.Settings.lineheight + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          const posY2 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((absX / this._innerWidth) + 1) *
                            (this.Settings.lineheight + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          if (xSamples >= this.audiochunk.selection.start.browserSample.value
                            && xSamples <= this.audiochunk.selection.end.browserSample.value) {
                            this.audiochunk.playposition.browserSample.value = this.audiochunk.selection.start.browserSample.value;
                            this.changePlayCursorSamples(this.audiochunk.selection.start.browserSample.value);
                            this.drawPlayCursorOnly(this.av.LastLine);

                            this.stopPlayback(() => {
                              // after stopping start audio playback
                              this.audiochunk.selection = boundary_select.clone();
                              this.playSelection(this.afterAudioEnded);
                            });
                          }

                          if (!this.Settings.multi_line) {
                            this.segmententer.emit({
                              index: segment_i,
                              pos: {Y1: posY1, Y2: posY2}
                            });
                          }
                        } else {
                          // TODO check this case again!
                          console.log(`segment invisible error: can't play because start and endtime not between the audiochunk time`);
                          this.alerttriggered.emit({
                            type: 'error',
                            message: this.langService.instant('segment invisible')
                          });
                        }
                      }
                    }
                    key_active = true;
                  }
                  break;
                case('delete_boundaries'):
                  if (this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly && this.av.focused) {
                    // TODO trigger event for logging?
                    for (let i = 0; i < this.transcr.currentlevel.segments.length; i++) {
                      const segment = this.transcr.currentlevel.segments.get(i);

                      if (segment.time.browserSample.value >= this.selection.start.browserSample.value
                        && segment.time.browserSample.value <= this.selection.end.browserSample.value) {
                        this.transcr.currentlevel.segments.removeByIndex(i, this.transcr.break_marker.code);
                        i--;
                      } else if (this.selection.end.browserSample.value < segment.time.browserSample.value) {
                        break;
                      }
                    }

                    this.selection.start = BrowserAudioTime.fromSamples(
                      0, this.audiomanager.browserSampleRate, this.audiomanager.originalSampleRate
                    );
                    this.selection.end = this.selection.start.clone();
                    this.av.drawnselection = this.selection;
                    this.update(false);
                    this.drawCursor(this.av.Mousecursor.line);
                    this.transcr.currentlevel.segments.onsegmentchange.emit();

                    key_active = true;
                  }
                  break;
                case('segment_enter'):
                  if (this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly && this.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'segment'});

                    const seg_index = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                      this.av.Mousecursor.timePos.browserSample
                    );
                    this.selectSegment(seg_index,
                      (posY1, posY2) => {
                        this.focused = false;
                        this.segmententer.emit({
                          index: seg_index,
                          pos: {Y1: posY1, Y2: posY2}
                        });
                      },
                      () => {
                        this.alerttriggered.emit({
                          type: 'error',
                          message: this.langService.instant('segment invisible')
                        });
                      });

                    key_active = true;
                  }
                  break;
                case('cursor_left'):
                  if (this.av.focused) {
                    // move cursor to left
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});

                    this.av.moveCursor('left', this.Settings.step_width_ratio * this.audioressource.info.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
                    key_active = true;
                  }
                  break;
                case('cursor_right'):
                  if (this.av.focused) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});

                    this.av.moveCursor('right', this.Settings.step_width_ratio * this.audioressource.info.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
                    key_active = true;
                  }
                  break;
                case('playonhover'):
                  if (this.av.focused && !this.Settings.boundaries.readonly) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'option'});
                    key_active = true;
                  }
                  break;
              }

              if (key_active) {
                break;
              }
            }
          }
        }

        if (key_active) {
          event.event.preventDefault();
        }
      }
    }
  }
  /**
   * playSelection() plays the selected signal fragment or the selection in this chunk
   */
  playSelection = (afterAudioEnded: () => void, onProcess: () => void = () => {
  }) => {
    const drawFunc = () => {
      this.anim.requestFrame(this.drawPlayCursor);
      onProcess();
    };

    this.audiochunk.startPlayback(drawFunc).then(() => {
      if (this.av.drawnselection.duration.browserSample.value > 0) {
        this.audiochunk.selection = this.av.drawnselection.clone();
        this.audiochunk.playposition = <BrowserAudioTime>this.audiochunk.selection.start.clone();
      }
      afterAudioEnded();
    });
    /*

    const id = this.subscrmanager.add(Observable.interval(40).subscribe(
      () => {
        const difference = Date.now() - this.audiomanager.lastUpdate;
        if (difference > 40) {
          this.audiochunk.playposition.browserSample.unix += difference;
          console.log(difference);
        }
        this.anim.requestFrame(this.drawPlayCursor);
      }
    ));

    const id2 = this.subscrmanager.add(this.audiochunk.statechange.subscribe(
      (state) => {
        if (state === PlayBackState.STOPPED || state === PlayBackState.PAUSED || state === PlayBackState.ENDED) {
          this.subscrmanager.remove(id);
          this.subscrmanager.remove(id2);
        }
      }
    ));*/
  }

  private drawFunc = () => {
    this.audiochunk.updatePlayPosition();
    this.anim.requestFrame(this.drawPlayCursor);
  }
  /**
   * draw PlayCursor. Call this method only while animation.
   */
  drawPlayCursor = () => {
    let currentAbsX = this.av.audioTCalculator.samplestoAbsX(
      (this.audiochunk.playposition.browserSample.value - this.audiochunk.time.start.browserSample.value));
    const endAbsX = this.av.audioTCalculator.samplestoAbsX(
      (this.audiochunk.time.end.browserSample.value - this.audiochunk.time.start.browserSample.value));
    currentAbsX = Math.min(currentAbsX, endAbsX - 1);
    this.changePlayCursorAbsX(currentAbsX);

    // get line of PlayCursor
    const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this._innerWidth);

    if (line) {
      this.drawPlayCursorOnly(line);
      this.av.LastLine = line;
      this.cd.markForCheck();
      this.cd.detectChanges();
    } else {
    }
  }
  /**
   * draw playcursor at its current position. You can call this method to update the playcursor view.
   * @param curr_line
   */
  drawPlayCursorOnly = (curr_line: Line) => {
    if (curr_line) {
      const player_width = this.Settings.playcursor.width;

      const relX = this.av.PlayCursor.absX - (curr_line.number * this._innerWidth);
      const relY = curr_line.Pos.y - this.av.viewRect.position.y;
      this.p_context.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);
      if (curr_line.number >= this.av.visibleLines.start && curr_line.number <= this.av.visibleLines.end &&
        relX <= curr_line.Size.width + this.Settings.margin.left) {
        this.p_context.strokeStyle = this.Settings.playcursor.color;
        this.p_context.beginPath();
        this.p_context.moveTo(relX, relY + 1);
        this.p_context.lineTo(relX, relY + curr_line.Size.height - 1);
        this.p_context.globalAlpha = 0.3;
        this.p_context.lineWidth = player_width;
        this.p_context.stroke();

        this.p_context.strokeStyle = 'rgb(0,0,0)';
        this.p_context.globalAlpha = 1;
        this.p_context.beginPath();
        this.p_context.moveTo(relX, relY + 1);
        this.p_context.lineTo(relX, relY + curr_line.Size.height - 1);
        this.p_context.lineWidth = 1;
        this.p_context.stroke();
      }
    }
  }
  /**
   * draws the timeline if timeline ist enabled
   */
  drawTimeLine = () => {
    if (this.Settings.timeline.enabled && this.av.LinesArray.length > 0
      && this.audiochunk.time.start.browserSample.value > 0 && this.av.AudioPxWidth > 0
    ) {
      let max_width = this.g_context.measureText(this.getmaxString(
        Math.round(this.audiochunk.time.duration.browserSample.value * 100) / 100, 2)
      ).width + 12;
      const sec_px = (this.Settings.multi_line)
        ? this.Settings.pixel_per_sec
        : this.av.audioTCalculator.samplestoAbsX(this.av.audioTCalculator.secondsToSamples(1),
          <BrowserAudioTime>this.audiochunk.selection.duration);

      max_width = max_width / sec_px;
      let t = this.av.audioTCalculator.secondsToSamples(max_width);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, <BrowserAudioTime>this.audiochunk.time.duration);
      t = this.av.audioTCalculator.absXChunktoSamples(max_width, this.audiochunk);
      t = t - this.audiochunk.time.start.browserSample.value;

      let mwidth_seconds = this.av.audioTCalculator.samplesToSeconds(t);
      mwidth_seconds = Math.round(mwidth_seconds * 100) / 100;
      t = this.av.audioTCalculator.secondsToSamples(mwidth_seconds);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, <BrowserAudioTime>this.audiochunk.time.duration);

      const parts = this.av.AudioPxWidth / max_width;
      const start_time: BrowserAudioTime = <BrowserAudioTime>this.audiochunk.time.start;

      this.g_context.font = this.Settings.timeline.fontWeight + ' ' + this.Settings.timeline.fontSize + 'px ' + this.Settings.timeline.font;
      this.g_context.fillStyle = this.Settings.timeline.foreColor;

      let sum_width = 0;

      if (Number.isFinite(parts)) {
        this.g_context.strokeStyle = 'black';
        for (let k = 0; k < parts - 1 && sum_width < this.av.AudioPxWidth; k++) {
          const line_num = Math.floor(sum_width / this.innerWidth);
          const line_obj = this.av.LinesArray[line_num];
          let seconds = start_time.browserSample.seconds + k * mwidth_seconds;
          const time2 = BrowserAudioTime.fromSeconds(seconds, this.audiomanager.browserSampleRate, this.audiomanager.originalSampleRate);
          let relX = this.av.audioTCalculator.samplestoAbsX(
            time2.browserSample.value - start_time.browserSample.value, <BrowserAudioTime>this.audiochunk.time.duration
          );
          relX = relX % this.innerWidth;
          seconds = Math.round(seconds * 100) / 100;
          this.g_context.beginPath();
          this.g_context.fillText(seconds.toString(), line_obj.Pos.x + relX + 6, line_obj.Pos.y + line_obj.Size.height -
            ((this.Settings.timeline.height - this.Settings.timeline.fontSize)));
          this.g_context.moveTo(relX, line_obj.Pos.y + line_obj.Size.height);
          this.g_context.lineTo(relX, line_obj.Pos.y + (line_obj.Size.height - this.Settings.timeline.height));
          this.g_context.closePath();
          this.g_context.stroke();

          sum_width += max_width;
        }
      } else {
        console.error('Audioviewer, number of parts of timeline is infinite!');
      }

      this.g_context.strokeStyle = null;
    }
  }

  /**
   * method called when audioplayback ended
   */
  private onAudioChunkStateChange = () => {
  }
  /**
   * change the absolute positon of playcursor
   * @param new_value
   */
  private changePlayCursorAbsX = (new_value: number) => {
    this.av.PlayCursor.changeAbsX(new_value, this.av.audioTCalculator, this.av.AudioPxWidth, this.audiochunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }
  /**
   * change samples of playcursor
   * @param new_value
   * @param chunk
   */
  private changePlayCursorSamples = (new_value: number, chunk?: AudioChunk) => {
    this.av.PlayCursor.changeSamples(new_value, this.av.audioTCalculator, chunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }
  private drawSelection = (line: Line) => {
    if (!(this.av.drawnselection === null || this.av.drawnselection === undefined)) {
      // draw gray selection
      const select = this.av.getRelativeSelectionByLine(
        line, this.av.drawnselection.start.browserSample.value, this.av.drawnselection.end.browserSample.value, this._innerWidth
      );
      if (line && select) {
        const left = select.start;
        const right = select.end;
        let x = (left > right) ? right : left;

        let w = 0;

        if (left > -1 && right > -1) {
          w = Math.abs(right - left);
        }

        // draw selection rectangle
        this.o_context.globalAlpha = 0.2;
        if (left < 1 || left > line.Size.width) {
          x = 1;
        }
        if (right < 1) {
          w = 0;
        }
        if (right < 1 || right > line.Size.width) {
          w = right;
        }

        if (w > 0) {
          this.o_context.fillStyle = this.Settings.selection.color;
          this.o_context.fillRect(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y, w, this.Settings.lineheight);
        }

        this.o_context.globalAlpha = 1.0;
      }
    }
  }

  ngOnInit() {
    this.anim = new CanvasAnimation(25);

    // drawn selection length is 0
    this.av.drawnselection = new AudioSelection(
      this.audiomanager.createBrowserAudioTime(0),
      this.audiomanager.createBrowserAudioTime(0)
    );

    this.subscrmanager.add(this.audiochunk.statechange.subscribe((state: PlayBackState) => {
      this.onAudioChunkStateChange();
    }));
  }

  ngAfterViewInit() {
    this.viewRect.size.width = this.aview.elementRef.nativeElement.clientWidth;
    this._innerWidth = this.viewRect.size.width - this.Settings.margin.left - this.Settings.margin.right;
    this.oldInnerWidth = this._innerWidth;

    this.initialize().then(() => {
      this.updateCanvasSizes();
      this.update(true);
    }).catch((err) => {
      console.error(err);
    });
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj.audiochunk === null || obj.audiochunk === undefined)) {
      const current: AudioChunk = obj.audiochunk.currentValue;

      if (!obj.audiochunk.firstChange) {
        if (!(current === null || current === undefined)) {
          if (!(obj.audiochunk.previousValue === null || obj.audiochunk.previousValue === undefined)) {
            // audiochunk already exists
            (<AudioChunk>obj.audiochunk.previousValue).destroy();
          }
          if (!this.av.Settings.justify_signal_height) {
            const zoomY = this.av.zoomY;
            // audiochunk changed
            this.initialize().then(() => {
              this.av.zoomY = zoomY;
              this.update(true);
            });
          } else {
            this.initialize().then(() => {
              this.update(true);
            }).catch((err) => {
              console.error(err);
            });
          }
        }
      }
    }
  }

  ngOnDestroy() {
    this.stopPlayback(() => {
    });
    this.av.destroy();
    this.subscrmanager.destroy();
  }

  public initialize(): Promise<void> {
    // initialize canvas
    this.graphicscanvas = this.graphicscanRef.elementRef.nativeElement;
    this.playcanvas = this.playcanRef.elementRef.nativeElement;
    this.overlaycanvas = this.overlaynacRef.elementRef.nativeElement;
    this.mousecanvas = this.mousecanRef.elementRef.nativeElement;
    this.textcanvas = this.textcanRef.elementRef.nativeElement;

    this.g_context = this.graphicscanvas.getContext('2d');
    this.p_context = this.playcanvas.getContext('2d');
    this.o_context = this.overlaycanvas.getContext('2d');
    this.m_context = this.mousecanvas.getContext('2d');
    this.t_context = this.textcanvas.getContext('2d');

    return this.av.initialize(this._innerWidth, this.audiochunk);
  }

  /**
   * updateCanvasSizes is needed to update the size of the canvas respective to window resizing
   */
  updateCanvasSizes() {
    this.av.viewRect.size.width = Number(this.aview.elementRef.nativeElement.clientWidth);
    this._innerWidth = Number(this.av.viewRect.size.width - this.Settings.margin.left - this.Settings.margin.right);
    const clientheight = this.aview.elementRef.nativeElement.clientHeight;

    this.av.updateLines(this._innerWidth);

    // set width
    this.graphicscanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.mousecanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.overlaynacRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.playcanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.textcanRef.changeAttr('width', this.av.viewRect.size.width.toString());


    if (this.Settings.multi_line) {
      this.av.realRect.size.height = this.Settings.margin.top +
        (this.Settings.lineheight + this.Settings.margin.bottom) * this.av.LinesArray.length;
    } else {
      this.av.realRect.size.height = clientheight;
    }

    // set height of the view rectangle
    this.av.viewRect.size.height = clientheight;

    // set height
    this.playcanRef.changeAttr('height', clientheight.toString());
    this.graphicscanRef.changeAttr('height', clientheight.toString());
    this.mousecanRef.changeAttr('height', clientheight.toString());
    this.overlaynacRef.changeAttr('height', clientheight.toString());
    this.textcanRef.changeAttr('height', clientheight.toString());
  }

  /**
   * drawGrid(h, v) draws a grid with h horizontal and v vertical lines over the canvas
   */
  drawGrid(startSamples: number, endSamples: number, hLines: number, line: Line) {
    if (startSamples >= 0 && endSamples >= startSamples) {
      const vLines = Math.floor((endSamples - startSamples) / this.audiomanager.originalInfo.samplerate);
      const pxSecond = Math.round(this.av.audioTCalculator.samplestoAbsX(this.audiomanager.originalInfo.samplerate));
      const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;
      const hZoom = Math.round(this._innerWidth / vLines);
      const vZoom = Math.round((this.Settings.lineheight - timeline_height) / hLines);

      if (pxSecond > 0 && vZoom > 0) {
        // --- get the appropriate context
        this.g_context.beginPath();
        this.g_context.strokeStyle = this.Settings.grid.color;
        // set vertical lines
        for (let x = pxSecond; x < line.Size.width; x = x + pxSecond) {
          this.g_context.moveTo(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y);
          this.g_context.lineTo(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y + this.Settings.lineheight - timeline_height);
        }

        // set horicontal lines
        for (let y = Math.round(vZoom / 2); y < this.Settings.lineheight - timeline_height; y = y + vZoom) {
          this.g_context.moveTo(line.Pos.x, y + line.Pos.y - this.av.viewRect.position.y);
          this.g_context.lineTo(line.Pos.x + line.Size.width, y + line.Pos.y - this.av.viewRect.position.y);
        }
        this.g_context.stroke();
      } else {
        console.error(`pcSecond is 0!`);
      }
    } else {
      console.error(`invalid start end samples`);
    }
  }

  /**
   * clearDisplay() clears all canvas and gives each canvas its initialized status
   */
  clearDisplay(line_num) {
    // get canvas
    const line_obj = this.av.LinesArray[line_num];

    if (!(line_obj === null || line_obj === undefined)) {
      if (this.Settings.cropping !== 'none') {
        this.crop(this.Settings.cropping, this.g_context);
        this.crop(this.Settings.cropping, this.o_context);
        this.crop(this.Settings.cropping, this.t_context);
      }

      const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;

      this.g_context.globalAlpha = 1.0;
      this.g_context.strokeStyle = this.Settings.frame.color;
      this.g_context.fillStyle = this.Settings.backgroundcolor;
      this.g_context.clearRect(line_obj.Pos.x, line_obj.Pos.y - this.av.viewRect.position.y, this._innerWidth,
        this.Settings.lineheight + this.margin.bottom);
      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this.av.viewRect.position.y, line_obj.Size.width,
        this.Settings.lineheight - timeline_height);
      this.g_context.lineWidth = 0.5;

      // draw margin bottom
      this.g_context.fillStyle = 'white';
      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this.av.viewRect.position.y + this.Settings.lineheight, line_obj.Size.width,
        this.Settings.margin.bottom);

      // draw timeline container
      if (this.Settings.timeline.enabled) {
        this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this.av.viewRect.position.y +
          (this.Settings.lineheight - timeline_height),
          line_obj.Size.width, timeline_height);
      }

      this.g_context.lineWidth = 1;
    }
  }

  /**
   * onMouseMove sets the selection to the current x values of the mouse move
   */
  onMouseMove($event) {
    const x = ($event.offsetX || $event.pageX - jQuery($event.target).offset().left);
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this.av.viewRect.position.y;

    const curr_line = this.av.getLineByMousePosition(x, y);

    this.mousecursorchange.emit(this.av.Mousecursor);

    if (curr_line) {
      this.focused = true;
      if (this.Settings.selection.enabled) {
        this.av.setMouseMovePosition($event.type, x, y, curr_line, this._innerWidth);
        this.drawCursor(curr_line);
        if (!(this.av.drawnselection === null || this.av.drawnselection === undefined) &&
          (this.av.drawnselection.length > 0 || this.av.dragableBoundaryNumber > -1)) {
          // only if there is something selected or boundary dragged you need to redraw the segments around this line
          this.drawSegments();
        }
      }
    } else {
      this.focused = false;
    }
  }

  /**
   * draws an black Border alongside the cropped audioviewer
   */
  drawCropBorder() {
    const radius = Math.round(this._innerWidth / 2);
    if (radius > 0) {
      this.t_context.moveTo(0, 0);
      this.t_context.beginPath();
      this.t_context.arc(radius, radius, radius - 2, 0, 2 * Math.PI, false);
      this.t_context.strokeStyle = 'black';
      this.t_context.lineWidth = 3;
      this.t_context.stroke();
    }
  }

  /**
   * drawCursor() changes the opacity of the mouse canvas in the selected line
   */
  drawCursor(line: Line) {
    if (line) {
      // TODO clear only last Cursor Position
      this.m_context.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);

      // --- now draw the cursor line ---
      this.m_context.globalAlpha = 1.0;
      this.m_context.strokeStyle = this.Settings.cursor.color;
      this.m_context.beginPath();
      this.m_context.moveTo(this.av.Mousecursor.relPos.x, line.Pos.y - this.av.viewRect.position.y);
      this.m_context.lineTo(this.av.Mousecursor.relPos.x, line.Pos.y - this.av.viewRect.position.y + this.Settings.lineheight - 1);
      this.m_context.stroke();
    }
  }

  /**
   * drawSegments() draws a vertical line for every boundary in the current audio viewer
   */
  drawSegments() {
    this.o_context.fillStyle = 'white';
    this.o_context.globalAlpha = 1.0;

    let drawn_segments = 0;
    let drawn_boundaries = 0;
    let cleared = 0;
    let drawn_selection = 0;
    const line_obj = null;

    if (!(line_obj === null || line_obj === undefined)) {
      // draw segments for this line only
      if (this.Settings.boundaries.enabled && this.transcr.currentlevel.segments) {
        const segments = this.transcr.currentlevel.segments.getSegmentsOfRange(
          this.audiochunk.time.start.browserSample.value, this.audiochunk.time.end.browserSample.value
        );

        const startline: Line = (line_obj.number > 0) ? this.av.LinesArray[line_obj.number - 1] : line_obj;
        const endline: Line = (line_obj.number < this.av.LinesArray.length - 1)
          ? this.av.LinesArray[line_obj.number + 1] : line_obj;

        const line_absx: number = startline.number * this._innerWidth;
        const line_samples: number = this.av.audioTCalculator.absXChunktoSamples(line_absx, this.audiochunk);
        const line_start: BrowserAudioTime = this.audiomanager.createBrowserAudioTime(line_samples);

        const endline_absx: number = endline.number * this._innerWidth;
        const line_samples_end: number = this.av.audioTCalculator.absXChunktoSamples(endline_absx + endline.Size.width, this.audiochunk);
        const line_end: BrowserAudioTime = this.audiomanager.createBrowserAudioTime(line_samples_end);

        const clearheight = endline.Pos.y - startline.Pos.y + line_obj.Size.height;
        cleared++;
        this.o_context.clearRect(startline.Pos.x - 5, startline.Pos.y - this.av.viewRect.position.y,
          Math.max(startline.Size.width, endline.Size.width) + 5, clearheight + 1);
        this.o_context.clearRect(startline.Pos.x - 5, startline.Pos.y - this.av.viewRect.position.y,
          Math.max(startline.Size.width, endline.Size.width) + 5, clearheight + 1);

        // console.log('DRAW SEGMENTS ' + this.Settings.height);
        const boundariesToDraw: {
          x: number,
          y: number
        }[] = [];

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const start = BrowserAudioTime.sub(<BrowserAudioTime>segments[i].time, <BrowserAudioTime>this.audiochunk.time.start);
          const absX = this.av.audioTCalculator.samplestoAbsX(start.browserSample.value);

          let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));

          if (i > 0) {
            begin = segments[i - 1];
          }

          /*
           three cases where segment has to be drawn:
           1. segment full visible in line
           2. segment's right border visible in line => fill to the left
           3. segment's left border visible in line => fill to the right
           4. segment's borders are out of the three lines

           left border: begin.time.samples
           right border: segment.samples
           */
          const beginSamples = begin.time.browserSample.value;
          const durationSamples = this.av.audioTCalculator.samplestoAbsX(segment.time.browserSample.value);
          if (
            (
              // segment started before the line and ended before the line ends
              beginSamples <= line_start.browserSample.value && beginSamples + durationSamples < line_end.browserSample.value
            )
            ||
            (
              // segment is full visible in line
              beginSamples >= line_start.browserSample.value && beginSamples <= line_end.browserSample.value
            )
            ||
            (
              // segment started after the line starts
              beginSamples >= line_start.browserSample.value && beginSamples + durationSamples > line_end.browserSample.value
            )
            ||
            (
              // segment started before and ends after the line
              beginSamples < line_start.browserSample.value && beginSamples + durationSamples > line_end.browserSample.value
            )
          ) {
            // sample in the lines space
            const line_num1 = startline.number;
            const line_num2 = endline.number;

            console.log(`draw segment (${beginSamples}) from line ${line_num1} to ${line_num2}`);
            // console.warn(`(${line_num1} | x | ${line_num2})`);

            for (let j = line_num1; j <= line_num2; j++) {
              const line = this.av.LinesArray[j];

              const h = line.Size.height;
              let relX = 0;

              relX = absX % this._innerWidth + this.Settings.margin.left;

              let select = this.av.getRelativeSelectionByLine(line, begin.time.browserSample.value, segments[i].time.browserSample.value,
                this._innerWidth);
              let w = 0;
              let x = select.start;

              if (select.start > -1 && select.end > -1) {
                w = Math.abs(select.end - select.start);
              }

              if (select.start < 1 || select.start > line.Size.width) {
                x = 1;
              }
              if (select.end < 1) {
                w = 0;
              }
              if (select.end < 1 || select.end > line.Size.width) {
                w = select.end;
              }

              if (line.number === this.av.LinesArray.length - 1 && i === segments.length - 1) {
                w = line.Size.width - select.start + 1;
              }

              if (segment.transcript === '') {
                this.o_context.globalAlpha = 0.2;
                this.o_context.fillStyle = 'red';
              } else if (segment.transcript === this.transcr.break_marker.code) {
                this.o_context.globalAlpha = 0.2;
                this.o_context.fillStyle = 'blue';
              } else if (segment.transcript !== '') {
                this.o_context.globalAlpha = 0.2;
                this.o_context.fillStyle = 'green';
              }

              drawn_segments++;
              if (w > 0) {
                console.log(`draw (${x + this.Settings.margin.left - 1}, ${line.Pos.y - this.av.viewRect.position.y}) Size(${w}, ${h})`);
                this.o_context.fillRect(x + this.Settings.margin.left - 1, line.Pos.y - this.av.viewRect.position.y, w, h);
              }
            }

            // draw boundaries
            const seg_linenum = (this._innerWidth < this.AudioPxWidth) ? Math.floor(absX / this._innerWidth) : 0;

            const line = this.av.LinesArray[seg_linenum];
            if (!(line === null || line === undefined)
              && segment.time.browserSample.value !== this.audioressource.info.duration.browserSample.value
              && seg_linenum >= line_num1 && seg_linenum <= line_num2) {
              const h = line.Size.height;
              let relX = 0;
              if (this.Settings.multi_line) {
                relX = absX % this._innerWidth + this.Settings.margin.left;
              } else {
                relX = absX + this.Settings.margin.left;
              }
              boundariesToDraw.push({
                x: relX,
                y: line.Pos.y - this.av.viewRect.position.y
              });
            }
          }
        }

        const line_num1 = startline.number;
        const line_num2 = endline.number;

        for (let j = line_num1; j <= line_num2; j++) {
          const line = this.av.LinesArray[j];
          this.drawSelection(line);
          drawn_selection++;
        }

        for (let j = 0; j < boundariesToDraw.length; j++) {
          const boundary = boundariesToDraw[j];

          this.o_context.globalAlpha = 1;
          this.o_context.beginPath();
          this.o_context.strokeStyle = this.Settings.boundaries.color;
          this.o_context.lineWidth = this.Settings.boundaries.width;
          this.o_context.moveTo(boundary.x, boundary.y - this.av.viewRect.position.y);
          this.o_context.lineTo(boundary.x, boundary.y - this.av.viewRect.position.y + this.av.LinesArray[j].Size.height);
          this.o_context.stroke();
          drawn_boundaries++;
        }
      }
    } else {
      cleared++;

      // draw segments for all visible lines
      if (this.Settings.boundaries.enabled && this.transcr.currentlevel.segments.length > 0) {
        const segments = this.transcr.currentlevel.segments.getSegmentsOfRange(
          this.audiochunk.time.start.browserSample.value, this.audiochunk.time.end.browserSample.value
        );

        this.o_context.globalAlpha = 1.0;

        const boundariesToDraw: {
          x: number,
          y: number
        }[] = [];

        this.o_context.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);
        this.t_context.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const start = BrowserAudioTime.sub(<BrowserAudioTime>segments[i].time, <BrowserAudioTime>this.audiochunk.time.start);
          const absX = this.av.audioTCalculator.samplestoAbsX(start.browserSample.value);
          let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));

          if (i > 0) {
            begin = segments[i - 1];
          }
          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);
          const line_num1 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(beginX / this._innerWidth) : 0;
          const line_num2 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(absX / this._innerWidth) : 0;

          if (
            ((line_num1 <= this.av.visibleLines.start && line_num2 <= this.av.visibleLines.end) ||
              (line_num1 >= this.av.visibleLines.start && line_num2 <= this.av.visibleLines.end) ||
              (line_num1 >= this.av.visibleLines.start && line_num2 >= this.av.visibleLines.end) ||
              (line_num1 <= this.av.visibleLines.start && line_num2 >= this.av.visibleLines.end))
            &&
            ((segment.time.browserSample.value >= this.audiochunk.time.start.browserSample.value && segment.time.browserSample.value <= this.audiochunk.time.end.browserSample.value)
              || (begin.time.browserSample.value >= this.audiochunk.time.start.browserSample.value && begin.time.browserSample.value <= this.audiochunk.time.end.browserSample.value)
              || (begin.time.browserSample.value < this.audiochunk.time.start.browserSample.value && segment.time.browserSample.value > this.audiochunk.time.end.browserSample.value))
          ) {
            let lastI = 0;

            for (let j = Math.max(line_num1, this.av.visibleLines.start); j <= Math.min(line_num2, this.av.visibleLines.end); j++) {
              const line = this.av.LinesArray[j];

              if (line) {
                const h = line.Size.height;
                let relX = 0;

                relX = absX % this._innerWidth + this.Settings.margin.left;

                const select = this.av.getRelativeSelectionByLine(line, begin.time.browserSample.value, segments[i].time.browserSample.value, this._innerWidth);
                let w = 0;
                let x = select.start;


                if (select.start > -1 && select.end > -1) {
                  w = Math.abs(select.end - select.start);
                }

                if (select.start < 1 || select.start > line.Size.width) {
                  x = 1;
                }
                if (select.end < 1) {
                  w = 0;
                }
                if (select.end < 1 || select.end > line.Size.width) {
                  w = select.end;
                }

                if (line.number === this.av.LinesArray.length - 1 && i === segments.length - 1) {
                  w = line.Size.width - select.start + 1;
                }

                if (segment.transcript === '') {
                  this.o_context.globalAlpha = 0.2;
                  this.o_context.fillStyle = 'red';
                } else if (segment.transcript === this.transcr.break_marker.code) {
                  this.o_context.globalAlpha = 0.2;
                  this.o_context.fillStyle = 'blue';
                } else if (segment.transcript !== '') {
                  this.o_context.globalAlpha = 0.2;
                  this.o_context.fillStyle = 'green';
                }

                drawn_segments++;
                this.o_context.fillRect(x + this.Settings.margin.left, line.Pos.y - this.av.viewRect.position.y, w, h);

                if (this.Settings.showTranscripts) {
                  // draw text
                  this.t_context.globalAlpha = 0.75;
                  this.t_context.fillStyle = 'white';
                  this.t_context.fillRect(x + this.Settings.margin.left, line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5 - 11, w, 18);
                  this.t_context.globalAlpha = 1;
                  this.t_context.fillStyle = 'black';
                  this.t_context.font = '11px Arial';
                  this.t_context.textAlign = 'center';

                  const text = segment.transcript;

                  if (line_num1 === line_num2) {
                    if (text !== '') {
                      const textLength = this.t_context.measureText(text).width;
                      let newText = text;
                      // segment in same line
                      if (textLength > w - 4) {
                        // crop text
                        const overflow = textLength / (w - 4) - 1;
                        const leftHalf = (1 - overflow) / 2;
                        newText = text.substring(0, Math.floor(text.length * leftHalf) - 1);
                        newText += '...';
                        newText += text.substring(Math.floor(text.length * leftHalf) + Math.floor(text.length * overflow));
                      }
                      this.t_context.fillText(newText, x + this.Settings.margin.left + 2 + w / 2, line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);

                    }
                  } else {
                    const totalWidth = this.av.audioTCalculator.samplestoAbsX(segment.time.browserSample.value - begin.time.browserSample.value);

                    if (j === line_num1) {
                      // current line is start line
                      const ratio = w / totalWidth;

                      // crop text
                      if (text !== '') {
                        let newText = text.substring(0, Math.floor(text.length * ratio) - 2);
                        const textLength = this.o_context.measureText(newText).width;

                        if (textLength > w) {
                          // crop text
                          const overflow = textLength / w - 1;
                          const leftHalf = w / textLength;
                          newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 2);
                        }
                        lastI = newText.length;
                        newText += '...';

                        this.t_context.fillText(newText, x + this.Settings.margin.left + 2 + w / 2, line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                      }
                    } else if (j === line_num2) {
                      // current line is end line
                      const ratio = w / totalWidth;

                      // crop text
                      if (text !== '') {
                        let newText = text.substring(lastI);

                        const textLength = this.o_context.measureText(newText).width;

                        if (textLength > w) {
                          // crop text
                          const leftHalf = w / textLength;
                          newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
                          newText = '...' + newText + '...';
                        } else if (segment.transcript !== this.transcr.break_marker.code) {
                          newText = '...' + newText;
                        } else {
                          newText = segment.transcript;
                        }

                        this.t_context.fillText(newText, x + this.Settings.margin.left + 2 + w / 2, line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                      }
                      lastI = 0;
                    } else if (text !== '') {
                      let w2 = 0;

                      if (line_num1 > -1) {
                        const lastPart = this.av.getRelativeSelectionByLine(this.av.LinesArray[line_num1], begin.time.browserSample.value, segments[i].time.browserSample.value, this._innerWidth);

                        if (lastPart.start > -1 && lastPart.end > -1) {
                          w2 = Math.abs(lastPart.end - lastPart.start);
                        }
                        if (lastPart.end < 1) {
                          w2 = 0;
                        }
                        if (lastPart.end < 1 || lastPart.end > this.av.LinesArray[line_num1].Size.width) {
                          w2 = lastPart.end;
                        }
                      }

                      const ratio = w / totalWidth;

                      const startRatio = Math.floor(((j - line_num1 - 1) * this._innerWidth + w2) / totalWidth);
                      const endIndex = lastI + Math.floor(text.length * ratio);

                      // placeholder
                      let newText = text.substring(lastI, endIndex);

                      const textLength = this.o_context.measureText(newText).width;

                      if (textLength > w) {
                        // crop text
                        const leftHalf = w / textLength;
                        newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
                      }
                      lastI += newText.length;

                      if (segment.transcript !== this.transcr.break_marker.code) {
                        newText = '...' + newText + '...';
                      } else {
                        newText = segment.transcript;
                      }

                      this.t_context.fillText(newText, x + this.Settings.margin.left + 2 + w / 2, line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                    }
                  }
                }
              }
            }
          } else if (line_num2 > this.av.visibleLines.end + 2) {
            break;
          }

          // draw boundary
          const line = this.av.LinesArray[line_num2];
          let boundaryCounter = 0;

          if (line_num2 >= this.av.visibleLines.start && line_num2 <= this.av.visibleLines.end &&
            !(line === null || line === undefined) && segment.time.browserSample.value !== this.audioressource.info.duration.browserSample.value) {
            const h = line.Size.height;
            let relX = 0;
            if (this.Settings.multi_line) {
              relX = absX % this._innerWidth + this.Settings.margin.left;
            } else {
              relX = absX + this.Settings.margin.left;
            }

            boundariesToDraw.push({
              x: relX,
              y: line.Pos.y - this.av.viewRect.position.y
            });
          }
        }

        // draw boundaries
        for (let i = 0; i < boundariesToDraw.length; i++) {
          const boundary = boundariesToDraw[i];
          const line = this.av.LinesArray[0];
          const h = line.Size.height;

          this.t_context.globalAlpha = 1;
          this.t_context.beginPath();
          this.t_context.strokeStyle = this.Settings.boundaries.color;
          this.t_context.lineWidth = this.Settings.boundaries.width;
          this.t_context.moveTo(boundary.x, boundary.y);
          this.t_context.lineTo(boundary.x, boundary.y + h);
          this.t_context.stroke();
          drawn_boundaries++;
        }

        // draw time labels
        if (this.Settings.showTimePerLine) {
          for (let j = this.av.visibleLines.start; j <= this.av.visibleLines.end; j++) {
            const line = this.av.LinesArray[j];

            if (!isNullOrUndefined(line)) {
              // draw time label
              const startSecond = line.number * this.secondsPerLine;
              const endSecond = Math.min(startSecond + this.secondsPerLine, this.audiochunk.time.duration.browserSample.seconds);

              // start time
              this.t_context.font = '10px Arial';
              this.t_context.fillStyle = 'black';
              const pipe = new Timespan2Pipe();
              this.t_context.fillText(pipe.transform(startSecond * 1000), line.Pos.x + 22, line.Pos.y + 10 - this.av.viewRect.position.y);

              // end time
              const length = this.t_context.measureText(pipe.transform(endSecond * 1000)).width;
              this.t_context.fillText(pipe.transform(endSecond * 1000), line.Pos.x + line.Size.width - length + 15, line.Pos.y + 10 - this.av.viewRect.position.y);


              // redraw line border
              this.t_context.strokeStyle = '#b5b5b5';
              this.t_context.lineWidth = 1;
              this.t_context.strokeRect(line.Pos.x, line.Pos.y - this.av.viewRect.position.y, line.Size.width, line.Size.height);
            }
          }
        }
      }

      // draw selection
      if (!(this.av.drawnselection === null || this.av.drawnselection === undefined)) {
        const sel_start = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.start.browserSample.value);
        const sel_end = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.end.browserSample.value);
        const line_num1 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(sel_start / this._innerWidth) : 0;
        const line_num2 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(sel_end / this._innerWidth) : 0;

        // console.log('DRAW Selection ' + this.Settings.height);
        for (let j = line_num1; j <= line_num2; j++) {
          const line = this.av.LinesArray[j];
          this.drawSelection(line);
          drawn_selection++;
        }
      }
    }

    this.drawTimeLine();
    const tmanager = new TaskManager([{
      'name': 'compute',
      'do': function (args) {
        var width = args[0];
        var height = args[1];
        var cha = args[2];
        var _interval = args[3];
        var round_values = args[4];
        width = Math.floor(width);

        if (_interval.start !== null && _interval.end !== null && _interval.end >= _interval.start) {
          const min_maxarray = [], len = _interval.end - _interval.start;

          let min = 0,
            max = 0,
            val = 0,
            offset = 0,
            maxindex = 0;

          const xZoom = len / width;

          const yZoom = height / 2;

          for (let i = 0; i < width; i++) {
            offset = Math.round(i * xZoom) + _interval.start;
            min = cha[offset];
            max = cha[offset];

            if (isNaN(cha[offset])) {
              break;
            }

            if ((offset + xZoom) > _interval.start + len) {
              maxindex = len;
            } else {
              maxindex = Math.round(offset + xZoom);
            }

            for (let j = offset; j < maxindex; j++) {
              val = cha[j];
              max = Math.max(max, val);
              min = Math.min(min, val);
            }

            if (round_values) {
              min_maxarray.push(Math.round(min * yZoom));
              min_maxarray.push(Math.round(max * yZoom));
            } else {
              min_maxarray.push(min * yZoom);
              min_maxarray.push(max * yZoom);
            }
          }

          return min_maxarray;
        } else {
          throw new Error('interval.end is less than interval.start');
        }
      }
    }]);
    const log = new Logger('draw segments');
    log.addEntry('log', `cleared: ${cleared}`);
    log.addEntry('log', `drawn_areas: ${drawn_segments}`);
    log.addEntry('log', `drawn_boundaries: ${drawn_boundaries}`);
    log.addEntry('log', `drawn_selection: ${drawn_selection}`);
    // log.output();
  }

  /**
   * onClick sets the selection to the current x values of the click
   */
  onClick($event) {
    const x = ($event.offsetX || $event.pageX - jQuery($event.target).offset().left);
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this.av.viewRect.position.y;

    const curr_line = this.av.getLineByMousePosition(x, y);

    if (curr_line && this.Settings.selection.enabled) {
      if ($event.type === 'mousedown') {
        this.av.drawnselection.start = this.av.Mousecursor.timePos.clone();
        this.audiochunk.selection.start = this.av.Mousecursor.timePos.clone();
      }
      this.av.setMouseClickPosition(x, y, curr_line, $event, this._innerWidth, this).then((curr: Line) => {
        this.drawPlayCursorOnly(curr);
      });
      this.drawCursor(this.av.LastLine);
      if ($event.type !== 'mousedown') {
        this.selchange.emit(this.audiochunk.selection);
      }

      this.drawSegments();
    }
  }

  /**
   * stops audio playback
   */
  stopPlayback(afterAudioEnded: () => void) {
    if (this.audiomanager.state === PlayBackState.PLAYING) {
      this.audiochunk.stopPlayback().then(() => {
        this.afterAudioStopped();
        afterAudioEnded();
      }).catch((error) => {
        console.error(error);
      });
    } else {
      afterAudioEnded();
    }
  }

  /**
   * pause audio playback
   */
  pausePlayback(afterAudioEnded: () => void) {
    if (this.audiomanager.state === PlayBackState.PLAYING) {
      this.audiochunk.pausePlayback().then(() => {
        this.afterAudioPaused();
        afterAudioEnded();
      }).catch((error) => {
        console.error(error);
      });
    } else {
      console.error(`can't pause!!`);
      afterAudioEnded();
    }
  }

  /**
   * start audio playback
   */
  startPlayback(onProcess: () => void = () => {
  }) {
    if (this.audiomanager.state !== PlayBackState.PLAYING && this.av.MouseClickPos.absX < this.av.AudioPxWidth - 5) {

      this.playSelection(this.afterAudioEnded, onProcess);
    } else {
      console.error(`can't start PlayBack`);
    }
  }

  /**
   * set audio for replay and returns if replay is active
   * @returns {boolean}
   */
  rePlayback() {
    this.audiochunk.toggleReplay();
  }

  /**
   * step to last position
   */
  stepBackward(afterAudioEnded: () => void) {
    this.audiochunk.stepBackward(() => {
      this.afterAudioStepBack();
      afterAudioEnded();
    });
  }

  stepBackwardTime(afterAudioEnded: () => void, back_sec: number) {
    this.audiochunk.stepBackwardTime(back_sec, this.drawFunc).then(() => {
      this.afterAudioStepBackTime();
      afterAudioEnded();
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * adjust the view when window resized
   * @param $event
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizing = true;
    this.av.viewRect.size.width = this.aview.elementRef.nativeElement.clientWidth;
    this._innerWidth = this.av.viewRect.size.width - this.Settings.margin.left - this.Settings.margin.right;

    // only resize if size has changed and resizing not in processing state
    if (this._innerWidth !== this.oldInnerWidth) {
      setTimeout(() => {
        if ((!this.Settings.multi_line || this.av.AudioPxWidth < this._innerWidth) && !this.resizing) {
          this.av.AudioPxWidth = this._innerWidth;
          this.av.audioTCalculator.audio_px_width = this._innerWidth;
          const ratio = this._innerWidth / this.oldInnerWidth;

          this.changePlayCursorAbsX((this.av.PlayCursor.absX * ratio));
          this.update(true);
        } else if (this.Settings.multi_line && !this.resizing) {
          this.onSecondsPerLineUpdated(this.secondsPerLine);
        }

        if (this.av.PlayCursor.absX > 0) {
          const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this._innerWidth);

          if (line) {
            this.drawPlayCursorOnly(line);
          }
        }
      }, 100);
    }

    this.resizing = false;
  }

  public getLocation(): any {
    const rect = this.aview.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  public selectSegment(seg_index: number, successcallback: (posY1: number, posY2: number) => void = () => {
                       },
                       errorcallback: () => void = () => {
                       }): boolean {
    if (seg_index > -1) {
      const segment = this.transcr.currentlevel.segments.get(seg_index);
      const start_time = this.transcr.currentlevel.segments.getStartTime(seg_index);
      // make shure, that segments boundaries are visible
      if (start_time.browserSample.value >= this.audiochunk.time.start.browserSample.value
        && segment.time.browserSample.value <= this.audiochunk.time.end.browserSample.value) {
        const absX = this.av.audioTCalculator.samplestoAbsX(this.transcr.currentlevel.segments.get(seg_index).time.browserSample.value);
        let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));
        if (seg_index > 0) {
          begin = this.transcr.currentlevel.segments.get(seg_index - 1);
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);
        const posY1 = (this._innerWidth < this.AudioPxWidth)
          ? Math.floor((beginX / this._innerWidth) + 1) * (this.Settings.lineheight + this.Settings.margin.bottom)
          - this.Settings.margin.bottom
          : 0;

        let posY2 = 0;

        if (this._innerWidth < this.AudioPxWidth) {
          posY2 = Math.floor((absX / this._innerWidth) + 1) * (this.Settings.lineheight +
            this.Settings.margin.bottom) - this.Settings.margin.bottom;
        }

        const boundary_select = this.av.getSegmentSelection(segment.time.browserSample.value - 1);
        if (boundary_select) {
          this.audiochunk.selection = boundary_select;
          this.av.drawnselection = boundary_select.clone();
          this.drawSegments();
          this.Settings.selection.color = 'gray';
          this.audiochunk.playposition.browserSample.value = this.audiochunk.selection.start.browserSample.value;
          this.changePlayCursorSamples(this.audiochunk.selection.start.browserSample.value);
          this.drawPlayCursorOnly(this.av.LastLine);

          if (this.audiomanager.isPlaying) {
            this.audiomanager.stopPlayback().catch((error) => {
              console.error(error);
            });
          }
        }

        successcallback(posY1, posY2);

        return true;
      } else {
        console.log(`segment invisible error: start and endtime not between the audiochunk time`);
        errorcallback();
      }
      return false;
    } else {
      console.log(`segment invisible error: seg-index is -1`);
      errorcallback();
    }
    return false;
  }

  public focus() {
    this.playcanvas.focus();
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    if ((this.av.realRect.size.height > this.av.viewRect.size.height)) {
      if (BrowserInfo.os === 'mac') {
        this.av.viewRect.position.y = Math.max(0, this.av.viewRect.position.y - event.deltaY);
      } else {
        this.av.viewRect.position.y = Math.max(0, this.av.viewRect.position.y + event.deltaY);
      }
      this.scrollTo(this.av.viewRect.position.y);
    }
  }

  public scrollTo(y_coord: number, scrollbar: boolean = false) {
    if ((this.av.realRect.size.height > this.av.viewRect.size.height)) {
      this.scrolling.emit({state: 'scrolling'});
      this.av.viewRect.position.y = Math.max(0, y_coord);
      this.av.viewRect.position.y = Math.min(this.av.viewRect.position.y, this.av.realRect.size.height - this.av.viewRect.size.height);
      this.updateVisibleLines();

      if (!(this.wheeling === null || this.wheeling === undefined)) {
        window.clearTimeout(this.wheeling);
      }
      this.wheeling = setTimeout(() => {
        if (!scrollbar) {
          this.scrolling.emit({state: 'stopped'});
        }
        this.update(false);
      }, 20);
    } else {
      if (!scrollbar) {
        this.scrolling.emit({state: 'stopped'});
      }
    }
  }

  onSliderChanged($event: MouseEvent) {
    if (this.av.viewRect.size.height >= this.av.viewRect.size.height) {
      if ($event.type === 'mousemove') {
        if (this.scrollbar.dragging) {
          this.scrollTo(($event.layerY / this.av.viewRect.size.height) * this.av.realRect.size.height, true);
        }
      } else if ($event.type === 'mousedown') {
        this.scrollbar.dragging = true;
      } else if ($event.type === 'mouseup' || $event.type === 'mouseleave' || $event.type === 'mouseout') {
        this.scrolling.emit({state: 'stopped'});
        this.scrollbar.dragging = false;
      } else if ($event.type === 'click') {
        if (!this.scrollbar.dragging) {
          this.scrollTo(($event.layerY / this.av.viewRect.size.height) * this.av.realRect.size.height, false);
        }
        this.scrollbar.dragging = false;
      }
    }
  }

  /**
   * get the max size possible of an number in px
   * @param num
   * @param d
   * @returns {string}
   */
  private getmaxString(num: number, d: number): string {
    let result = '';

    for (let i = num; i > 1; i = i / 10) {
      result += '9';
    }

    if (d > 0) {
      result += '.';
    }

    for (let i = 0; i < d; i++) {
      result += '9';
    }

    return result;
  }

  /**
   * crop audioviewer
   * @param type "none" or "circle"
   * @param context
   */
  private crop(type: string, context: CanvasRenderingContext2D) {
    if (type === 'none' || type === 'circle') {
      const radius = Math.round(this._innerWidth / 2);

      if (radius > 0 && !(context === null || context === undefined)) {
        const half_height = Math.round(this.viewRect.size.height / 2);
        // crop Line
        context.globalAlpha = 1.0;
        context.save();
        context.beginPath();
        context.arc(radius, half_height, radius, 0, 2 * Math.PI, false);
        context.closePath();
        context.clip();

        this.m_context.globalAlpha = 1.0;
        this.m_context.save();
        this.m_context.beginPath();
        this.m_context.arc(radius, half_height, radius, 0, 2 * Math.PI, false);
        this.m_context.closePath();
        this.m_context.clip();
      }
    }
  }

  /**
   * checks if the comboKey is part of the list of disabled keys
   * @param comboKey
   * @returns {boolean}
   */
  private isDisabledKey(comboKey: string): boolean {
    for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
      if (this.Settings.disabled_keys[i] === comboKey) {
        return true;
      }
    }

    return false;
  }

  private updateVisibleLines() {
    this.av.visibleLines.start = Math.floor(this.av.viewRect.position.y / (this.Settings.lineheight + this.Settings.margin.bottom));
    this.av.visibleLines.end = Math.floor(
      (this.av.viewRect.position.y + this.av.viewRect.size.height) / (this.Settings.lineheight + this.Settings.margin.bottom)
    );
  }

  private afterAudioStopped() {
    this.drawPlayCursor();
  }

  private afterAudioPaused = () => {
    this.drawPlayCursor();
  }

  private afterAudioStepBack = () => {
    this.av.PlayCursor.changeSamples(this.audiochunk.lastplayedpos.browserSample.value, this.av.audioTCalculator, this.audiochunk);
    this.startPlayback();
  }

  private afterAudioStepBackTime = () => {
    this.av.PlayCursor.changeSamples(this.audiochunk.lastplayedpos.browserSample.value, this.av.audioTCalculator, this.audiochunk);
    this.startPlayback();
  }

  /**
   * called if audio ended normally because end of segment reached
   */
  private afterAudioEnded = () => {
    if (!this.audiochunk.replay) {
      // let cursor jump to start
      this.audiochunk.playposition = <BrowserAudioTime>this.audiochunk.selection.start.clone();
      this.av.drawnselection = this.av.drawnselection.clone();
      this.drawSegments();
    }

    this.drawPlayCursor();
  }

  public onSecondsPerLineUpdated(seconds: number) {
    this.Settings.pixel_per_sec = this.getPixelPerSecond(seconds);
    this.secondsPerLine = seconds;
    this.clearAll();
    this.initialize().then(() => {
      this.updateCanvasSizes();
      this.update(true);

      if (this.viewRect.position.y >= this.realRect.size.height) {
        this.scrollTo(this.realRect.size.height - this.viewRect.size.height, true);
      }
    }).catch((err) => {
      this.update(true);
      console.error(err);
    });
  }

  private getPixelPerSecond(secondsPerLine: number) {
    return (this._innerWidth / secondsPerLine);
  }

  public clearAll() {
    this.g_context.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.m_context.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.p_context.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.t_context.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
  }
}
