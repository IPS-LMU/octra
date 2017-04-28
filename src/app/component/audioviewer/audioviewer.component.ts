import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import {
  AudioTime,
  AudioTimeCalculator,
  AVMousePos,
  AVSelection,
  BrowserInfo,
  CanvasAnimation,
  Chunk,
  Line,
  Logger,
  PlayCursor,
  Segment,
  SubscriptionManager
} from '../../shared';
import {AudioService, KeymappingService, TranscriptionService} from '../../service';
import {AudioviewerService} from './service/audioviewer.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-audioviewer',
  templateUrl: './audioviewer.component.html',
  styleUrls: ['./audioviewer.component.css'],
  providers: [AudioviewerService]
})

export class AudioviewerComponent implements OnInit, OnDestroy, AfterViewInit {

  /**
   *    TODO
   *    Possible Improvements:
   *    - using 2 canvas for animations to implement double buffering by switching canvas visibility on and off
   */

  subscrmanager: SubscriptionManager;

  @ViewChild('audioview') aview;
  @ViewChild('graphicscan') graphicscanRef: ElementRef;
  @ViewChild('overlaycan') overlaynacRef: ElementRef;
  @ViewChild('playcan') playcanRef: ElementRef;
  @ViewChild('mousecan') mousecanRef: ElementRef;

  // EVENTS
  @Output('selchange') selchange = new EventEmitter<AVSelection>();
  @Output('segmententer') segmententer = new EventEmitter<any>();
  @Output('segmentchange') segmentchange = new EventEmitter<number>();
  @Output('mousecursorchange') mousecursorchange = new EventEmitter<AVMousePos>();
  @Output('playcursorchange') playcursorchange = new EventEmitter<PlayCursor>();
  @Output('shortcuttriggered') shortcuttriggered = new EventEmitter<any>();
  @Output() alerttriggered = new EventEmitter<{ type: string, message: string }>();

  @Output('pos_time') get pos_time(): number {
    return this.av.PlayCursor.time_pos.samples;
  }

  private _begintime: AudioTime = null;

  private graphicscanvas: HTMLCanvasElement = null;
  private overlaycanvas: HTMLCanvasElement = null;
  private playcanvas: HTMLCanvasElement = null;
  private mousecanvas: HTMLCanvasElement = null;

  private g_context: CanvasRenderingContext2D = null;
  private p_context: CanvasRenderingContext2D = null;
  private o_context: CanvasRenderingContext2D = null;
  private m_context: CanvasRenderingContext2D = null;

  // for animation of playcursor
  private anim: CanvasAnimation;

  private drawing = false;

  public audioplaying = false;
  private last_frame: boolean;

  private step_backward = false;

  // size settings
  private width = 0;
  private height = 0;
  private innerWidth = 0;
  private oldInnerWidth = 0;
  private resizing = false;

  private _deactivate_shortcuts = false;

