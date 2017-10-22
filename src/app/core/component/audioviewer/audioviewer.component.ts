import {
  AfterViewInit,
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

import {
  AudioChunk,
  AudioSelection,
  AudioTime,
  AVMousePos,
  BrowserInfo,
  CanvasAnimation,
  Line,
  Logger,
  PlayCursor,
  Segment,
  SubscriptionManager
} from '../../shared';
import {KeymappingService, TranscriptionService} from '../../shared/service';
import {AudioviewerService} from './service/audioviewer.service';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {AudioRessource} from '../../obj/media/audio/AudioRessource';
import {PlayBackState} from '../../obj/media/index';
import {AudioviewerConfig} from './index';

@Component({
  selector: 'app-audioviewer',
  templateUrl: './audioviewer.component.html',
  styleUrls: ['./audioviewer.component.css'],
  providers: [AudioviewerService]
})

export class AudioviewerComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  get initialized(): boolean {
    return this._initialized;
  }

  get viewRect(): { x: number; y: number; w: number; h: number; lines: { start: number; end: number } } {
    return this._viewRect;
  }

  get innerWidth(): number {
    return this._innerWidth;
  }

  /**
   *    TODO
   *    Possible Improvements:
   *    - using 2 canvas for animations to implement double buffering by switching canvas visibility on and off
   */

  subscrmanager: SubscriptionManager;

  @ViewChild('audioview') aview;
  @ViewChild('graphicscan') graphicscanRef;
  @ViewChild('graphicscan2') graphicscanRef2;
  @ViewChild('overlaycan') overlaynacRef;
  @ViewChild('playcan') playcanRef;
  @ViewChild('mousecan') mousecanRef;

  // EVENTS
  @Output('selchange') selchange = new EventEmitter<AudioSelection>();
  @Output('segmententer') segmententer = new EventEmitter<any>();
  @Output('segmentchange') segmentchange = new EventEmitter<number>();
  @Output('mousecursorchange') mousecursorchange = new EventEmitter<AVMousePos>();
  @Output('playcursorchange') playcursorchange = new EventEmitter<PlayCursor>();
  @Output('shortcuttriggered') shortcuttriggered = new EventEmitter<any>();
  @Output() alerttriggered = new EventEmitter<{ type: string, message: string }>();
  @Output() scrolling = new EventEmitter<{ state: string }>();
  @Output() scrollbarchange = new EventEmitter<{ state: string }>();

  @Output('pos_time')
  get pos_time(): number {
    return this.av.PlayCursor.time_pos.samples;
  }

  @Input() margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  @Input('audiochunk') audiochunk: AudioChunk;
  @Input('name') name: string;

  // canvas
  private graphicscanvas: HTMLCanvasElement = null;
  private overlaycanvas: HTMLCanvasElement = null;
  private playcanvas: HTMLCanvasElement = null;
  private mousecanvas: HTMLCanvasElement = null;

  // contexts
  private g_context: CanvasRenderingContext2D = null;
  private p_context: CanvasRenderingContext2D = null;
  private o_context: CanvasRenderingContext2D = null;
  private m_context: CanvasRenderingContext2D = null;
  public scrollbar = {
    dragging: false,
    mouseover: false
  };

  private wheeling;
  private resizing = false;
  public updating = false;

  get round_values(): boolean {
    return this.Settings.round_values;
  }

  set round_values(value: boolean) {
    this.Settings.round_values = value;
  }

  // for animation of playcursor
  private anim: CanvasAnimation;

  public audioplaying = false;

  private step_backward = false;

  // size settings
  private width = 0;
  private height = 0;
  private _innerWidth = 0;
  private oldInnerWidth = 0;
  private _initialized = false;

  private _viewRect: {
    x: number, y: number, w: number, h: number, lines: {
      start: number,
      end: number
    }
  } = {
    x: 0, y: 0, w: 0, h: 0,
    lines: {start: 0, end: 0}
  };

  private _deactivate_shortcuts = false;

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

  get deactivate_shortcuts(): boolean {
    return this._deactivate_shortcuts;
  }

  set deactivate_shortcuts(value: boolean) {
    this._deactivate_shortcuts = value;
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

  constructor(public av: AudioviewerService,
              private transcr: TranscriptionService,
              private keyMap: KeymappingService,
              private langService: TranslateService) {

    this.av.initializeSettings();

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  ngOnInit() {
    this.anim = new CanvasAnimation(25);

    // drawn selection length is 0
    this.av.drawnselection = new AudioSelection(
      new AudioTime(0, this.audiochunk.audiomanager.ressource.info.samplerate),
      new AudioTime(0, this.audiochunk.audiomanager.ressource.info.samplerate)
    );

    this.subscrmanager.add(this.audiochunk.statechange.subscribe((state: PlayBackState) => {
      this.onAudioChunkStateChange();
    }));
  }

  ngAfterViewInit() {
    this.width = this.aview.elementRef.nativeElement.clientWidth;
    this._innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;
    this.oldInnerWidth = this._innerWidth;

    this.initialize().then(() => {
      this.updateCanvasSizes();
      this.update(true);
    }).catch((err) => {
      console.error(err);
    });
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!isNullOrUndefined(obj.audiochunk)) {
      const current: AudioChunk = obj.audiochunk.currentValue;

      if (!obj.audiochunk.firstChange) {
        if (!isNullOrUndefined(current)) {
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
    this.stopPlayback();
    this.av.destroy();
    this.subscrmanager.destroy();
  }

  public initialize(): Promise<void> {
    // initialize canvas
    this.graphicscanvas = this.graphicscanRef.elementRef.nativeElement;
    this.playcanvas = this.playcanRef.elementRef.nativeElement;
    this.overlaycanvas = this.overlaynacRef.elementRef.nativeElement;
    this.mousecanvas = this.mousecanRef.elementRef.nativeElement;

    this.g_context = this.graphicscanvas.getContext('2d');
    this.p_context = this.playcanvas.getContext('2d');
    this.o_context = this.overlaycanvas.getContext('2d');
    this.m_context = this.mousecanvas.getContext('2d');

    return this.av.initialize(this._innerWidth, this.audiochunk);
  }

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
            for (let i = this._viewRect.lines.start; i <= this._viewRect.lines.end; i++) {
              if (!isNullOrUndefined(this.av.LinesArray[i])) {
                this.clearDisplay(i);
                this.drawGrid(3, 3, this.av.LinesArray[i]);
              } else {
                break;
              }
            }
            this.drawSegments();
            if (this.Settings.cropping !== 'none') {
              this.av.Mousecursor.relPos.x = this._innerWidth / 2;
              this.drawCropBorder();
            }

            if (this.Settings.timeline.enabled) {
              this.drawTimeLine();
            }

            // draw signal. Separate for loop because of performance issues
            for (let i = this._viewRect.lines.start; i <= this._viewRect.lines.end; i++) {
              if (!this.drawSignal(i)) {
                break;
              }
            }
            if (this.Settings.cropping !== 'none') {
              this.av.Mousecursor.relPos.x = this._innerWidth / 2;
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

        if (!isNullOrUndefined(this.av.channel)) {
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
   * crop audioviewer
   * @param type "none" or "circle"
   * @param context
   */
  private crop(type: string, context: CanvasRenderingContext2D) {
    if (type === 'none' || type === 'circle') {
      const radius = this._innerWidth / 2;

      if (radius > 0 && !isNullOrUndefined(context)) {
        // crop Line
        context.globalAlpha = 1.0;
        context.save();
        context.beginPath();
        context.arc(this._innerWidth / 2, this.height / 2, this._innerWidth / 2, 0, 2 * Math.PI, false);
        context.closePath();
        context.clip();

        this.m_context.globalAlpha = 1.0;
        this.m_context.save();
        this.m_context.beginPath();
        this.m_context.arc(this._innerWidth / 2, this.height / 2, this._innerWidth / 2, 0, 2 * Math.PI, false);
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
    this._innerWidth = Number(this.width - this.Settings.margin.left - this.Settings.margin.right);
    const clientheight = this.aview.elementRef.nativeElement.clientHeight;

    this.av.updateLines(this._innerWidth);

    // set width
    this.graphicscanRef.changeAttr('width', this.width.toString());
    this.mousecanRef.changeAttr('width', this.width.toString());
    this.overlaynacRef.changeAttr('width', this.width.toString());
    this.playcanRef.changeAttr('width', this.width.toString());


    if (this.Settings.multi_line) {
      this.height = this.Settings.margin.top + (this.Settings.lineheight + this.Settings.margin.bottom) * this.av.LinesArray.length;
    } else {
      this.height = clientheight;
    }


    this._viewRect.w = this.width;
    this._viewRect.h = clientheight;

    // set height
    this.playcanRef.changeAttr('height', clientheight.toString());
    this.graphicscanRef.changeAttr('height', clientheight.toString());
    this.mousecanRef.changeAttr('height', clientheight.toString());
    this.overlaynacRef.changeAttr('height', clientheight.toString());
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

    if (!isNullOrUndefined(line_obj)) {
      // line_obj found
      const midline = Math.floor((this.Settings.lineheight - timeline_height) / 2);
      const x_pos = line_num * this.innerWidth;

      const zoomX = this.av.zoomX;
      const zoomY = this.av.zoomY;

      this.g_context.strokeStyle = this.Settings.data.color;
      this.g_context.beginPath();
      this.g_context.moveTo(line_obj.Pos.x, line_obj.Pos.y + midline - this.av.minmaxarray[x_pos] - this._viewRect.y);

      if (!isNullOrUndefined(midline) && !isNullOrUndefined(line_obj.Pos) && !isNullOrUndefined(this.av.minmaxarray)
        && !isNullOrUndefined(zoomY)) {
        for (let x = 0; (x + x_pos) < x_pos + line_obj.Size.width; x++) {

          const x_draw = (!this.Settings.round_values) ? line_obj.Pos.x + (x * zoomX) : Math.round(line_obj.Pos.x + (x * zoomX));
          const y_draw = (!this.Settings.round_values)
            ? (line_obj.Pos.y - this._viewRect.y + midline - (this.av.minmaxarray[x + x_pos] * zoomY))
            : Math.round(line_obj.Pos.y - this._viewRect.y + midline - (this.av.minmaxarray[x + x_pos] * zoomY));

          if (!isNaN(y_draw) && !isNaN(x_draw)) {
            this.g_context.lineTo(x_draw, y_draw);
          } else {
            break;
          }

        }
      } else {
        if (isNullOrUndefined(midline)) {
          throw Error('midline is null!');
        } else if (isNullOrUndefined(line_obj.Pos)) {
          throw Error('Pos is null!');
        } else if (isNullOrUndefined(this.av.minmaxarray)) {
          throw Error('MinMax Array is null!');
        } else if (isNullOrUndefined(zoomY)) {
          throw Error('ZoomY is null!');
        }
      }
      this.g_context.stroke();
      return true;
    }
    return false;
  };

  /**
   * drawGrid(h, v) draws a grid with h horizontal and v vertical lines over the canvas
   */
  drawGrid(hLines: number, vLines: number, line: Line) {
    const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;
    const hZoom = Math.round(this._innerWidth / vLines);
    const vZoom = Math.round((this.Settings.lineheight - timeline_height) / hLines);


    // --- get the appropriate context
    this.g_context.beginPath();
    this.g_context.strokeStyle = this.Settings.grid.color;
    // set |
    for (let x = Math.round(hZoom / 2); x < line.Size.width; x = x + hZoom) {
      this.g_context.moveTo(line.Pos.x + x, line.Pos.y - this._viewRect.y);
      this.g_context.lineTo(line.Pos.x + x, line.Pos.y - this._viewRect.y + this.Settings.lineheight - timeline_height);
    }

    // set vertical lines
    for (let y = Math.round(vZoom / 2); y < this.Settings.lineheight - timeline_height; y = y + vZoom) {
      this.g_context.moveTo(line.Pos.x, y + line.Pos.y - this._viewRect.y);
      this.g_context.lineTo(line.Pos.x + line.Size.width, y + line.Pos.y - this._viewRect.y);
    }
    this.g_context.stroke();
  }

  /**
   * clearDisplay() clears all canvas and gives each canvas its initialized status
   */
  clearDisplay(line_num) {
    // get canvas
    const line_obj = this.av.LinesArray[line_num];

    if (!isNullOrUndefined(line_obj)) {
      if (this.Settings.cropping !== 'none') {
        this.crop(this.Settings.cropping, this.g_context);
        this.crop(this.Settings.cropping, this.o_context);
      }

      const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;

      this.g_context.globalAlpha = 1.0;
      this.g_context.strokeStyle = this.Settings.frame.color;
      this.g_context.fillStyle = this.Settings.backgroundcolor;
      this.g_context.clearRect(line_obj.Pos.x, line_obj.Pos.y - this._viewRect.y, this._innerWidth,
        this.Settings.lineheight + this.margin.bottom);
      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this._viewRect.y, line_obj.Size.width,
        this.Settings.lineheight - timeline_height);
      this.g_context.lineWidth = 0.5;

      // draw margin bottom
      this.g_context.fillStyle = 'white';
      this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this._viewRect.y + this.Settings.lineheight, line_obj.Size.width,
        this.Settings.margin.bottom);

      // draw timeline container
      if (this.Settings.timeline.enabled) {
        this.g_context.fillRect(line_obj.Pos.x, line_obj.Pos.y - this._viewRect.y + (this.Settings.lineheight - timeline_height),
          line_obj.Size.width, timeline_height);
      }

      this.g_context.strokeRect(line_obj.Pos.x, line_obj.Pos.y - this._viewRect.y, line_obj.Size.width, this.Settings.lineheight);
      this.g_context.lineWidth = 1;
    }
  }

  /**
   * onMouseMove sets the selection to the current x values of the mouse move
   */
  onMouseMove($event) {

    const x = ($event.offsetX || $event.pageX - jQuery($event.target).offset().left);
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this._viewRect.y;

    const curr_line = this.av.getLineByMousePosition(x, y);

    this.mousecursorchange.emit(this.av.Mousecursor);

    if (curr_line) {
      this.focused = true;
      if (this.Settings.selection.enabled) {
        this.av.setMouseMovePosition($event.type, x, y, curr_line, this._innerWidth);
        this.drawCursor(curr_line);
        this.drawSegments(curr_line);
      }
    } else {
      this.focused = false;
    }
  }

  /**
   * draws an black Border alongside the cropped audioviewer
   */
  drawCropBorder() {
    const radius = this._innerWidth / 2;
    if (radius > 0) {
      this.g_context.moveTo(0, 0);
      this.g_context.beginPath();
      this.g_context.arc(radius, radius, radius - 2, 0, 2 * Math.PI, false);
      this.g_context.strokeStyle = 'black';
      this.g_context.lineWidth = 3;
      this.g_context.stroke();
    }
  }

  /**
   * drawCursor() changes the opacity of the mouse canvas in the selected line
   */
  drawCursor(line: Line) {
    if (line) {
      // TODO clear only last Cursor Position
      this.m_context.clearRect(0, 0, this._viewRect.w, this._viewRect.h);

      // --- now draw the cursor line ---
      this.m_context.globalAlpha = 1.0;
      this.m_context.strokeStyle = this.Settings.cursor.color;
      this.m_context.beginPath();
      this.m_context.moveTo(this.av.Mousecursor.relPos.x, line.Pos.y - this._viewRect.y);
      this.m_context.lineTo(this.av.Mousecursor.relPos.x, line.Pos.y - this._viewRect.y + this.Settings.lineheight - 1);
      this.m_context.stroke();
    }
  }

  /**
   * drawSegments() draws a vertical line for every boundary in the current audio viewer
   */
  drawSegments(line_obj: Line = null) {
    this.o_context.fillStyle = 'white';
    this.o_context.globalAlpha = 1.0;

    let drawn_segments = 0;
    let drawn_boundaries = 0;
    let cleared = 0;
    let drawn_selection = 0;

    if (!isNullOrUndefined(line_obj)) {
      // draw segments for this line only
      if (this.Settings.boundaries.enabled && this.transcr.currentlevel.segments) {
        const segments = this.transcr.currentlevel.segments.getSegmentsOfRange(
          this.audiochunk.time.start.samples, this.audiochunk.time.end.samples
        );

        const startline: Line = (line_obj.number > 0) ? this.av.LinesArray[line_obj.number - 1] : line_obj;
        const endline: Line = (line_obj.number < this.av.LinesArray.length - 1)
          ? this.av.LinesArray[line_obj.number + 1] : line_obj;

        const line_absx: number = startline.number * this._innerWidth;
        const line_samples: number = this.av.audioTCalculator.absXChunktoSamples(line_absx, this.audiochunk);
        const line_start: AudioTime = new AudioTime(line_samples, this.audioressource.info.samplerate);

        const endline_absx: number = endline.number * this._innerWidth;
        const line_samples_end: number = this.av.audioTCalculator.absXChunktoSamples(endline_absx + endline.Size.width, this.audiochunk);
        const line_end: AudioTime = new AudioTime(line_samples_end, this.audioressource.info.samplerate);

        const clearheight = endline.Pos.y - startline.Pos.y + line_obj.Size.height;
        cleared++;
        this.o_context.clearRect(startline.Pos.x - 5, startline.Pos.y - this._viewRect.y,
          Math.max(startline.Size.width, endline.Size.width) + 5, clearheight + 1);

        // console.log('DRAW SEGMENTS ' + this.Settings.height);

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const start = AudioTime.sub(segments[i].time, this.audiochunk.time.start);
          const absX = this.av.audioTCalculator.samplestoAbsX(start.samples);

          let begin = new Segment(new AudioTime(0, this.audioressource.info.samplerate));

          if (i > 0) {
            begin = segments[i - 1];
          }

          /* if(i === 0) {
           console.log(`draw segment ${i}`);
           console.log(`check ${line_start.samples} <= ${begin.time.samples}
           && ${line_start.samples} + ${line_end.samples} <= ${segment.time.samples}`);
           } */

          /*
           three cases where segment has to be drawn:
           1. segment full visible in line
           2. segment's right border visible in line => fill to the left
           3. segment's left border visible in line => fill to the right
           4. segment's borders are out of the three lines

           left border: begin.time.samples
           right border: segment.samples
           */
          if (
            (begin.time.samples >= line_start.samples && segment.time.samples <= line_end.samples) ||
            (begin.time.samples < line_start.samples && segment.time.samples <= line_end.samples
              && segment.time.samples >= line_start.samples) ||
            (begin.time.samples >= line_start.samples && begin.time.samples <= line_end.samples
              && segment.time.samples > line_end.samples) ||
            (begin.time.samples < line_start.samples && segment.time.samples > line_end.samples)
          ) {
            // sample in the lines space
            const line_num1 = startline.number;
            const line_num2 = endline.number;

            // console.warn(`(${line_num1} | x | ${line_num2})`);

            for (let j = line_num1; j <= line_num2; j++) {
              const line = this.av.LinesArray[j];

              const h = line.Size.height;
              let relX = 0;

              relX = absX % this._innerWidth + this.Settings.margin.left;

              const select = this.av.getRelativeSelectionByLine(line, begin.time.samples, segments[i].time.samples, this._innerWidth);
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

              drawn_segments++;
              this.o_context.fillRect(x + this.Settings.margin.left - 1, line.Pos.y - this._viewRect.y, w, h);
            }

            // draw boundaries
            const seg_linenum = (this._innerWidth < this.AudioPxWidth) ? Math.floor(absX / this._innerWidth) : 0;

            const line = this.av.LinesArray[seg_linenum];
            if (!isNullOrUndefined(line) && segment.time.samples !== this.audioressource.info.duration.samples
              && seg_linenum >= line_num1 && seg_linenum <= line_num2) {
              const h = line.Size.height;
              let relX = 0;
              if (this.Settings.multi_line) {
                relX = absX % this._innerWidth + this.Settings.margin.left;
              } else {
                relX = absX + this.Settings.margin.left;
              }

              this.o_context.globalAlpha = 0.5;
              this.o_context.beginPath();
              this.o_context.strokeStyle = this.Settings.boundaries.color;
              this.o_context.lineWidth = this.Settings.boundaries.width;
              this.o_context.moveTo(relX, line.Pos.y - this._viewRect.y);
              this.o_context.lineTo(relX, line.Pos.y - this._viewRect.y + h);
              this.o_context.stroke();
              drawn_boundaries++;
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
      }
    } else {
      cleared++;
      this.o_context.clearRect(0, 0, this._viewRect.w, this._viewRect.h);

      // draw segments for all visible lines
      if (this.Settings.boundaries.enabled && this.transcr.currentlevel.segments.length > 0) {
        const segments = this.transcr.currentlevel.segments.getSegmentsOfRange(
          this.audiochunk.time.start.samples, this.audiochunk.time.end.samples
        );

        this.o_context.globalAlpha = 1.0;

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const start = AudioTime.sub(segments[i].time, this.audiochunk.time.start);
          const absX = this.av.audioTCalculator.samplestoAbsX(start.samples);
          let begin = new Segment(new AudioTime(0, this.audioressource.info.samplerate));

          if (i > 0) {
            begin = segments[i - 1];
          }
          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);
          const line_num1 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(beginX / this._innerWidth) : 0;
          const line_num2 = (this._innerWidth < this.AudioPxWidth) ? Math.floor(absX / this._innerWidth) : 0;

          if (
            ((line_num1 <= this._viewRect.lines.start && line_num2 <= this._viewRect.lines.end) ||
              (line_num1 >= this._viewRect.lines.start && line_num2 <= this._viewRect.lines.end) ||
              (line_num1 >= this._viewRect.lines.start && line_num2 >= this._viewRect.lines.end) ||
              (line_num1 <= this._viewRect.lines.start && line_num2 >= this._viewRect.lines.end))
            &&
            ((segment.time.samples >= this.audiochunk.time.start.samples && segment.time.samples <= this.audiochunk.time.end.samples)
              || (begin.time.samples >= this.audiochunk.time.start.samples && begin.time.samples <= this.audiochunk.time.end.samples)
              || (begin.time.samples < this.audiochunk.time.start.samples && segment.time.samples > this.audiochunk.time.end.samples))
          ) {
            for (let j = Math.max(line_num1, this._viewRect.lines.start); j <= Math.min(line_num2, this._viewRect.lines.end); j++) {
              const line = this.av.LinesArray[j];

              if (line) {
                const h = line.Size.height;
                let relX = 0;

                relX = absX % this._innerWidth + this.Settings.margin.left;

                const select = this.av.getRelativeSelectionByLine(line, begin.time.samples, segments[i].time.samples, this._innerWidth);
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

                drawn_segments++;
                this.o_context.fillRect(x + this.Settings.margin.left - 1, line.Pos.y - this._viewRect.y, w, h);
              }
            }
          } else if (line_num2 > this._viewRect.lines.end + 2) {
            break;
          }
          // draw boundary
          const line = this.av.LinesArray[line_num2];
          if (line_num2 >= this._viewRect.lines.start && line_num2 <= this._viewRect.lines.end &&
            !isNullOrUndefined(line) && segment.time.samples !== this.audioressource.info.duration.samples) {
            const h = line.Size.height;
            let relX = 0;
            if (this.Settings.multi_line) {
              relX = absX % this._innerWidth + this.Settings.margin.left;
            } else {
              relX = absX + this.Settings.margin.left;
            }

            this.o_context.globalAlpha = 0.5;
            this.o_context.beginPath();
            this.o_context.strokeStyle = this.Settings.boundaries.color;
            this.o_context.lineWidth = this.Settings.boundaries.width;
            this.o_context.moveTo(relX, line.Pos.y - this._viewRect.y);
            this.o_context.lineTo(relX, line.Pos.y - this._viewRect.y + h);
            this.o_context.stroke();
            drawn_boundaries++;
          }
        }
      }

      // draw selection
      if (!isNullOrUndefined(this.av.drawnselection)) {
        const sel_start = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.start.samples);
        const sel_end = this.av.audioTCalculator.samplestoAbsX(this.av.drawnselection.end.samples);
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
    const y = ($event.offsetY || $event.pageY - jQuery($event.target).offset().left) + this._viewRect.y;

    const curr_line = this.av.getLineByMousePosition(x, y);

    if (curr_line && this.Settings.selection.enabled) {
      this.av.setMouseClickPosition(x, y, curr_line, $event, this._innerWidth, this).then((curr: Line) => {
        this.drawPlayCursorOnly(curr);
      });
      this.drawCursor(this.av.LastLine);
      if ($event.type !== 'mousedown') {
        this.selchange.emit(this.audiochunk.selection);
      }
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
            const shortcut = this.Settings.shortcuts['' + shortc + ''];
            const focuscheck = (!isNullOrUndefined(shortcut)) && (shortcut.focusonly === false
              || (shortcut.focusonly === this.focused === true));

            if (focuscheck && this.Settings.shortcuts['' + shortc + '']['keys']['' + platform + ''] === comboKey) {
              switch (shortc) {
                case('play_pause'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});
                  if (this.audiochunk.isPlaying) {
                    this.pausePlayback();
                  } else {
                    this.startPlayback();
                  }
                  key_active = true;
                  break;
                case('stop'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stopPlayback();
                  key_active = true;
                  break;
                case('step_backward'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackward();
                  key_active = true;
                  break;
                case('step_backwardtime'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.stepBackwardTime(0.5);
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
                        this.segmentchange.emit(result.seg_samples);
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
                      const segment_i = this.transcr.currentlevel.segments.getSegmentBySamplePosition(xSamples);
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

                    const boundary_select = this.av.getSegmentSelection(this.av.Mousecursor.timePos.samples);
                    if (boundary_select) {
                      const segment_i = this.transcr.currentlevel.segments.getSegmentBySamplePosition(xSamples);
                      if (segment_i > -1) {
                        const segment = this.transcr.currentlevel.segments.get(segment_i);
                        const start_time = this.transcr.currentlevel.segments.getStartTime(segment_i);
                        // make shure, that segments boundaries are visible
                        if (start_time.samples >= this.audiochunk.time.start.samples &&
                          segment.time.samples <= this.audiochunk.time.end.samples) {
                          const absX = this.av.audioTCalculator.samplestoAbsX(
                            this.transcr.currentlevel.segments.get(segment_i).time.samples
                          );
                          this.audiochunk.selection = boundary_select.clone();
                          this.av.drawnselection = boundary_select.clone();
                          this.selchange.emit(this.audiochunk.selection);
                          this.drawSegments();

                          let begin = new Segment(new AudioTime(0, this.audioressource.info.samplerate));
                          if (segment_i > 0) {
                            begin = this.transcr.currentlevel.segments.get(segment_i - 1);
                          }
                          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);

                          const posY1 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((beginX / this._innerWidth) + 1) *
                            (this.Settings.lineheight + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          const posY2 = (this._innerWidth < this.AudioPxWidth)
                            ? Math.floor((absX / this._innerWidth) + 1) *
                            (this.Settings.lineheight + this.Settings.margin.bottom) - this.Settings.margin.bottom
                            : 0;

                          if (xSamples >= this.audiochunk.selection.start.samples && xSamples <= this.audiochunk.selection.end.samples) {
                            this.audiochunk.playposition.samples = this.audiochunk.selection.start.samples;
                            this.changePlayCursorSamples(this.audiochunk.selection.start.samples);
                            this.drawPlayCursorOnly(this.av.LastLine);

                            const id = this.subscrmanager.add(this.audiochunk.statechange.subscribe(
                              (state: PlayBackState) => {
                                if (state === PlayBackState.STOPPED) {
                                  this.audiochunk.selection = boundary_select.clone();
                                  this.playSelection();

                                  this.subscrmanager.remove(id);
                                }
                              },
                              (error) => {
                                console.error(error);
                              }
                            ));

                            this.audiochunk.stopPlayback();
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
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'segment'});
                    const seg_index = this.transcr.currentlevel.segments.getSegmentBySamplePosition(
                      this.av.Mousecursor.timePos.samples
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
  playSelection = (): boolean => {
    const drawFunc = () => {
      this.audiochunk.updatePlayPosition();
      this.anim.requestFrame(this.drawPlayCursor);
    };

    return this.audiochunk.startPlayback(drawFunc);
  }


  /**
   * method called when audioplayback ended
   */
  private onAudioChunkStateChange = () => {
    if (this.audiomanager.replay && this.audiochunk.isPlaybackEnded) {
      this.audiochunk.playposition = this.audiochunk.time.start.clone();
      this.playSelection();
    } else if (this.audiochunk.isPlaybackEnded) {
      if (!this.audiomanager.stepbackward) {
        this.audiochunk.playposition = this.audiochunk.selection.start.clone();
        this.av.drawnselection = this.av.drawnselection.clone();
        this.drawSegments();
      } else {
        this.av.PlayCursor.changeSamples(this.audiochunk.lastplayedpos.samples, this.av.audioTCalculator, this.audiochunk);
        this.startPlayback();
      }
    }

    if (this.audiochunk.isPlayBackStopped && this.audiomanager.stepbackward) {

      this.av.PlayCursor.changeSamples(this.audiochunk.playposition.samples,
        this.av.audioTCalculator, this.audiochunk);

      this.startPlayback();
    }

    this.drawPlayCursor();

    this.audiomanager.stepbackward = false;
    this.audiomanager.paused = false;
  }

  /**
   * stops audio playback
   */
  stopPlayback(): boolean {
    return this.audiochunk.stopPlayback();
  }

  /**
   * pause audio playback
   */
  pausePlayback() {
    this.audiochunk.pausePlayback();
  }

  /**
   * start audio playback
   */
  startPlayback(): boolean {
    if (!this.audiochunk.isPlaying && this.av.MouseClickPos.absX < this.av.AudioPxWidth - 5) {
      return this.playSelection();
    }
    return false;
  }

  /**
   * set audio for replay and returns if replay is active
   * @returns {boolean}
   */
  rePlayback(): boolean {
    return this.audiochunk.rePlayback();
  }

  /**
   * step to last position
   */
  stepBackward() {
    this.audiochunk.stepBackward();
  }

  stepBackwardTime(back_sec: number) {
    this.audiochunk.stepBackwardTime(back_sec);
  }

  /**
   * draw PlayCursor. Call this method only while animation.
   */
  drawPlayCursor = () => {
    let currentAbsX = this.av.audioTCalculator.samplestoAbsX((this.audiochunk.playposition.samples - this.audiochunk.time.start.samples));
    const endAbsX = this.av.audioTCalculator.samplestoAbsX((this.audiochunk.time.end.samples - this.audiochunk.time.start.samples));
    currentAbsX = Math.min(currentAbsX, endAbsX - 1);
    this.changePlayCursorAbsX(currentAbsX);

    // get line of PlayCursor
    const line = this.av.getLineByAbsX(this.av.PlayCursor.absX, this._innerWidth);

    if (line) {
      this.drawPlayCursorOnly(line);
      this.av.LastLine = line;
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
      const relY = curr_line.Pos.y - this._viewRect.y;
      this.p_context.clearRect(0, 0, this._viewRect.w, this._viewRect.h);
      if (curr_line.number >= this._viewRect.lines.start && curr_line.number <= this._viewRect.lines.end &&
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
   * draws the timeline if timeline ist enabled
   */
  drawTimeLine = function () {
    if (this.Settings.timeline.enabled && this.av.LinesArray.length > 0
      && this.audiochunk.time.start.samples > 0 && this.av.AudioPxWidth > 0
    ) {
      let max_width = this.g_context.measureText(this.getmaxString(
        Math.round(this.audiochunk.time.duration.seconds * 100) / 100, 2)
      ).width + 12;
      const sec_px = (this.Settings.multi_line)
        ? this.Settings.pixel_per_sec
        : this.av.audioTCalculator.samplestoAbsX(this.av.audioTCalculator.secondsToSamples(1), this.av.DurTime);

      max_width = max_width / sec_px;
      let t = this.av.audioTCalculator.secondsToSamples(max_width);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, this.audiochunk.time.duration);
      t = this.av.audioTCalculator.absXChunktoSamples(max_width, this.audiochunk);
      t = t - this.audiochunk.time.start.samples;

      let mwidth_seconds = this.av.audioTCalculator.samplesToSeconds(t);
      mwidth_seconds = Math.round(mwidth_seconds * 100) / 100;
      t = this.av.audioTCalculator.secondsToSamples(mwidth_seconds);
      max_width = this.av.audioTCalculator.samplestoAbsX(t, this.audiochunk.time.duration);

      const parts = this.av.AudioPxWidth / max_width;
      const start_time: AudioTime = this.audiochunk.time.start;

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
          let relX = this.av.audioTCalculator.samplestoAbsX(time2.samples - start_time.samples, this.audiochunk.time.duration);
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

  private drawSelection = (line: Line) => {
    if (!isNullOrUndefined(this.av.drawnselection)) {
      // draw gray selection
      const select = this.av.getRelativeSelectionByLine(
        line, this.av.drawnselection.start.samples, this.av.drawnselection.end.samples, this._innerWidth
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
          this.o_context.fillRect(line.Pos.x + x, line.Pos.y - this._viewRect.y, w, this.Settings.lineheight);
        }

        this.o_context.globalAlpha = 1.0;
      }
    }
  }

  /**
   * adjust the view when window resized
   * @param $event
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizing = true;
    this.width = this.aview.elementRef.nativeElement.clientWidth;
    this._innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;

    // only resize if size has changed and resizing not in processing state
    if (this._innerWidth !== this.oldInnerWidth) {
      setTimeout(() => {
        this.updateCanvasSizes();
        if ((!this.Settings.multi_line || this.av.AudioPxWidth < this._innerWidth) && !this.resizing) {
          this.av.AudioPxWidth = this._innerWidth;
          this.av.audioTCalculator.audio_px_width = this._innerWidth;
          const ratio = this._innerWidth / this.oldInnerWidth;

          this.changePlayCursorAbsX((this.av.PlayCursor.absX * ratio));
          this.update(true);
        } else if (this.Settings.multi_line) {
          this.update(false);
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
      if (start_time.samples >= this.audiochunk.time.start.samples && segment.time.samples <= this.audiochunk.time.end.samples) {
        const absX = this.av.audioTCalculator.samplestoAbsX(this.transcr.currentlevel.segments.get(seg_index).time.samples);
        let begin = new Segment(new AudioTime(0, this.audioressource.info.samplerate));
        if (seg_index > 0) {
          begin = this.transcr.currentlevel.segments.get(seg_index - 1);
        }
        const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time.samples);
        const posY1 = (this._innerWidth < this.AudioPxWidth)
          ? Math.floor((beginX / this._innerWidth) + 1) * (this.Settings.lineheight + this.Settings.margin.bottom)
          - this.Settings.margin.bottom
          : 0;

        let posY2 = 0;

        if (this._innerWidth < this.AudioPxWidth) {
          posY2 = Math.floor((absX / this._innerWidth) + 1) * (this.Settings.lineheight +
            this.Settings.margin.bottom) - this.Settings.margin.bottom;
        }

        const boundary_select = this.av.getSegmentSelection(segment.time.samples - 1);
        if (boundary_select) {
          this.audiochunk.selection = boundary_select;
          this.av.drawnselection = boundary_select.clone();
          this.drawSegments();
          this.Settings.selection.color = 'gray';
          this.audiochunk.playposition.samples = this.audiochunk.selection.start.samples;
          this.changePlayCursorSamples(this.audiochunk.selection.start.samples);
          this.drawPlayCursorOnly(this.av.LastLine);
          this.audiochunk.stopPlayback();
        }
        successcallback(posY1, posY2);

        return true;
      } else {
        errorcallback();
      }
      return false;
    } else {
      errorcallback();
    }
    return false;
  }

  public focus() {
    this.mousecanRef.nativeElement.focus();
  }

  private updateVisibleLines() {
    this._viewRect.lines.start = Math.floor(this._viewRect.y / (this.Settings.lineheight + this.Settings.margin.bottom));
    this._viewRect.lines.end = Math.floor((this._viewRect.y + this._viewRect.h) / (this.Settings.lineheight + this.Settings.margin.bottom));
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    if ((this.height >= this.viewRect.h)) {
      if (BrowserInfo.os === 'mac') {
        this._viewRect.y = Math.max(0, this._viewRect.y - event.deltaY);
      } else {
        this._viewRect.y = Math.max(0, this._viewRect.y + event.deltaY);
      }
      this.scrollTo(this._viewRect.y);
    }
  }

  public scrollTo(y_coord: number, scrollbar: boolean = false) {
    if ((this.height >= this.viewRect.h)) {
      this.scrolling.emit({state: 'scrolling'});
      this._viewRect.y = Math.max(0, y_coord);
      this._viewRect.y = Math.min(this._viewRect.y, this.height - this._viewRect.h);
      this.updateVisibleLines();

      if (!isNullOrUndefined(this.wheeling)) {
        window.clearTimeout(this.wheeling);
      }
      this.wheeling = setTimeout(() => {
        if (!scrollbar) {
          this.scrolling.emit({state: 'stopped'});
        }
        this.update(false);
      }, 20);
    }
  }

  onSliderChanged($event: MouseEvent) {
    if (this.height >= this.viewRect.h) {
      if ($event.type === 'mousemove') {
        if (this.scrollbar.dragging) {
          this.scrollTo(($event.layerY / this._viewRect.h) * this.height, true);
        }
      } else if ($event.type === 'mousedown') {
        this.scrollbar.dragging = true;
      } else if ($event.type === 'mouseup' || $event.type === 'mouseleave' || $event.type === 'mouseout') {
        this.scrolling.emit({state: 'stopped'});
        this.scrollbar.dragging = false;
      } else if ($event.type === 'click') {
        if (!this.scrollbar.dragging) {
          this.scrollTo(($event.layerY / this._viewRect.h) * this.height, false);
        }
        this.scrollbar.dragging = false;
      }
    }
  }
}
