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
import {AudioRessource, AudioSelection, BrowserAudioTime, BrowserSample} from '../../../obj/media/audio';
import {PlayBackState} from '../../../obj/media';
import {Interval, Margin, Rectangle} from '../../../objects';
import {AudioviewerConfig} from './audioviewer.config';
import {AVMousePos, CanvasAnimation, Line, PlayCursor} from '../../../obj';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {KeymappingService, TranscriptionService} from '../../../../core/shared/service';
import {BrowserInfo, Logger, Segment} from '../../../../core/shared';
import {Timespan2Pipe} from '../../../pipe/timespan2.pipe';
import {isNullOrUndefined} from '../../../../core/shared/Functions';
import {Subject} from 'rxjs';
import {AudioChunk, AudioManager} from '../../../obj/media/audio/AudioManager';

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

  public get settings(): AudioviewerConfig {
    return this.av.Settings;
  }

  @Input()
  public set settings(newSettings: AudioviewerConfig) {
    this.av.Settings = newSettings;
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

  get roundValues(): boolean {
    return this.settings.roundValues;
  }

  set roundValues(value: boolean) {
    this.settings.roundValues = value;
  }

  @Output('pos_time')
  get pos_time(): number {
    return this.av.PlayCursor.timePos.browserSample.value;
  }

  get innerWidth(): number {
    return this._innerWidth;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get deactivateShortcuts(): boolean {
    return this._deactivateShortcuts;
  }

  set deactivateShortcuts(value: boolean) {
    this._deactivateShortcuts = value;
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
  @ViewChild('audioview', {static: true}) aview;
  @ViewChild('graphicscan', {static: true}) graphicscanRef;
  @ViewChild('graphicscan2', {static: false}) graphicscanRef2;
  @ViewChild('overlaycan', {static: true}) overlaynacRef;
  @ViewChild('playcan', {static: true}) playcanRef;
  @ViewChild('mousecan', {static: true}) mousecanRef;
  @ViewChild('textcan', {static: true}) textcanRef;

  // EVENTS
  public onInitialized = new Subject();
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
  private gContext: CanvasRenderingContext2D = null;
  private pContext: CanvasRenderingContext2D = null;
  private oContext: CanvasRenderingContext2D = null;
  private mContext: CanvasRenderingContext2D = null;
  private tContext: CanvasRenderingContext2D = null;

  private wheeling;
  private resizing = false;
  // for animation of playcursor
  private anim: CanvasAnimation;
  private oldInnerWidth = 0;

  // size settings
  private _innerWidth = 0;
  public secondsPerLine = 5;

  private _initialized = false;

  private _deactivateShortcuts = false;
  /**
   * update and redraw audioviewer
   * @param computeDisplayData should display data be recomputed?
   */
  public update = (computeDisplayData: boolean = false) => {
    return new Promise<void>((resolve, reject) => {

      if (this.AudioPxWidth > 0) {
        this.updateVisibleLines();
        if (!this.updating) {
          this.updating = true;

          const drawBackground = () => {
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
              if (this.settings.cropping !== 'none') {
                this.av.Mousecursor.relPos.x = Math.round(this._innerWidth / 2);
                this.drawCropBorder();
              }

              if (this.settings.timeline.enabled) {
                this.drawTimeLine();
              }
            } else {
              console.error('0 lines?');
            }
          };

          const drawSignal = () => {
            this.av.updateLines(this._innerWidth);
            if (this.av.LinesArray.length > 0) {
              // draw signal. Separate for loop because of performance issues
              for (let i = this.av.visibleLines.start; i <= this.av.visibleLines.end; i++) {
                if (!this.drawSignal(i)) {
                  break;
                }
              }
              if (this.settings.cropping !== 'none') {
                this.av.Mousecursor.relPos.x = Math.round(this._innerWidth / 2);
                this.drawCursor(this.av.LinesArray[0]);
                this.drawCropBorder();
              }
              if (this.settings.selection.enabled) {
                this.drawPlayCursor();
                this.drawCursor(this.av.Mousecursor.line);
              }
              this._initialized = true;
              this.onInitialized.complete();
            } else {
              console.error('0 lines?');
            }
          };

          if (!(this.audiomanager.channelData === null || this.audiomanager.channelData === undefined)) {
            if (computeDisplayData) {
              this.av.refreshComputedData().then(() => {
                drawBackground();
                drawSignal();
                resolve();
              }).catch((err) => {
                console.error(err);
                reject(err);
              });
            } else {
              drawBackground();
              drawSignal();
              resolve();
            }
          } else {
            console.error('audio channelData is null');
            reject('audio channelData is null');
          }

          this.oldInnerWidth = this._innerWidth;
          this.updating = false;
        }
      } else {
        console.error('audiopx 0, ' + this.name);
        reject('audiopx 0');
      }
    });
  }
  /**
   * drawSignal(array) draws the min-max pairs of values in the canvas
   *
   * in a different color. This is probable due to there being only a final
   * stroke()-command after the loop.
   *
   */
  drawSignal = (lineNum) => {
    // get canvas
    const lineObj = this.av.LinesArray[lineNum];
    const timeLineHeight = (this.settings.timeline.enabled) ? this.settings.timeline.height : 0;

    if (!(lineObj === null || lineObj === undefined)) {
      // line_obj found
      const midline = Math.round((this.settings.lineheight - timeLineHeight) / 2);
      const xPos = lineNum * this.innerWidth;

      const zoomX = this.av.zoomX;
      const zoomY = this.av.zoomY;

      this.gContext.strokeStyle = this.settings.data.color;
      this.gContext.beginPath();
      this.gContext.moveTo(lineObj.Pos.x, lineObj.Pos.y + midline - this.av.minmaxarray[xPos] - this.av.viewRect.position.y);

      if (!(midline === null || midline === undefined) &&
        !(lineObj.Pos === null || lineObj.Pos === undefined)
        && !(this.av.minmaxarray === null || this.av.minmaxarray === undefined)
        && !(zoomY === null || zoomY === undefined)) {
        for (let x = 0; (x + xPos) < xPos + lineObj.Size.width; x++) {
          const xDraw = (!this.settings.roundValues) ? lineObj.Pos.x + (x * zoomX) : Math.round(lineObj.Pos.x + (x * zoomX));
          const yDraw = (!this.settings.roundValues)
            ? (lineObj.Pos.y - this.av.viewRect.position.y + midline - (this.av.minmaxarray[x + xPos] * zoomY))
            : Math.round(lineObj.Pos.y - this.av.viewRect.position.y + midline - (this.av.minmaxarray[x + xPos] * zoomY));

          if (!isNaN(yDraw) && !isNaN(xDraw)) {
            this.gContext.lineTo(xDraw, yDraw);
          } else {
            break;
          }

        }
      } else {
        if ((midline === null || midline === undefined)) {
          throw Error('midline is null!');
        } else if ((lineObj.Pos === null || lineObj.Pos === undefined)) {
          throw Error('Pos is null!');
        } else if ((this.av.minmaxarray === null || this.av.minmaxarray === undefined)) {
          throw Error('MinMax Array is null!');
        } else if ((zoomY === null || zoomY === undefined)) {
          throw Error('ZoomY is null!');
        }
      }
      this.gContext.stroke();
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
    this.av.shiftPressed = comboKey === 'SHIFT';

    if (this.settings.shortcutsEnabled && !this.deactivateShortcuts) {
      const platform = BrowserInfo.platform;

      if (this.av.focused && this.isDisabledKey(comboKey)) {
        // key pressed is disabled by config
        event.event.preventDefault();
      }

      if (this.settings.shortcuts) {
        let keyActive = false;
        for (const shortc in this.settings.shortcuts) {
          if (this.settings.shortcuts.hasOwnProperty(shortc)) {
            const shortcut = this.settings.shortcuts['' + shortc + ''];
            const focuscheck = (!(shortcut === null || shortcut === undefined)) && (shortcut.focusonly === false
              || (shortcut.focusonly === this.focused === true));

            if (focuscheck && this.settings.shortcuts['' + shortc + ''].keys['' + platform + ''] === comboKey) {
              switch (shortc) {
                case('play_pause'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});
                  if (this.audiomanager.state === PlayBackState.PLAYING) {
                    this.pausePlayback(() => {
                    });
                  } else {
                    this.startPlayback();
                  }
                  keyActive = true;
                  break;
                case('stop'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stopPlayback(() => {
                  });
                  keyActive = true;
                  break;
                case('step_backward'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackward(() => {
                  });
                  keyActive = true;
                  break;
                case('step_backwardtime'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackwardTime(() => {
                  }, 0.5);
                  keyActive = true;
                  break;
                case('set_boundary'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this.av.focused) {
                    let segments = this.transcr.currentlevel.segments;
                    const result = this.av.addSegment();
                    segments = this.transcr.currentlevel.segments;
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
                    keyActive = true;
                  }
                  break;
                case('set_break'):
                  if (this.settings.boundaries.enabled && this.av.focused) {
                    const xSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.Mousecursor.absX, this.audiochunk);

                    if (xSamples > -1) {
                      const segmentI = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                        new BrowserSample(xSamples, this.audiomanager.browserSampleRate)
                      );
                      const segment = this.transcr.currentlevel.segments.get(segmentI);
                      if (segmentI > -1) {
                        if (segment.transcript !== this.transcr.breakMarker.code) {
                          segment.transcript = this.transcr.breakMarker.code;
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

                    keyActive = true;
                  }
                  break;
                case('play_selection'):
                  if (this.av.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                    const xSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.Mousecursor.absX, this.audiochunk);

                    const boundarySelect = this.av.getSegmentSelection(this.av.Mousecursor.timePos.browserSample.value);
                    if (boundarySelect) {
                      const segmentI = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                        new BrowserSample(xSamples, this.audiomanager.browserSampleRate));
                      if (segmentI > -1) {
                        const segment = this.transcr.currentlevel.segments.get(segmentI);
                        const startTime = this.transcr.currentlevel.segments.getStartTime(segmentI);
                        // make shure, that segments boundaries are visible
                        if (startTime.browserSample.value >= this.audiochunk.time.start.browserSample.value &&
                          segment.time.browserSample.value <= (this.audiochunk.time.end.browserSample.value + 1)) {
                          const absX = this.av.audioTCalculator.samplestoAbsX(
                            this.transcr.currentlevel.segments.get(segmentI).time.browserSample.value
                          );
                          this.audiochunk.selection = boundarySelect.clone();
                          this.av.drawnselection = boundarySelect.clone();
                          this.selchange.emit(this.audiochunk.selection);
                          this.drawSegments();

                          let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));
                          if (segmentI > 0) {
                            begin = this.transcr.currentlevel.segments.get(segmentI - 1);
                          }
                          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);

                          const posY1 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((beginX / this._innerWidth) + 1) *
                            (this.settings.lineheight + this.settings.margin.bottom) - this.settings.margin.bottom
                            : 0;

                          const posY2 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((absX / this._innerWidth) + 1) *
                            (this.settings.lineheight + this.settings.margin.bottom) - this.settings.margin.bottom
                            : 0;

                          if (xSamples >= this.audiochunk.selection.start.browserSample.value
                            && xSamples <= this.audiochunk.selection.end.browserSample.value) {
                            this.audiochunk.playposition.browserSample.value = this.audiochunk.selection.start.browserSample.value;
                            this.changePlayCursorSamples(this.audiochunk.selection.start.browserSample.value);
                            this.drawPlayCursorOnly(this.av.LastLine);

                            this.stopPlayback(() => {
                              // after stopping start audio playback
                              this.audiochunk.selection = boundarySelect.clone();
                              this.playSelection(this.afterAudioEnded);
                            });
                          }

                          if (!this.settings.multiLine) {
                            this.segmententer.emit({
                              index: segmentI,
                              pos: {Y1: posY1, Y2: posY2}
                            });
                          }
                        } else {
                          // TODO check this case again!
                          console.log(`segment invisible error: can't play because start and endtime not between the audiochunk time`);
                          console.log(`${segment.time.browserSample.value} <= ${this.audiochunk.time.end.browserSample.value}`);
                          this.alerttriggered.emit({
                            type: 'error',
                            message: this.langService.instant('segment invisible')
                          });
                        }
                      }
                    }
                    keyActive = true;
                  }
                  break;
                case('delete_boundaries'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this.av.focused) {
                    // TODO trigger event for logging?
                    for (let i = 0; i < this.transcr.currentlevel.segments.length; i++) {
                      const segment = this.transcr.currentlevel.segments.get(i);

                      if (segment.time.browserSample.value >= this.selection.start.browserSample.value
                        && segment.time.browserSample.value <= this.selection.end.browserSample.value) {
                        this.transcr.currentlevel.segments.removeByIndex(i, this.transcr.breakMarker.code);
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

                    keyActive = true;
                  }
                  break;
                case('segment_enter'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'segment'});

                    const segInde = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                      this.av.Mousecursor.timePos.browserSample
                    );
                    this.selectSegment(segInde,
                      (posY1, posY2) => {
                        this.focused = false;
                        this.segmententer.emit({
                          index: segInde,
                          pos: {Y1: posY1, Y2: posY2}
                        });
                      },
                      () => {
                        this.alerttriggered.emit({
                          type: 'error',
                          message: this.langService.instant('segment invisible')
                        });
                      });

                    keyActive = true;
                  }
                  break;
                case('cursor_left'):
                  if (this.av.focused) {
                    // move cursor to left
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});

                    this.av.moveCursor('left', this.settings.stepWidthRatio * this.audioressource.info.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
                    keyActive = true;
                  }
                  break;
                case('cursor_right'):
                  if (this.av.focused) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});

                    this.av.moveCursor('right', this.settings.stepWidthRatio * this.audioressource.info.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
                    keyActive = true;
                  }
                  break;
                case('playonhover'):
                  if (this.av.focused && !this.settings.boundaries.readonly) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'option'});
                    keyActive = true;
                  }
                  break;
              }

              if (keyActive) {
                break;
              }
            }
          }
        }

        if (keyActive) {
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
      if (this.av.drawnselection !== null && this.av.drawnselection.duration.browserSample.value > 0) {
        this.audiochunk.selection = this.av.drawnselection.clone();
        this.audiochunk.playposition = this.audiochunk.selection.start.clone() as BrowserAudioTime;
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

      try {
        this.cd.markForCheck();
        this.cd.detectChanges();
      } catch (e) {

      }
    } else {
    }
  }
  /**
   * draw playcursor at its current position. You can call this method to update the playcursor view.
   */
  drawPlayCursorOnly = (currLine: Line) => {
    if (currLine) {
      const playerWidth = this.settings.playcursor.width;

      const relX = this.av.PlayCursor.absX - (currLine.number * this._innerWidth);
      const relY = currLine.Pos.y - this.av.viewRect.position.y;
      this.pContext.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);
      if (currLine.number >= this.av.visibleLines.start && currLine.number <= this.av.visibleLines.end &&
        relX <= currLine.Size.width + this.settings.margin.left) {
        this.pContext.strokeStyle = this.settings.playcursor.color;
        this.pContext.beginPath();
        this.pContext.moveTo(relX, relY + 1);
        this.pContext.lineTo(relX, relY + currLine.Size.height - 1);
        this.pContext.globalAlpha = 0.3;
        this.pContext.lineWidth = playerWidth;
        this.pContext.stroke();

        this.pContext.strokeStyle = 'rgb(0,0,0)';
        this.pContext.globalAlpha = 1;
        this.pContext.beginPath();
        this.pContext.moveTo(relX, relY + 1);
        this.pContext.lineTo(relX, relY + currLine.Size.height - 1);
        this.pContext.lineWidth = 1;
        this.pContext.stroke();
      }
    }
  }
  /**
   * draws the timeline if timeline ist enabled
   */
  drawTimeLine = () => {
    if (this.settings.timeline.enabled && this.av.LinesArray.length > 0
      && this.audiochunk.time.start.browserSample.value > 0 && this.av.AudioPxWidth > 0
    ) {
      let maxWidth = this.gContext.measureText(this.getmaxString(
        Math.round(this.audiochunk.time.duration.browserSample.value * 100) / 100, 2)
      ).width + 12;
      const secPx = (this.settings.multiLine)
        ? this.settings.pixelPerSec
        : this.av.audioTCalculator.samplestoAbsX(this.av.audioTCalculator.secondsToSamples(1),
          this.audiochunk.selection.duration as BrowserAudioTime);

      maxWidth = maxWidth / secPx;
      let t = this.av.audioTCalculator.secondsToSamples(maxWidth);
      maxWidth = this.av.audioTCalculator.samplestoAbsX(t, this.audiochunk.time.duration as BrowserAudioTime);
      t = this.av.audioTCalculator.absXChunktoSamples(maxWidth, this.audiochunk);
      t = t - this.audiochunk.time.start.browserSample.value;

      let mWidthSeconds = this.av.audioTCalculator.samplesToSeconds(t);
      mWidthSeconds = Math.round(mWidthSeconds * 100) / 100;
      t = this.av.audioTCalculator.secondsToSamples(mWidthSeconds);
      maxWidth = this.av.audioTCalculator.samplestoAbsX(t, this.audiochunk.time.duration as BrowserAudioTime);

      const parts = this.av.AudioPxWidth / maxWidth;
      const startTime: BrowserAudioTime = this.audiochunk.time.start as BrowserAudioTime;

      this.gContext.font = this.settings.timeline.fontWeight + ' ' + this.settings.timeline.fontSize + 'px ' + this.settings.timeline.font;
      this.gContext.fillStyle = this.settings.timeline.foreColor;

      let sumWidth = 0;

      if (Number.isFinite(parts)) {
        this.gContext.strokeStyle = 'black';
        for (let k = 0; k < parts - 1 && sumWidth < this.av.AudioPxWidth; k++) {
          const lineNum = Math.floor(sumWidth / this.innerWidth);
          const lineObj = this.av.LinesArray[lineNum];
          let seconds = startTime.browserSample.seconds + k * mWidthSeconds;
          const time2 = BrowserAudioTime.fromSeconds(seconds, this.audiomanager.browserSampleRate, this.audiomanager.originalSampleRate);
          let relX = this.av.audioTCalculator.samplestoAbsX(
            time2.browserSample.value - startTime.browserSample.value, this.audiochunk.time.duration as BrowserAudioTime
          );
          relX = relX % this.innerWidth;
          seconds = Math.round(seconds * 100) / 100;
          this.gContext.beginPath();
          this.gContext.fillText(seconds.toString(), lineObj.Pos.x + relX + 6, lineObj.Pos.y + lineObj.Size.height -
            ((this.settings.timeline.height - this.settings.timeline.fontSize)));
          this.gContext.moveTo(relX, lineObj.Pos.y + lineObj.Size.height);
          this.gContext.lineTo(relX, lineObj.Pos.y + (lineObj.Size.height - this.settings.timeline.height));
          this.gContext.closePath();
          this.gContext.stroke();

          sumWidth += maxWidth;
        }
      } else {
        console.error('Audioviewer, number of parts of timeline is infinite!');
      }

      this.gContext.strokeStyle = null;
    }
  }

  /**
   * method called when audioplayback ended
   */
  private onAudioChunkStateChange = () => {
  }
  /**
   * change the absolute positon of playcursor
   */
  private changePlayCursorAbsX = (newValue: number) => {
    this.av.PlayCursor.changeAbsX(newValue, this.av.audioTCalculator, this.av.AudioPxWidth, this.audiochunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }
  /**
   * change samples of playcursor
   */
  private changePlayCursorSamples = (newValue: number, chunk?: AudioChunk) => {
    this.av.PlayCursor.changeSamples(newValue, this.av.audioTCalculator, chunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }

  private drawSelection = (line: Line) => {
    if (!isNullOrUndefined(this.av.drawnselection) && this.av.drawnselection.length > 0) {
      console.log(`drawn selection duration is ${this.av.drawnselection.duration.browserSample.value}`);
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
        this.oContext.globalAlpha = 0.2;
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
          this.oContext.fillStyle = this.settings.selection.color;
          this.oContext.fillRect(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y, w, this.settings.lineheight);
        }

        this.oContext.globalAlpha = 1.0;
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
    this._innerWidth = this.viewRect.size.width - this.settings.margin.left - this.settings.margin.right;
    this.oldInnerWidth = this._innerWidth;

    this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);

    this.initialize().then(() => {
      this.updateCanvasSizes();
      this.update(false);

      // this.onSecondsPerLineUpdated(this.settings.pixelPerSec, false);
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
            (obj.audiochunk.previousValue as AudioChunk).destroy();
          }
          if (!this.av.Settings.justifySignalHeight) {
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
    } else if (!isNullOrUndefined(obj.settings) && !obj.settings.firstChange && !isNullOrUndefined(obj.settings.currentValue)) {
      console.log(`settings changed ${this.settings.boundaries.readonly}`);
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

    this.gContext = this.graphicscanvas.getContext('2d');
    this.pContext = this.playcanvas.getContext('2d');
    this.oContext = this.overlaycanvas.getContext('2d');
    this.mContext = this.mousecanvas.getContext('2d');
    this.tContext = this.textcanvas.getContext('2d');

    return this.av.initialize(this._innerWidth, this.audiochunk);
  }

  /**
   * updateCanvasSizes is needed to update the size of the canvas respective to window resizing
   */
  updateCanvasSizes() {
    this.av.viewRect.size.width = Number(this.aview.elementRef.nativeElement.clientWidth);
    this._innerWidth = Number(this.av.viewRect.size.width - this.settings.margin.left - this.settings.margin.right);
    const clientheight = this.aview.elementRef.nativeElement.clientHeight;

    this.av.updateLines(this._innerWidth);

    // set width
    this.graphicscanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.mousecanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.overlaynacRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.playcanRef.changeAttr('width', this.av.viewRect.size.width.toString());
    this.textcanRef.changeAttr('width', this.av.viewRect.size.width.toString());


    if (this.settings.multiLine) {
      this.av.realRect.size.height = this.settings.margin.top +
        (this.settings.lineheight + this.settings.margin.bottom) * this.av.LinesArray.length;
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
      const vLines = Math.floor((endSamples - startSamples) / this.audiomanager.browserSampleRate);
      const pxSecond = Math.round(this.av.audioTCalculator.samplestoAbsX(this.audiomanager.browserSampleRate));
      const timeLineHeight = (this.settings.timeline.enabled) ? this.settings.timeline.height : 0;
      const vZoom = Math.round((this.settings.lineheight - timeLineHeight) / hLines);

      if (pxSecond > 0 && vZoom > 0) {
        // --- get the appropriate context
        this.gContext.beginPath();
        this.gContext.strokeStyle = this.settings.grid.color;
        // set vertical lines
        for (let x = pxSecond; x < line.Size.width; x = x + pxSecond) {
          this.gContext.moveTo(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y);
          this.gContext.lineTo(line.Pos.x + x, line.Pos.y - this.av.viewRect.position.y + this.settings.lineheight - timeLineHeight);
        }

        // set horicontal lines
        for (let y = Math.round(vZoom / 2); y < this.settings.lineheight - timeLineHeight; y = y + vZoom) {
          this.gContext.moveTo(line.Pos.x, y + line.Pos.y - this.av.viewRect.position.y);
          this.gContext.lineTo(line.Pos.x + line.Size.width, y + line.Pos.y - this.av.viewRect.position.y);
        }
        this.gContext.stroke();
      }
    } else {
      console.error(`invalid start end samples`);
    }
  }

  /**
   * clearDisplay() clears all canvas and gives each canvas its initialized status
   */
  clearDisplay(lineNum) {
    // get canvas
    const lineObj = this.av.LinesArray[lineNum];

    if (!(lineObj === null || lineObj === undefined)) {
      if (this.settings.cropping !== 'none') {
        this.crop(this.settings.cropping, this.gContext);
        this.crop(this.settings.cropping, this.oContext);
        this.crop(this.settings.cropping, this.tContext);
      }

      const timeLineHeight = (this.settings.timeline.enabled) ? this.settings.timeline.height : 0;

      this.gContext.globalAlpha = 1.0;
      this.gContext.strokeStyle = this.settings.frame.color;
      this.gContext.fillStyle = this.settings.backgroundcolor;
      this.gContext.clearRect(lineObj.Pos.x, lineObj.Pos.y - this.av.viewRect.position.y, this._innerWidth,
        this.settings.lineheight + this.margin.bottom);
      this.gContext.fillRect(lineObj.Pos.x, lineObj.Pos.y - this.av.viewRect.position.y, lineObj.Size.width,
        this.settings.lineheight - timeLineHeight);
      this.gContext.lineWidth = 0.5;

      // draw margin bottom
      this.gContext.fillStyle = 'white';
      this.gContext.fillRect(lineObj.Pos.x, lineObj.Pos.y - this.av.viewRect.position.y + this.settings.lineheight, lineObj.Size.width,
        this.settings.margin.bottom);

      // draw timeline container
      if (this.settings.timeline.enabled) {
        this.gContext.fillRect(lineObj.Pos.x, lineObj.Pos.y - this.av.viewRect.position.y +
          (this.settings.lineheight - timeLineHeight),
          lineObj.Size.width, timeLineHeight);
      }

      this.gContext.lineWidth = 1;
    }
  }

  /**
   * onMouseMove sets the selection to the current x values of the mouse move
   */
  onMouseMove($event) {
    const x = ($event.offsetX || $event.pageX - jQuery($event.target).offset().left);
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this.av.viewRect.position.y;

    const currLine = this.av.getLineByMousePosition(x, y);

    this.mousecursorchange.emit(this.av.Mousecursor);

    if (currLine) {
      this.focused = true;
      if (this.settings.selection.enabled) {
        this.av.setMouseMovePosition($event.type, x, y, currLine, this._innerWidth);
        this.drawCursor(currLine);
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
      this.tContext.moveTo(0, 0);
      this.tContext.beginPath();
      this.tContext.arc(radius, radius, radius - 2, 0, 2 * Math.PI, false);
      this.tContext.strokeStyle = 'black';
      this.tContext.lineWidth = 3;
      this.tContext.stroke();
    }
  }

  /**
   * drawCursor() changes the opacity of the mouse canvas in the selected line
   */
  drawCursor(line: Line) {
    if (line) {
      // TODO clear only last Cursor Position
      this.mContext.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);

      // --- now draw the cursor line ---
      this.mContext.globalAlpha = 1.0;
      this.mContext.strokeStyle = this.settings.cursor.color;
      this.mContext.beginPath();
      this.mContext.moveTo(this.av.Mousecursor.relPos.x, line.Pos.y - this.av.viewRect.position.y);
      this.mContext.lineTo(this.av.Mousecursor.relPos.x, line.Pos.y - this.av.viewRect.position.y + this.settings.lineheight - 1);
      this.mContext.stroke();
    }
  }

  /**
   * drawSegments() draws a vertical line for every boundary in the current audio viewer
   */
  drawSegments() {
    this.oContext.fillStyle = 'white';
    this.oContext.globalAlpha = 1.0;
    this.tContext.fillStyle = 'white';
    this.tContext.globalAlpha = 1.0;

    let drawnSegments = 0;
    let drawnBoundaries = 0;
    let cleared = 0;
    let drawnSelection = 0;
    let line = null;

    cleared++;

    // draw segments for all visible lines
    if (this.transcr.currentlevel.segments.length > 0) {
      const segments = this.transcr.currentlevel.segments.getSegmentsOfRange(
        this.audiochunk.time.start.browserSample.value, this.audiochunk.time.end.browserSample.value
      );

      this.oContext.globalAlpha = 1.0;

      const boundariesToDraw: {
        x: number,
        y: number
      }[] = [];

      this.oContext.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);
      this.tContext.clearRect(0, 0, this.av.viewRect.size.width, this.av.viewRect.size.height);

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const start = BrowserAudioTime.sub(segments[i].time as BrowserAudioTime, this.audiochunk.time.start as BrowserAudioTime);
        const absX = this.av.audioTCalculator.samplestoAbsX(start.browserSample.value, this.audiochunk.time.duration as BrowserAudioTime);
        let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));

        if (i > 0) {
          begin = segments[i - 1];
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);
        const lineNum1 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(beginX / this._innerWidth) : 0;
        const lineNum2 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(absX / this._innerWidth) : 0;

        const visibleStart = this.av.visibleLines.start;
        const visibleEnd = this.av.visibleLines.end;
        const segmentEnd = segment.time.browserSample.value;
        const audioChunkStart = this.audiochunk.time.start.browserSample.value;
        const audioChunkEnd = this.audiochunk.time.end.browserSample.value;
        const beginTime = begin.time.browserSample.value;

        if (
          (
            (lineNum1 <= visibleStart && lineNum2 <= visibleEnd) ||
            (lineNum1 >= visibleStart && lineNum2 <= visibleEnd) ||
            (lineNum1 >= visibleStart && lineNum2 >= visibleEnd) ||
            (lineNum1 <= visibleStart && lineNum2 >= visibleEnd)
          ) &&
          (
            (segmentEnd >= audioChunkStart && segmentEnd <= audioChunkEnd) ||
            (beginTime >= audioChunkStart && beginTime <= audioChunkEnd) ||
            (beginTime < audioChunkStart && segmentEnd > audioChunkEnd)
          )
        ) {
          let lastI = 0;

          for (let j = Math.max(lineNum1, visibleStart); j <= Math.min(lineNum2, visibleEnd); j++) {
            line = this.av.LinesArray[j];

            if (line) {
              const h = line.Size.height;
              let relX = 0;

              relX = absX % this._innerWidth + this.settings.margin.left;

              const select = this.av.getRelativeSelectionByLine(line, beginTime, segments[i].time.browserSample.value, this._innerWidth);
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
                this.oContext.globalAlpha = 0.2;
                this.oContext.fillStyle = 'red';
              } else if (segment.transcript === this.transcr.breakMarker.code) {
                this.oContext.globalAlpha = 0.2;
                this.oContext.fillStyle = 'blue';
              } else if (segment.transcript !== '') {
                this.oContext.globalAlpha = 0.2;
                this.oContext.fillStyle = 'green';
              }

              drawnSegments++;
              this.oContext.fillRect(x + this.settings.margin.left, line.Pos.y - this.av.viewRect.position.y, w, h);

              if (this.settings.showTranscripts) {
                // draw text
                this.tContext.globalAlpha = 0.75;
                this.tContext.fillStyle = 'white';
                this.tContext.fillRect(x + this.settings.margin.left,
                  line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5 - 11, w, 18);
                this.tContext.globalAlpha = 1;
                this.tContext.fillStyle = 'black';
                this.tContext.font = '11px Arial';
                this.tContext.textAlign = 'center';

                const text = segment.transcript;

                if (lineNum1 === lineNum2) {
                  if (text !== '') {
                    const textLength = this.tContext.measureText(text).width;
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
                    this.tContext.fillText(newText, x + this.settings.margin.left + 2 + w / 2,
                      line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);

                  }
                } else {
                  const totalWidth = this.av.audioTCalculator.samplestoAbsX(segmentEnd - beginTime);

                  if (j === lineNum1) {
                    // current line is start line
                    const ratio = w / totalWidth;

                    // crop text
                    if (text !== '') {
                      let newText = text.substring(0, Math.floor(text.length * ratio) - 2);
                      const textLength = this.oContext.measureText(newText).width;

                      if (textLength > w) {
                        // crop text
                        const leftHalf = w / textLength;
                        newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 2);
                      }
                      lastI = newText.length;
                      newText += '...';

                      this.tContext.fillText(newText, x + this.settings.margin.left + 2 + w / 2,
                        line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                    }
                  } else if (j === lineNum2) {
                    // crop text
                    if (text !== '') {
                      let newText = text.substring(lastI);

                      const textLength = this.oContext.measureText(newText).width;

                      if (textLength > w) {
                        // crop text
                        const leftHalf = w / textLength;
                        newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
                        newText = '...' + newText + '...';
                      } else if (segment.transcript !== this.transcr.breakMarker.code) {
                        newText = '...' + newText;
                      } else {
                        newText = segment.transcript;
                      }

                      this.tContext.fillText(newText, x + this.settings.margin.left + 2 + w / 2,
                        line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                    }
                    lastI = 0;
                  } else if (text !== '') {
                    let w2 = 0;

                    if (lineNum1 > -1) {
                      const lastPart = this.av.getRelativeSelectionByLine(this.av.LinesArray[lineNum1], begin.time.browserSample.value,
                        segments[i].time.browserSample.value, this._innerWidth);

                      if (lastPart.start > -1 && lastPart.end > -1) {
                        w2 = Math.abs(lastPart.end - lastPart.start);
                      }
                      if (lastPart.end < 1) {
                        w2 = 0;
                      }
                      if (lastPart.end < 1 || lastPart.end > this.av.LinesArray[lineNum1].Size.width) {
                        w2 = lastPart.end;
                      }
                    }

                    const ratio = w / totalWidth;
                    const endIndex = lastI + Math.floor(text.length * ratio);

                    // placeholder
                    let newText = text.substring(lastI, endIndex);

                    const textLength = this.oContext.measureText(newText).width;

                    if (textLength > w) {
                      // crop text
                      const leftHalf = w / textLength;
                      newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
                    }
                    lastI += newText.length;

                    if (segment.transcript !== this.transcr.breakMarker.code) {
                      newText = '...' + newText + '...';
                    } else {
                      newText = segment.transcript;
                    }

                    this.tContext.fillText(newText, x + this.settings.margin.left + 2 + w / 2,
                      line.Pos.y - this.av.viewRect.position.y + line.Size.height - 5);
                  }
                }
              }
            }
          }
        } else if (lineNum2 > this.av.visibleLines.end + 2) {
          break;
        }

        // draw boundary
        line = this.av.LinesArray[lineNum2];

        if (lineNum2 >= this.av.visibleLines.start && lineNum2 <= this.av.visibleLines.end &&
          !isNullOrUndefined(line) && segment.time.browserSample.value !== this.audioressource.info.duration.browserSample.value
          && segment.time.browserSample.value <= this.audiomanager.ressource.info.duration.browserSample.value
        ) {
          let relX = 0;
          if (this.settings.multiLine) {
            relX = absX % this._innerWidth + this.settings.margin.left;
          } else {
            relX = absX + this.settings.margin.left;
          }

          boundariesToDraw.push({
            x: relX,
            y: line.Pos.y - this.av.viewRect.position.y
          });
        }
      }

      // draw boundaries
      if (this.settings.boundaries.enabled) {
        for (let i = 0; i < boundariesToDraw.length; i++) {
          const boundary = boundariesToDraw[i];
          const line = this.av.LinesArray[0];
          const h = line.Size.height;

          this.tContext.globalAlpha = 1;
          this.tContext.beginPath();
          this.tContext.strokeStyle = this.settings.boundaries.color;
          this.tContext.lineWidth = this.settings.boundaries.width;
          this.tContext.moveTo(boundary.x, boundary.y);
          this.tContext.lineTo(boundary.x, boundary.y + h);
          this.tContext.stroke();
          drawnBoundaries++;
        }
      }

      // draw time labels
      if (this.settings.showTimePerLine) {
        for (let j = this.av.visibleLines.start; j <= this.av.visibleLines.end; j++) {
          const line = this.av.LinesArray[j];

          if (!isNullOrUndefined(line)) {
            // draw time label
            const startSecond = line.number * this.secondsPerLine;
            const endSecond = Math.min(startSecond + this.secondsPerLine, this.audiochunk.time.duration.browserSample.seconds);

            // start time
            this.tContext.font = '10px Arial';
            this.tContext.fillStyle = 'black';
            const pipe = new Timespan2Pipe();
            this.tContext.fillText(pipe.transform(startSecond * 1000), line.Pos.x + 22, line.Pos.y + 10 - this.av.viewRect.position.y);

            // end time
            const length = this.tContext.measureText(pipe.transform(endSecond * 1000)).width;
            this.tContext.fillText(pipe.transform(endSecond * 1000), line.Pos.x + line.Size.width - length + 15,
              line.Pos.y + 10 - this.av.viewRect.position.y);


            // redraw line border
            this.tContext.strokeStyle = '#b5b5b5';
            this.tContext.lineWidth = 1;
            this.tContext.strokeRect(line.Pos.x, line.Pos.y - this.av.viewRect.position.y, line.Size.width, line.Size.height);
          }
        }
      }
    }

    // draw selection
    if (!(this.av.drawnselection === null || this.av.drawnselection === undefined)) {
      const selStart = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.start.browserSample.value);
      const selEnd = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.end.browserSample.value);
      const lineNum1 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(selStart / this._innerWidth) : 0;
      const lineNum2 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(selEnd / this._innerWidth) : 0;

      // console.log('DRAW Selection ' + this.settings.height);
      for (let j = lineNum1; j <= lineNum2; j++) {
        const line = this.av.LinesArray[j];
        this.drawSelection(line);
        drawnSelection++;
      }
    }

    this.drawTimeLine();

    const log = new Logger('draw segments ' + this.name);
    log.addEntry('log', `cleared: ${cleared}`);
    log.addEntry('log', `drawn_areas: ${drawnSegments}`);
    log.addEntry('log', `drawn_boundaries: ${drawnBoundaries}`);
    log.addEntry('log', `drawn_selection: ${drawnSelection}`);
    // log.output();
  }

  /**
   * onClick sets the selection to the current x values of the click
   */
  onClick($event) {
    const x = ($event.offsetX || $event.pageX - jQuery($event.target).offset().left);
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this.av.viewRect.position.y;

    const currLine = this.av.getLineByMousePosition(x, y);

    if (currLine && this.settings.selection.enabled) {
      if ($event.type === 'mousedown') {
        this.av.drawnselection.start = this.av.Mousecursor.timePos.clone();
        this.audiochunk.selection.start = this.av.Mousecursor.timePos.clone();
      }
      this.av.setMouseClickPosition(x, y, currLine, $event, this._innerWidth, this).then((curr: Line) => {
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
   */
  rePlayback() {
    this.audiochunk.toggleReplay();
  }

  /**
   * step to last position
   */
  stepBackward(afterAudioEnded: () => void) {
    this.audiochunk.stepBackward(this.drawFunc).then(() => {
      afterAudioEnded();
    }).catch((error) => {
      console.error(error);
    });
  }

  stepBackwardTime(afterAudioEnded: () => void, backSec: number) {
    this.audiochunk.stepBackwardTime(backSec, this.drawFunc).then(() => {
      // this.afterAudioStepBackTime();
      afterAudioEnded();
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * adjust the view when window resized
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.av.viewRect.size.width = this.aview.elementRef.nativeElement.clientWidth;
    this._innerWidth = this.av.viewRect.size.width - this.settings.margin.left - this.settings.margin.right;

    // only resize if size has changed and resizing not in processing state
    if (this._innerWidth !== this.oldInnerWidth) {
      setTimeout(() => {
        if ((!this.settings.multiLine || this.av.AudioPxWidth < this._innerWidth) && !this.resizing) {
          this.resizing = true;
          this.av.AudioPxWidth = this._innerWidth;
          this.av.audioTCalculator.audioPxWidth = this._innerWidth;
          const ratio = this._innerWidth / this.oldInnerWidth;

          this.changePlayCursorAbsX((this.av.PlayCursor.absX * ratio));
          this.update(true).then(() => {
            this.resizing = false;
          }).catch((error) => {
            console.error(error);
          });
        } else if (this.settings.multiLine && !this.resizing) {
          this.resizing = true;
          this.onSecondsPerLineUpdated(this.secondsPerLine).then(() => {
            this.resizing = false;
          }).catch((error) => {
            console.error(error);
          });
        }

        if (this.av.PlayCursor.absX > 0) {
          const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this._innerWidth);

          if (line) {
            this.drawPlayCursorOnly(line);
          }
        }
      }, 100);
    }
  }

  public getLocation(): any {
    const rect = this.aview.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  public selectSegment(segIndex: number, successcallback: (posY1: number, posY2: number) => void = () => {
                       },
                       errorcallback: () => void = () => {
                       }): boolean {
    if (segIndex > -1) {
      const segment = this.transcr.currentlevel.segments.get(segIndex);
      const startTime = this.transcr.currentlevel.segments.getStartTime(segIndex);
      // make shure, that segments boundaries are visible
      if (startTime.browserSample.value >= this.audiochunk.time.start.browserSample.value
        && segment.time.browserSample.value <= (this.audiochunk.time.end.browserSample.value + 1)) {
        const absX = this.av.audioTCalculator.samplestoAbsX(this.transcr.currentlevel.segments.get(segIndex).time.browserSample.value);
        let begin = new Segment(this.audiomanager.createBrowserAudioTime(0));
        if (segIndex > 0) {
          begin = this.transcr.currentlevel.segments.get(segIndex - 1);
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.browserSample.value);
        const posY1 = (this._innerWidth < this.AudioPxWidth)
          ? Math.floor((beginX / this._innerWidth) + 1) * (this.settings.lineheight + this.settings.margin.bottom)
          - this.settings.margin.bottom
          : 0;

        let posY2 = 0;

        if (this._innerWidth < this.AudioPxWidth) {
          posY2 = Math.floor((absX / this._innerWidth) + 1) * (this.settings.lineheight +
            this.settings.margin.bottom) - this.settings.margin.bottom;
        }

        const boundarySelect = this.av.getSegmentSelection(segment.time.browserSample.value - 1);
        if (boundarySelect) {
          this.audiochunk.selection = boundarySelect;
          this.av.drawnselection = boundarySelect.clone();
          this.drawSegments();
          this.settings.selection.color = 'gray';
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

  public scrollTo(yCoord: number, scrollbar: boolean = false) {
    if ((this.av.realRect.size.height > this.av.viewRect.size.height)) {
      this.scrolling.emit({state: 'scrolling'});
      this.av.viewRect.position.y = Math.max(0, yCoord);
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
   */
  private crop(type: string, context: CanvasRenderingContext2D) {
    if (type === 'none' || type === 'circle') {
      const radius = Math.round(this._innerWidth / 2);

      if (radius > 0 && !(context === null || context === undefined)) {
        const halfHeight = Math.round(this.viewRect.size.height / 2);
        // crop Line
        context.globalAlpha = 1.0;
        context.save();
        context.beginPath();
        context.arc(radius, halfHeight, radius, 0, 2 * Math.PI, false);
        context.closePath();
        context.clip();

        this.mContext.globalAlpha = 1.0;
        this.mContext.save();
        this.mContext.beginPath();
        this.mContext.arc(radius, halfHeight, radius, 0, 2 * Math.PI, false);
        this.mContext.closePath();
        this.mContext.clip();
      }
    }
  }

  /**
   * checks if the comboKey is part of the list of disabled keys
   */
  private isDisabledKey(comboKey: string): boolean {
    for (let i = 0; i < this.settings.disabledKeys.length; i++) {
      if (this.settings.disabledKeys[i] === comboKey) {
        return true;
      }
    }

    return false;
  }

  private updateVisibleLines() {
    this.av.visibleLines.start = Math.floor(this.av.viewRect.position.y / (this.settings.lineheight + this.settings.margin.bottom));
    this.av.visibleLines.end = Math.floor(
      (this.av.viewRect.position.y + this.av.viewRect.size.height) / (this.settings.lineheight + this.settings.margin.bottom)
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
    // this.av.PlayCursor.changeSamples(this.audiochunk.lastplayedpos.browserSample.value, this.av.audioTCalculator, this.audiochunk);
    // this.startPlayback();
  }

  /**
   * called if audio ended normally because end of segment reached
   */
  private afterAudioEnded = () => {
    if (!this.audiochunk.replay) {
      // let cursor jump to start
      this.audiochunk.playposition = this.audiochunk.selection.start.clone() as BrowserAudioTime;
      this.av.drawnselection = (this.av.drawnselection !== null) ? this.av.drawnselection.clone() : null;
      this.drawSegments();
    }

    this.drawPlayCursor();
  }

  public onSecondsPerLineUpdated(seconds: number, initialize = true): Promise<void> {
    return new Promise<void>((resolve2, reject2) => {
      this.settings.pixelPerSec = this.getPixelPerSecond(seconds);
      this.secondsPerLine = seconds;
      // this.clearAll();

      new Promise<void>((resolve, reject) => {
        if (initialize) {
          this.initialize().then(() => {
            resolve();
          }).catch((err) => {
            this.update(true);
            reject(err);
          });
        } else {
          resolve();
        }
      }).then(() => {
        this.updateCanvasSizes();
        this.update(true).then(() => {
          this.scrollTo(0, true);
          resolve2();
        }).catch((error) => {
          reject2(error);
        });
      }).catch((error) => {
        console.error(error);
        reject2(error);
      });
    });
  }

  public getPixelPerSecond(secondsPerLine: number) {
    return (this._innerWidth / secondsPerLine);
  }

  private clearAll() {
    this.gContext.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.mContext.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.pContext.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
    this.tContext.clearRect(0, 0, this.viewRect.size.width, this.viewRect.size.height);
  }
}