  public get Chunk(): Chunk {
    return this.av.Chunk;
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

  get deactivate_shortcuts(): boolean {
    return this._deactivate_shortcuts;
  }

  set deactivate_shortcuts(value: boolean) {
    this._deactivate_shortcuts = value;
  }

  public get Settings(): any {
    return this.av.Settings;
  }

  public set Settings(new_settings: any) {
    this.av.Settings = new_settings;
  }

  get AudioPxWidth(): number {
    return this.av.AudioPxWidth;
  }

  public get Selection(): AVSelection {
    return this.av.Selection;
  }

  public get PlayCursor(): PlayCursor {
    return this.av.PlayCursor;
  }

  constructor(private audio: AudioService,
              public av: AudioviewerService,
              private transcr: TranscriptionService,
              private keyMap: KeymappingService,
              private langService: TranslateService) {

    this.av.initializeSettings();

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  ngOnInit() {
    this.anim = new CanvasAnimation(25);

    this.width = this.aview.elementRef.nativeElement.clientWidth;
    this.innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;
    this.oldInnerWidth = this.innerWidth;

    // initialize canvas
    this.graphicscanvas = this.graphicscanRef.nativeElement;
    this.playcanvas = this.playcanRef.nativeElement;
    this.overlaycanvas = this.overlaynacRef.nativeElement;
    this.mousecanvas = this.mousecanRef.nativeElement;

    this.g_context = this.graphicscanvas.getContext('2d');
    this.p_context = this.playcanvas.getContext('2d');
    this.o_context = this.overlaycanvas.getContext('2d');
    this.m_context = this.mousecanvas.getContext('2d');

    this.subscrmanager.add(this.audio.statechange.subscribe(
      (state) => {
        if (state === 'ended') {
          if (this.av.Selection == null || (this.av.Selection.end.samples - this.av.Selection.start.samples) === 0) {
            this.changePlayCursorSamples(this.av.Chunk.time.start.samples);
          } else {
            this.changePlayCursorSamples(this.av.Selection.start.samples, this.av.Chunk);
          }
        }
      }));
  }

  ngAfterViewInit() {
    this.initialize();
    this.update(true);
  }

  ngOnDestroy() {
    this.stopPlayback();
    this.av.destroy();
    this.subscrmanager.destroy();
  }

  public initialize() {
    this._begintime = new AudioTime(0, this.audio.samplerate);
    this.av.initialize(this.innerWidth);
  }

  /**
   * update and redraw audioviewer
   * @param computeDisplayData should display data be recomputed?
   */
  public update = (computeDisplayData: boolean = false) => {
    this.updateCanvasSizes();

    if (this.av.channel) {

      if (computeDisplayData === true) {
        this.av.refresh();
      }

      for (let i = 0; i < this.av.LinesArray.length; i++) {
        this.drawSignal(i);

        if (this.Settings.cropping !== 'none') {
          this.av.Mousecursor.relPos.x = this.innerWidth / 2;
          this.drawCursor(this.av.LinesArray[i]);
          this.drawCropBorder();
        }
      }
      this.drawSegments();
      if (this.Settings.timeline.enabled) {
        this.drawTimeLine();
      }
    }
    this.oldInnerWidth = this.innerWidth;
  }

  /**
   * crop audioviewer
   * @param type "none" or "circle"
   * @param context
   */
  private crop(type: string, context: CanvasRenderingContext2D) {
    if (type === 'none' || type === 'circle') {
      const radius = this.innerWidth / 2;

      if (radius > 0) {
        // crop Line
        context.globalAlpha = 1.0;
        context.save();
        context.beginPath();
        context.arc(this.innerWidth / 2, this.height / 2, this.innerWidth / 2, 0, 2 * Math.PI, false);
        context.closePath();
        context.clip();

        this.m_context.globalAlpha = 1.0;
        this.m_context.save();
        this.m_context.beginPath();
        this.m_context.arc(this.innerWidth / 2, this.height / 2, this.innerWidth / 2, 0, 2 * Math.PI, false);
        this.m_context.closePath();
        this.m_context.clip();
      }
    }
  }

  /**
   * updateCanvasSizes is needed to update the size of the canvas respective to window resizing
   */
  updateCanvasSizes() {
    this.width = Number(this.aview.elementRef.nativeElement.clientWidth);
    this.innerWidth = Number(this.width - this.Settings.margin.left - this.Settings.margin.right);

    this.av.updateLines(this.innerWidth);

    this.height = this.Settings.margin.top + (this.Settings.height + this.Settings.margin.bottom) * this.av.LinesArray.length;
    // set width
    this.graphicscanvas.width = this.width;
    this.mousecanvas.width = this.width;
    this.overlaycanvas.width = this.width;
    this.playcanvas.width = this.width;

    // set height
    this.graphicscanvas.height = this.height;
    this.mousecanvas.height = this.height;
    this.overlaycanvas.height = this.height;
    this.playcanvas.height = this.height;
    this.aview.changeStyle('height', this.height.toString() + 'px');
  }

  /**
   * drawSignal(array) draws the min-max pairs of values in the canvas
   *
   * in a different color. This is probable due to there being only a final
   * stroke()-command after the loop.
   *
   */
  drawSignal = function (line_num) {
    // get canvas
    const line_obj = this.av.LinesArray[line_num];
    const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;

    if (line_obj) {
      // line_obj found
      const midline = Math.floor((this.Settings.height - timeline_height) / 2);
      const x_pos = line_num * this.innerWidth;
      const x_max = line_obj.Size.width;

      const zoomX = this.av.zoomX;
      const zoomY = this.av.zoomY;

      this.clearDisplay(line_num);

      this.drawGrid(3, 3, line_obj);

      this.g_context.strokeStyle = this.Settings.data.color;
      this.g_context.beginPath();
      this.g_context.moveTo(line_obj.Pos.x, line_obj.Pos.y + midline - this.av.minmaxarray[x_pos]);

      for (let x = 0; x < x_max - 1; x++) {
        this.g_context.lineTo(line_obj.Pos.x + (x * zoomX), line_obj.Pos.y + midline - (this.av.minmaxarray[x + x_pos] * zoomY));
      }
      this.g_context.stroke();

    } else {
      throw new Error('Line Object not found');
    }
  };

  /**
   * change audiosequence shown in this audioviewer
   * @param start
   * @param end
   */
  public changeBuffer(start: AudioTime, end: AudioTime) {
    if (!this.drawing) {
      // fix for too many drawing request
      setTimeout(() => {
        this.drawing = true;
        this.av.changeBuffer(start, end, this.innerWidth);
        this.update(true);
        this.drawing = false;
      }, 25);
    }
  }

  /**
   * drawGrid(h, v) draws a grid with h horizontal and v vertical lines over the canvas
   */
  drawGrid(hLines: number, vLines: number, line: Line) {
    const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;
    const hZoom = Math.round(this.innerWidth / vLines);
    const vZoom = Math.round((this.Settings.height - timeline_height) / hLines);

    // --- get the appropriate context
    this.g_context.beginPath();
    this.g_context.strokeStyle = this.Settings.grid.color;
    // set |
    for (let x = Math.round(hZoom / 2); x < line.Size.width; x = x + hZoom) {
      this.g_context.moveTo(line.Pos.x + x, line.Pos.y);
      this.g_context.lineTo(line.Pos.x + x, line.Pos.y + this.Settings.height - timeline_height);
    }

    // set vertical lines
    for (let y = Math.round(vZoom / 2); y < this.Settings.height - timeline_height; y = y + vZoom) {
      this.g_context.moveTo(line.Pos.x, y + line.Pos.y);
      this.g_context.lineTo(line.Pos.x + line.Size.width, y + line.Pos.y);
    }
    this.g_context.stroke();
  }

  /**
   * clearDisplay() clears all canvas and gives each canvas its initialized status
   */
  clearDisplay(line_num) {
    // get canvas
    const play_c = this.playcanvas;
    const overlay_c = this.overlaycanvas;
    const mouse_c = this.mousecanvas;
    const line_obj = this.av.LinesArray[line_num];

    if (line_obj) {
      if (this.Settings.cropping !== 'none') {
        this.crop(this.Settings.cropping, this.g_context);
        this.crop(this.Settings.cropping, this.o_context);
      }

      const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;

      this.p_context.clearRect(line_obj.Pos.x, line_obj.Pos.y - 1, this.innerWidth, line_obj.Size.height + 1 - timeline_height);

      this.m_context.globalAlpha = 1.0;
      this.m_context.clearRect(line_obj.Pos.x - 1, line_obj.Pos.y - 1, this.innerWidth, line_obj.Size.height + 1 - timeline_height);
      this.m_context.strokeStyle = this.Settings.selection.color;

      this.o_context.globalAlpha = 1.0;
      this.o_context.clearRect(line_obj.Pos.x, line_obj.Pos.y - 1, this.innerWidth, line_obj.Size.height + 1 - timeline_height);
      this.o_context.strokeStyle = this.Settings.cursor.color;

      this.p_context.globalAlpha = 1.0;
      this.p_context.clearRect(line_obj.Pos.x, line_obj.Pos.y - 1, this.innerWidth, line_obj.Size.height + 1 - timeline_height);
      this.p_context.strokeStyle = this.Settings.playcursor.color;

      this.g_context.globalAlpha = 1.0;
      this.g_context.strokeStyle = this.Settings.frame.color;
      this.g_context.fillStyle = this.Settings.backgroundcolor;

      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y, line_obj.Size.width, this.Settings.height - 2 - timeline_height);
      this.g_context.lineWidth = 0.5;
      this.g_context.fillStyle = 'white';
      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y + (this.Settings.height - 2 - timeline_height),
        line_obj.Size.width, timeline_height);
      this.g_context.strokeRect(line_obj.Pos.x, line_obj.Pos.y, line_obj.Size.width, this.Settings.height);
      this.g_context.lineWidth = 1;
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

    const curr_line = this.av.getLineByMousePosition(x, y);

    this.mousecursorchange.emit(this.av.Mousecursor);

    if (curr_line) {
      this.focused = true;
      if (this.Settings.selection.enabled) {
        this.av.setMouseMovePosition($event.type, x, y, curr_line, this.innerWidth);
        this.drawSegments();
        this.drawCursor(curr_line);
      }
    } else {
      this.focused = false;
    }
  }

  /**
   * draws an black Border alongside the cropped audioviewer
   */
  drawCropBorder() {
    const radius = this.innerWidth / 2;
    if (radius > 0) {
      this.g_context.moveTo(0, 0);
      this.g_context.beginPath();
      this.g_context.arc(radius, radius, radius - 2, 0, 2 * Math.PI, false);
      this.g_context.strokeStyle = 'black';
      this.g_context.lineWidth = 3;
      this.g_context.stroke();

      this.g_context.shadowColor = null;
      this.g_context.shadowBlur = null;
      this.g_context.shadowOffsetX = null;
      this.g_context.shadowOffsetY = null;
    }
  }

  /**
   * drawCursor() changes the opacity of the mouse canvas in the selected line
   */
  drawCursor(line: Line) {
    if (line) {
      this.m_context.clearRect(0, 0, this.width, this.height);

      // --- now draw the cursor line ---
      this.m_context.globalAlpha = 1.0;
      this.m_context.strokeStyle = this.Settings.cursor.color;
      this.m_context.beginPath();
      this.m_context.moveTo(this.av.Mousecursor.relPos.x, line.Pos.y);
      this.m_context.lineTo(this.av.Mousecursor.relPos.x, line.Pos.y + this.Settings.height - 1);
      this.m_context.stroke();
    }
  };

  /**
   * drawSegments() draws a vertical line for every boundary in the current audio viewer
   */
  drawSegments() {
    this.o_context.fillStyle = 'white';
    this.o_context.clearRect(0, 0, this.width, this.height - 2);

    // draw segments
    if (this.Settings.boundaries.enabled && this.transcr.segments) {
      const segments = this.transcr.segments.getSegmentsOfRange(this.av.Chunk.time.start.samples, this.av.Chunk.time.end.samples);
      this.o_context.globalAlpha = 1.0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const start = AudioTime.sub(segments[i].time, this.av.Chunk.time.start);
        const absX = this.av.audioTCalculator.samplestoAbsX(start.samples);
        let begin = new Segment(new AudioTime(0, this.audio.samplerate));

        if (i > 0) {
          begin = segments[i - 1];
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);
        const line_num1 = (this.innerWidth < this.AudioPxWidth) ? Math.floor(beginX / this.innerWidth) : 0;
        const line_num2 = (this.innerWidth < this.AudioPxWidth) ? Math.floor(absX / this.innerWidth) : 0;

        for (let j = 0; j <= line_num2; j++) {
          const line = this.av.LinesArray[line_num1 + j];

          if (line) {
            const h = line.Size.height;
            let relX = 0;

            relX = absX % this.innerWidth + this.Settings.margin.left;

            const select = this.av.getRelativeSelectionByLine(line, begin.time.samples, segments[i].time.samples, this.innerWidth);
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

            this.o_context.fillRect(x + this.Settings.margin.left, line.Pos.y, w, h);
          }
        }

        // draw boundaries
        const line = this.av.LinesArray[line_num2];
        if (line && segment.time.samples !== this.audio.duration.samples) {
          const h = line.Size.height;
          let relX = 0;
          if (this.Settings.multi_line) {
            relX = absX % this.innerWidth + this.Settings.margin.left;
          } else {
            relX = absX + this.Settings.margin.left;
          }

          this.o_context.globalAlpha = 0.5;
          this.o_context.beginPath();
          this.o_context.strokeStyle = this.Settings.boundaries.color;
          this.o_context.lineWidth = this.Settings.boundaries.width;
          this.o_context.moveTo(relX, line.Pos.y);
          this.o_context.lineTo(relX, line.Pos.y + h);
          this.o_context.stroke();

        }
      }
    }

    // draw gray selection
    for (let j = 0; j < this.av.LinesArray.length; j++) {
      const line = this.av.LinesArray[j];

      const select = this.av.getRelativeSelectionByLine(line, this.Selection.start.samples, this.Selection.end.samples, this.innerWidth);
      if (select && line) {
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
          this.o_context.fillRect(line.Pos.x + x, line.Pos.y, w, this.Settings.height);
        }
      }
    }
  }

  /**
   * onClick sets the selection to the current x values of the click
   */
  onClick($event) {
    const x = $event.offsetX;
    const y = $event.offsetY;

    const curr_line = this.av.getLineByMousePosition(x, y);

    if (curr_line && this.Settings.selection.enabled) {
      this.av.setMouseClickPosition(x, y, curr_line, $event, this.innerWidth, () => {
        this.drawPlayCursorOnly(curr_line);
      });
      this.drawSegments();
      this.drawCursor(this.av.LastLine);
      this.selchange.emit(this.av.Selection);
    }
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
            const focuscheck = this.Settings.shortcuts['' + shortc + ''].focusonly === false
              || (this.Settings.shortcuts['' + shortc + ''].focusonly === this.focused === true);

            if (focuscheck && this.Settings.shortcuts['' + shortc + '']['keys']['' + platform + ''] === comboKey) {
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
                case('set_boundary'):
                  if (this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly && this.av.focused) {
                    const result = this.av.addSegment();
                    if (!result != null && result.msg != null) {
                      if (result.msg.text && result.msg.text !== '') {
                        this.alerttriggered.emit({
                          type: result.msg.type,
                          message: result.msg.text
                        });
                      } else if (result.type != null) {
                        this.shortcuttriggered.emit({
                          shortcut: comboKey,
                          value: result.type + '_boundary'
                        });
                        this.segmentchange.emit(result.seg_num);
                        this.drawSegments();
                      }
                    }
                    key_active = true;
                  }
                  break;
                case('play_selection'):
                  if (this.av.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});

                    const xSamples = this.av.audioTCalculator.absXChunktoSamples(this.av.Mousecursor.absX, this.av.Chunk);

                    const boundary_select = this.av.getSegmentSelection(this.av.Mousecursor.timePos.samples);
                    if (boundary_select) {
                      const segment_i = this.transcr.segments.getSegmentBySamplePosition(xSamples);
                      if (segment_i > -1) {
                        const segment = this.transcr.segments.get(segment_i);
                        const start_time = this.transcr.segments.getStartTime(segment_i);
                        // make shure, that segments boundaries are visible
                        if (start_time.samples >= this.av.Chunk.time.start.samples &&
                          segment.time.samples <= this.av.Chunk.time.end.samples) {
                          const absX = this.av.audioTCalculator.samplestoAbsX(this.transcr.segments.get(segment_i).time.samples);
                          this.av.Selection = boundary_select;
                          this.selchange.emit(this.av.Selection);
                          this.drawSegments();

                          let begin = new Segment(new AudioTime(0, this.audio.samplerate));
                          if (segment_i > 0) {
                            begin = this.transcr.segments.get(segment_i - 1);
                          }
                          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);

                          const posY1 = (this.innerWidth < this.AudioPxWidth)
                            ? Math.floor((beginX / this.innerWidth) + 1) *
                            (this.Settings.height + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          const posY2 = (this.innerWidth < this.AudioPxWidth)
                            ? Math.floor((absX / this.innerWidth) + 1) *
                            (this.Settings.height + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          if (xSamples >= this.av.Selection.start.samples && xSamples <= this.av.Selection.end.samples) {
                            this.av.current.samples = this.av.Selection.start.samples;
                            this.changePlayCursorSamples(this.av.Selection.start.samples);
                            this.drawPlayCursorOnly(this.av.LastLine);
                            this.audio.stopPlayback(this.playSelection);
                          }

                          if (!this.Settings.multi_line) {
                            this.segmententer.emit({
                              index: segment_i,
                              pos: {Y1: posY1, Y2: posY2}
                            });
                          }
                        } else {
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
                case('segment_enter'):
                  if (this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly && this.focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});
                    const seg_index = this.transcr.segments.getSegmentBySamplePosition(this.av.Mousecursor.timePos.samples);
                    this.selectSegment(seg_index,
                      (posY1, posY2) => {
                        this.focused = false;
                        this.segmententer.emit({index: seg_index, pos: {Y1: posY1, Y2: posY2}});
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
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});

                    this.av.moveCursor('left', this.Settings.step_width_ratio * this.audio.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
                    key_active = true;
                  }
                  break;
                case('cursor_right'):
                  if (this.av.focused) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc});

                    this.av.moveCursor('right', this.Settings.step_width_ratio * this.audio.samplerate);
                    this.drawCursor(this.av.LastLine);
                    this.mousecursorchange.emit(this.av.Mousecursor);
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
  playSelection = () => {
    this.audio.audioplaying = false;
    this.av.Selection.checkSelection();
    this._begintime = this.av.calculateBeginTime();
    this.av.updatePlayDuration();
    this.av.updateDistance();

    const drawFunc = () => {
      this.anim.requestFrame(this.drawPlayCursor);
    };

    if ((this.av.Selection.start.samples === this.av.Selection.end.samples)
      || (this.av.Selection.start.samples >= 0 && this.av.Selection.length >= 0)) {
      // start Audio at the beginning
      this.av.lastplayedpos = this._begintime.clone();
      this.audio.startPlayback(this._begintime, this.av.playduration, drawFunc, this.onEndPlayBack);
    }
  }

  /**
   * stops audio playback
   */
  stopPlayback() {
    if (!this.audio.stopPlayback()) {
      // state was not audioplaying
      this.av.current.samples = 0;
      this.changePlayCursorAbsX(0);
      this.drawPlayCursorOnly(this.av.LastLine);
    }
  }

  /**
   * pause audio playback
   */
  pausePlayback() {
    this.audio.pausePlayback();
  }

  /**
   * start audio playback
   */
  startPlayback() {
    if (!this.audio.audioplaying && this.av.MouseClickPos.absX < this.av.AudioPxWidth - 5) {
      this.playSelection();
    }
  }

  /**
   * set audio for replay and returns if replay is active
   * @returns {boolean}
   */
  rePlayback(): boolean {
    return this.audio.rePlayback();
  }

  /**
   * step to last position
   */
  stepBackward() {
    this.audio.stepBackward(() => {
      // audio not playing
      if (this.av.lastplayedpos != null) {
        this.av.current = this.av.lastplayedpos.clone();

        this.av.PlayCursor.changeSamples(this.av.lastplayedpos.samples, this.av.audioTCalculator, this.av.Chunk);
        this.drawPlayCursorOnly(this.av.LastLine);
        this._begintime = this.av.current.clone();
        this.startPlayback();
      }
    });
  }

  /**
   * draw PlayCursor. Call this method only while animation.
   */
  drawPlayCursor = () => {
    const date = new Date();
    // get actual time and calculate progress in percentage
    const timestamp = new Date().getTime();
    const calculator = new AudioTimeCalculator(this.audio.samplerate, this.audio.duration, this.AudioPxWidth);

    const duration = (this.av.Selection.length > 0) ? new AudioTime(this.av.Selection.length, this.audio.samplerate) : this.av.playduration;
    const currentAbsX = this.av.audioTCalculator.samplestoAbsX((this.av.current.samples - this.av.Chunk.time.start.samples));
    let progress = 0;
    let absX = 0;

    if (this.audio.endplaying > timestamp && this.audio.audioplaying) {
      progress = Math.min((((duration.unix) - (this.audio.endplaying - timestamp)) / (duration.unix)) * this.audio.speed, 1);
      absX = Math.max(0, currentAbsX + (this.av.Distance * progress));
      this.changePlayCursorAbsX(absX);
    } else if (progress > 0.99) {
      this.changePlayCursorAbsX(currentAbsX + this.av.Distance);
    }

    // get line of PlayCursor
    const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this.innerWidth);

    if (line) {
      this.drawPlayCursorOnly(line);
      this.av.LastLine = line;
    }
  }

  /**
   * draw playcursor at its current position. You can call this method to update the playcursor view.
   * @param curr_line
   */
  drawPlayCursorOnly = (curr_line: Line) => {
    if (curr_line) {
      const player_width = this.Settings.playcursor.width;

      const relX = this.av.PlayCursor.absX - (curr_line.number * this.innerWidth);
      const relY = curr_line.Pos.y;

      if (relX <= curr_line.Size.width + this.Settings.margin.left) {
        this.p_context.clearRect(0, 0, this.width, this.height);
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
   * change the absolute positon of playcursor
   * @param new_value
   */
  private changePlayCursorAbsX = (new_value: number) => {
    this.av.PlayCursor.changeAbsX(new_value, this.av.audioTCalculator, this.av.AudioPxWidth, this.av.Chunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }

  /**
   * change samples of playcursor
   * @param new_value
   */
  private changePlayCursorSamples = (new_value: number, chunk?: Chunk) => {
    this.av.PlayCursor.changeSamples(new_value, this.av.audioTCalculator, chunk);
    this.playcursorchange.emit(this.av.PlayCursor);
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
   * draws the timeline if timeline ist enabled
   */
  drawTimeLine = function () {
    if (this.Settings.timeline.enabled && this.av.LinesArray.length > 0
      && this.av.DurTime.samples > 0 && this.av.AudioPxWidth > 0
    ) {
      let max_width = this.g_context.measureText(this.getmaxString(Math.round(this.av.DurTime.seconds * 100) / 100, 2)).width + 12;
      const sec_px = (this.Settings.multi_line)
        ? this.Settings.pixel_per_sec
        : this.av.audioTCalculator.samplestoAbsX(this.av.audioTCalculator.secondsToSamples(1), this.av.DurTime);

      max_width = max_width / sec_px;
      let t = this.av.audioTCalculator.secondsToSamples(max_width);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, this.av.DurTime);
      t = this.av.audioTCalculator.absXChunktoSamples(max_width, this.av.Chunk);
      t = t - this.av.Chunk.time.start.samples;

      let mwidth_seconds = this.av.audioTCalculator.samplesToSeconds(t);
      mwidth_seconds = Math.round(mwidth_seconds * 100) / 100;
      t = this.av.audioTCalculator.secondsToSamples(mwidth_seconds);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, this.av.DurTime);

      const parts = this.av.AudioPxWidth / max_width;
      const start_time: AudioTime = this.av.Chunk.time.start;

      this.g_context.font = this.Settings.timeline.fontWeight + ' ' + this.Settings.timeline.fontSize + 'px ' + this.Settings.timeline.font;
      this.g_context.fillStyle = this.Settings.timeline.foreColor;

      let sum_width = 0;

      if (Number.isFinite(parts)) {
        this.g_context.strokeStyle = 'black';
        for (let k = 0; k < parts - 1 && sum_width < this.av.AudioPxWidth; k++) {
          const line_num = Math.floor(sum_width / this.innerWidth);
          const line_obj = this.av.LinesArray[line_num];
          let seconds = start_time.seconds + k * mwidth_seconds;
          const time2 = AudioTime.fromSeconds(seconds, this.audio.samplerate);
          let relX = this.av.audioTCalculator.samplestoAbsX(time2.samples - start_time.samples, this.av.DurTime);
          relX = relX % this.innerWidth;
          seconds = Math.round(seconds * 100) / 100;
          this.g_context.beginPath();
          this.g_context.fillText(seconds, line_obj.Pos.x + relX + 6, line_obj.Pos.y + line_obj.Size.height -
            ((this.Settings.timeline.height - this.Settings.timeline.fontSize)));
          this.g_context.moveTo(relX, line_obj.Pos.y + line_obj.Size.height);
          this.g_context.lineTo(relX, line_obj.Pos.y + (line_obj.Size.height - this.Settings.timeline.height));
          this.g_context.closePath();
          this.g_context.stroke();

          sum_width += max_width;
        }
      } else {
        Logger.err('Audioviewer, number of parts of timeline is infinite!');
      }

      this.g_context.strokeStyle = null;
    }
  };

  /**
   * method called when audioplayback ended
   */
  private onEndPlayBack = () => {
    this.audio.audioplaying = false;
    this.audio.javascriptNode.disconnect();

    if (this.audio.paused) {
      this.av.current.samples = this.av.PlayCursor.time_pos.samples;
    } else {
      if (!this.audio.stepbackward) {
        if (this.av.Selection.start.samples >= 0 && this.av.Selection.end.samples > this.av.Selection.start.samples) {
          // return to start position
          this.changePlayCursorSamples(this.av.Selection.start.samples);
          this.av.current = this.av.Selection.start.clone();
        } else {
          this.changePlayCursorSamples(this.av.Chunk.time.start.samples);
          this.av.current.samples = this.av.Chunk.time.start.samples;
        }
        this.drawPlayCursorOnly(this.av.LastLine);
      }
    }
    this.audio.stepbackward = false;

    if (this.audio.replay === true && !this.audio.paused) {
      this.playSelection();
    } else {
      this.audio.replay = false;
    }

    this.audio.paused = false;
  }

  public onFocusLost($event) {
    alert('leave');
  }

  /**
   * adjust the view when window resized
   * @param $event
   */
  @HostListener('window:resize', ['$event'])
  onResize($event) {
    this.width = this.aview.elementRef.nativeElement.clientWidth;
    this.innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;

    // onlie resize if size has changed and resizing not in processing state
    if (this.innerWidth !== this.oldInnerWidth) {
      if (!this.Settings.multi_line || this.av.AudioPxWidth < this.innerWidth) {
        this.av.AudioPxWidth = this.innerWidth;
        this.av.audioTCalculator.audio_px_width = this.innerWidth;
        const ratio = this.innerWidth / this.oldInnerWidth;

        this.changePlayCursorAbsX((this.av.PlayCursor.absX * ratio));
        this.update(true);
      } else if (this.Settings.multi_line) {
        this.update(false);
      }

      if (this.av.PlayCursor.absX > 0) {
        const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this.innerWidth);

        if (line) {
          this.drawPlayCursorOnly(line);
        }
      }
    }
  }

  public getLocation(): any {
    const rect = this.aview.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  public selectSegment(seg_index: number, successcallback: (posY1: number, posY2: number) => void = () => {
  }, errorcallback: () => void = () => {
  }): boolean {
    if (seg_index > -1) {
      const segment = this.transcr.segments.get(seg_index);
      const start_time = this.transcr.segments.getStartTime(seg_index);
      // make shure, that segments boundaries are visible
      if (start_time.samples >= this.av.Chunk.time.start.samples && segment.time.samples <= this.av.Chunk.time.end.samples) {
        const absX = this.av.audioTCalculator.samplestoAbsX(this.transcr.segments.get(seg_index).time.samples);
        let begin = new Segment(new AudioTime(0, this.audio.samplerate));
        if (seg_index > 0) {
          begin = this.transcr.segments.get(seg_index - 1);
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);
        const posY1 = (this.innerWidth < this.AudioPxWidth)
          ? Math.floor((beginX / this.innerWidth) + 1) * (this.Settings.height + this.Settings.margin.bottom) - this.Settings.margin.bottom
          : 0;

        const posY2 = (this.innerWidth < this.AudioPxWidth)
          ? Math.floor((absX / this.innerWidth) + 1) * (this.Settings.height + this.Settings.margin.bottom) - this.Settings.margin.bottom
          : 0;

        const boundary_select = this.av.getSegmentSelection(segment.time.samples - 1);
        if (boundary_select) {
          this.av.Selection = boundary_select;
          this.Settings.selection.color = 'purple';
          this.drawSegments();
          this.Settings.selection.color = 'gray';
          this.av.current.samples = this.av.Selection.start.samples;
          this.changePlayCursorSamples(this.av.Selection.start.samples);
          this.drawPlayCursorOnly(this.av.LastLine);
          this.audio.stopPlayback();
        }
        successcallback(posY1, posY2);

        return true;
      } else {
        errorcallback();
      }
      return false;
    }
  }
}
