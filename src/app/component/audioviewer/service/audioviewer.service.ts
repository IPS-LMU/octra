import {Injectable} from '@angular/core';

import {
  AudioTime,
  AudioTimeCalculator,
  AVMousePos,
  AVSelection,
  Chunk,
  Line,
  PlayCursor,
  SubscriptionManager
} from '../../../shared';

import {AudioComponentService, AudioService, KeymappingService, TranscriptionService} from '../../../service';
import {AudioviewerConfigValidator} from '../validator/AudioviewerConfigValidator';
import {AudioviewerConfig} from '../config/av.config';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class AudioviewerService extends AudioComponentService {
  get minmaxarray(): number[] {
    return this._minmaxarray;
  }

  get zoomX(): number {
    return this._zoomX;
  }

  get zoomY(): number {
    return this._zoomY;
  }

  private _settings: AudioviewerConfig;

  private subscrmanager: SubscriptionManager;

  // LINES
  private Lines: Line[] = [];

  private dragableBoundaryNumber: number = -1;
  public overboundary = false;

  // SELECTION
  private selection: AVSelection = null;

  // AUDIO
  private durtime: AudioTime = null;
  private _channel: Float32Array = null;

  private _zoomY = 1;
  private _zoomX = 1;
  private _minmaxarray: number[] = [];

  public focused = false;

  public shift_pressed = false;

  get LinesArray(): Line[] {
    return this.Lines;
  }

  get Mousecursor(): AVMousePos {
    return this.mousecursor;
  }

  set Mousecursor(new_pos: AVMousePos) {
    this.mousecursor = new_pos;
  }

  get LastLine(): Line {
    return this.last_line;
  }

  set LastLine(line: Line) {
    this.last_line = line;
  }

  get Selection(): AVSelection {
    return this.selection;
  }

  set Selection(new_sel: AVSelection) {
    this.selection = new_sel;
  }

  get DurTime(): AudioTime {
    return this.durtime;
  }

  set DurTime(new_durtime: AudioTime) {
    this.durtime = new_durtime;
    this.audioTCalculator.duration = this.durtime.clone();
  }

  get Settings(): any {
    return this._settings;
  }

  set Settings(value: any) {
    this._settings = value;
  }

  get channel(): Float32Array {
    return this._channel;
  }

  constructor(protected audio: AudioService,
              protected transcrService: TranscriptionService,
              private keyMap: KeymappingService,
              private langService: TranslateService) {
    super(audio);

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeyup.subscribe(this.onKeyUp));
  }

  /**
   * sets the time of duration in seconds
   */
  public updatePlayDuration() {
    if (this.selection && this.selection.start.samples < this.selection.end.samples) {
      this.playduration.samples = this.selection.end.samples - this.selection.start.samples;
    } else if (this.Chunk && this.Chunk.time.start.samples >= 0 && this.Chunk.time.end.samples > this.Chunk.time.start.samples) {
      const start_pos = this.current.samples;
      this.playduration.samples = (this.Chunk.time.end.samples - start_pos);
    } else {
      this.playduration = new AudioTime(0, this.audio.samplerate);
    }
  }

  /**
   * updates distance considering the chunk size
   */
  public updateDistance(): void {
    if (this.playduration.samples === 0) {
      this.distance = this.audio_px_w - this.audioTCalculator.samplestoAbsX(this.current.samples);
    } else {
      if (this.selection.start.samples >= 0 && this.selection.end.samples > this.selection.start.samples) {
        this.distance = this.audioTCalculator.samplestoAbsX((this.selection.end.samples - this.current.samples));
      } else if (this.Chunk.time.start.samples >= 0 && this.Chunk.time.end.samples > this.Chunk.time.start.samples) {
        // TODO ÄNDERN
        this.distance = this.audioTCalculator.samplestoAbsX((this.Chunk.time.end.samples - this.current.samples));
      }
    }
  }


  // TODO DELETE
  /* public resetAudioMeta() {
   super.resetAudioMeta();

   this.selection = null;
   }*/

  /**
   * initializes audioviewer using inner width
   * @param innerWidth
   */
  public initialize(innerWidth: number) {
    super.initialize(innerWidth);

    this.Lines = [];

    this.audio.updateChannel();
    this._channel = this.audio.channel;

    if (this.Settings.multi_line) {
      this.AudioPxWidth = this.audio.duration.seconds * this.Settings.pixel_per_sec;
      this.AudioPxWidth = (this.AudioPxWidth < innerWidth) ? innerWidth : this.AudioPxWidth;
    } else {
      this.AudioPxWidth = innerWidth;
    }

    // initialize the default values
    this.Chunk = new Chunk(new AVSelection(new AudioTime(0, this.audio.samplerate),
      new AudioTime(this.audio.duration.samples, this.audio.samplerate)));
    this.durtime = new AudioTime(this.Chunk.time.length, this.audio.samplerate);
    this.audioTCalculator = new AudioTimeCalculator(this.audio.samplerate, this.durtime, this.AudioPxWidth);
    this.playduration = this.durtime.clone();
    this.Mousecursor = new AVMousePos(0, 0, 0, new AudioTime(0, this.audio.samplerate));
    this.MouseClickPos = new AVMousePos(0, 0, 0, new AudioTime(0, this.audio.samplerate));
    this.PlayCursor = new PlayCursor(0, new AudioTime(0, this.audio.samplerate), innerWidth);
    this.afterChannelInititialized(innerWidth);
  }

  /**
   * change the chunk date of the audioviewer
   * @param start
   * @param end
   * @param innerWidth
   */
  changeBuffer(start: AudioTime, end: AudioTime, innerWidth: number) {
    this.Chunk.time = new AVSelection(start.clone(), end.clone());
    this.Chunk.selection = new AVSelection(new AudioTime(0, this.audio.samplerate), new AudioTime(1, this.audio.samplerate));
    this._channel = this.audio.getChannelBuffer(this.Chunk, innerWidth);
    if (this._channel.length === 0) {
      throw new Error('Channel Data Length is 0');
    } else {
      this.DurTime = new AudioTime(this.Chunk.time.length, this.audio.samplerate);
      this.afterChannelInititialized(innerWidth);
      this.current = this.Chunk.time.start.clone();
    }
  }


  private calculateZoom(height: number, width: number, minmaxarray: number[]) {
    if (this.Settings.justify_signal_height) {
      // justify height to maximum top border
      let max_zoom_x = 0;
      let max_zoom_y = 0;
      const timeline_height = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;
      let max_zoom_y_min = height / 2;
      const x_max = this.AudioPxWidth;

      // get_max_signal_length
      for (let i = 0; i <= x_max; i++) {
        max_zoom_x = i;

        if (isNaN(minmaxarray[i])) {
          break;
        }
        max_zoom_y = Math.max(max_zoom_y, minmaxarray[i]);
        max_zoom_y_min = Math.min(max_zoom_y_min, minmaxarray[i]);
      }
      const rest = (height - timeline_height - (max_zoom_y + Math.abs(max_zoom_y_min)));
      if (max_zoom_y > 0) {
        this._zoomY = (rest / (max_zoom_y + Math.abs(max_zoom_y_min))) + 1;

        this._zoomX = width / max_zoom_x;
      }
    } else {
      this._zoomY = 1;
    }
  }

  /**
   * computeDisplayData() generates an array of min-max pairs representing the
   * audio signal. The values of the array are float in the range -1 .. 1.
   * @param w
   * @param h
   * @param channel
   */
  computeDisplayData(w, h, channel) {
    w = Math.floor(w);
    const min_maxarray = [],
      len = channel.length;

    let min = 0,
      max = 0,
      val = 0,
      offset = 0,
      maxindex = 0;

    const xZoom = len / w;

    const yZoom = h / 2;

    for (let i = 0; i < w; i++) {
      offset = Math.round(i * xZoom);
      min = channel [offset];
      max = channel [offset];

      if (isNaN(channel [offset])) {
        break;
      }

      if ((offset + xZoom) > len) {
        maxindex = len;
      } else {
        maxindex = Math.round(offset + xZoom);
      }

      for (let j = offset; j < maxindex; j++) {
        val = channel[j];
        max = Math.max(max, val);
        min = Math.min(min, val);
      }
      min_maxarray.push(min * yZoom);
      min_maxarray.push(max * yZoom);
    }
    this._minmaxarray = min_maxarray;
  };

  /**
   * after Channel was initialzed
   * @param innerWidth
   */
  private afterChannelInititialized(innerWidth: number) {
    this.refresh();
    this.calculateZoom(this.Settings.height, this.AudioPxWidth, this._minmaxarray);

    this.updateLines(innerWidth);

    this.current = new AudioTime(0, this.audio.samplerate);
    this.selection = new AVSelection(new AudioTime(0, this.audio.samplerate), new AudioTime(0, this.audio.samplerate));
  }

  /**
   * save mouse position for further processing
   * @param type
   * @param x
   * @param y
   * @param curr_line
   * @param innerWidth
   */
  public setMouseMovePosition(type: string, x: number, y: number, curr_line: Line, innerWidth) {
    super.setMouseMovePosition(type, x, y, curr_line, innerWidth);

    const absX = this.getAbsXByLine(curr_line, x - curr_line.Pos.x, innerWidth);
    const absXTime = this.audioTCalculator.absXChunktoSamples(absX, this.Chunk);

    let dragableBoundaryTemp = this.getBoundaryNumber(absX);

    if (this.mouse_down && this.dragableBoundaryNumber < 0) {
      // mouse down, nothing dragged
      this.selection.end = new AudioTime(absXTime, this.audio.samplerate);
      this.current = this.selection.start.clone();
    } else if (this.mouse_down && this.dragableBoundaryNumber > -1) {
      // mouse down something dragged
      const segment = this.transcrService.segments.get(this.dragableBoundaryNumber);
      segment.time.samples = absXTime;
      this.transcrService.segments.change(this.dragableBoundaryNumber, segment);
      this.transcrService.segments.sort();
      dragableBoundaryTemp = this.getBoundaryNumber(absX);
      this.dragableBoundaryNumber = dragableBoundaryTemp;
    } else {
      this.mouse_down = false;
    }

    // set if boundary was dragged
    this.overboundary = (dragableBoundaryTemp > -1);
  }

  /**
   * saves mouse click position
   * @param x
   * @param y
   * @param curr_line
   * @param $event
   * @param innerWidth
   * @param callback
   */
  public setMouseClickPosition(x: number, y: number, curr_line: Line, $event: Event, innerWidth: number, callback = () => {
  }) {
    super.setMouseClickPosition(x, y, curr_line, $event, innerWidth);

    const absX = this.getAbsXByLine(curr_line, x - curr_line.Pos.x, innerWidth);
    const absXInTime = this.audioTCalculator.absXChunktoSamples(absX, this.Chunk);

    if (this.selection && !this.audio.audioplaying) {
      if (this.last_line == null || this.last_line === curr_line) {
        // same line
        // fix margin settings
        if ($event.type === 'mousedown' && !this.shift_pressed) {
          if (this.last_line == null || this.last_line.number === this.last_line.number) {
            // no line defined or same line
            this.mouse_click_pos.absX = absX;
            this.mouse_click_pos.timePos = new AudioTime(absXInTime, this.audio.samplerate);
            this.mouse_click_pos.line = curr_line;

            this.selection.start = this.mouse_click_pos.timePos.clone();
            this.selection.end = this.mouse_click_pos.timePos.clone();

            this.dragableBoundaryNumber = this.getBoundaryNumber(this.mouse_click_pos.absX);
          }
          this.mouse_down = true;
        } else if ($event.type === 'mouseup') {
          this.mouse_down = false;

          if (this.dragableBoundaryNumber > -1 && this.dragableBoundaryNumber < this.transcrService.segments.length) {
            // some boundary dragged
            const segment = this.transcrService.segments.get(this.dragableBoundaryNumber);
            segment.time.samples = this.audioTCalculator.absXChunktoSamples(absX, this.Chunk);
            this.transcrService.segments.change(this.dragableBoundaryNumber, segment);
            this.transcrService.segments.sort();
          } else {
            // set selection
            this.selection.end = new AudioTime(absXInTime, this.audio.samplerate);
            this.Selection.checkSelection();
            this.current = this.selection.start.clone();
            this.PlayCursor.changeSamples(this.current.samples, this.audioTCalculator, this.Chunk);
          }

          this.dragableBoundaryNumber = -1;
          this.overboundary = false;
        }
      } else if ($event.type === 'mouseup') {
        this.mouse_down = false;

        if (this.dragableBoundaryNumber > -1 && this.dragableBoundaryNumber < this.transcrService.segments.length) {
          // some boundary dragged
          const segment = this.transcrService.segments.get(this.dragableBoundaryNumber);
          segment.time.samples = this.audioTCalculator.absXChunktoSamples(absX, this.Chunk);
          this.transcrService.segments.sort();
        } else {
          // set selection
          this.selection.end = new AudioTime(absXInTime, this.audio.samplerate);
          this.Selection.checkSelection();
          this.current = this.selection.start.clone();
          this.PlayCursor.changeSamples(this.current.samples, this.audioTCalculator, this.Chunk);
        }

        this.dragableBoundaryNumber = -1;
        this.overboundary = false;
      }

      // call function which was set by parameter
      callback();
    }
  }

  /**
   *
   * @param x
   * @param y
   * @returns {any}
   */
  public getLineByMousePosition(x, y): Line {
    for (let i = 0; i < this.Lines.length; i++) {
      if (this.Lines[i].mouseIn(x, y)) {
        return this.Lines[i];
      }
    }
    return null;
  }

  /**
   * addSegment() adds a boundary to the list of segments or removes the segment
   * @returns {any}
   */
  public addSegment(): { type: string, seg_num: number, msg: { type: string, text: string } } {
    let i = 0;
    const line = this.last_line;
    this.audioTCalculator.audio_px_width = this.audio_px_w;

    if (line && this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly) {
      const absXTime = (!this.audio.audioplaying) ? this.mousecursor.timePos.samples : this.PlayCursor.time_pos.samples;
      let b_width_time = this.audioTCalculator.absXtoSamples2(this.Settings.boundaries.width * 2, this.Chunk);
      b_width_time = Math.round(b_width_time);

      if (this.transcrService.segments.length > 0) {
        for (i = 0; i < this.transcrService.segments.length; i++) {
          if ((this.transcrService.segments.get(i).time.samples >= absXTime - b_width_time
            && this.transcrService.segments.get(i).time.samples <= absXTime + b_width_time)
            && this.transcrService.segments.get(i).time.samples !== this.audio.duration.samples
          ) {
            const seg_after = (i < this.transcrService.segments.length - 1) ? this.transcrService.segments.get(i + 1) : null;
            if ((this.transcrService.segments.get(i).transcript === '' || this.transcrService.segments.get(i).transcript === 'P')
              && (seg_after == null || seg_after.transcript === '' || seg_after.transcript === 'P')) {
              this.transcrService.segments.removeByIndex(i);

              return {
                type: 'remove',
                seg_num: i,
                msg: {
                  type: 'success',
                  text: ''
                }
              };
            } else {
              return {
                type: 'remove',
                seg_num: i,
                msg: {
                  type: 'error',
                  text: this.langService.instant('boundary cannot delete')
                }
              };
            }
          }
        }
      }

      const selection: number = Math.abs(this.selection.end.samples - this.selection.start.samples);

      if (selection > 0) {
        // some part selected
        const segm1 = this.transcrService.segments.BetweenWhichSegment(this.selection.start.samples);
        const segm2 = this.transcrService.segments.BetweenWhichSegment(this.selection.end.samples);

        if (segm1 == null && segm2 == null || (segm1 === segm2 || (segm1.transcript === '' && segm2.transcript === ''))) {
          if (this.selection.start.samples > 0) {
            // prevent setting boundary if first sample selected
            this.transcrService.segments.add(this.selection.start.samples);
          }
          this.transcrService.segments.add(this.selection.end.samples);
          return {
            type: 'add',
            seg_num: i,
            msg: null
          };
        } else {
          return {
            type: 'add',
            seg_num: i,
            msg: {
              type: 'error',
              text: this.langService.instant('boundary cannot set')
            }
          };
        }
      } else if (selection === 0) {
        const segment = this.transcrService.segments.BetweenWhichSegment(Math.round(absXTime));
        if (segment == null || (segment.transcript === ''
          || segment.transcript === 'P')) {
          this.transcrService.segments.add(Math.round(absXTime));
          return {
            type: 'add',
            seg_num: -1,
            msg: {
              type: 'success',
              text: ''
            }
          };
        } else {
          return {
            type: 'add',
            seg_num: i,
            msg: {
              type: 'error',
              text: this.langService.instant('boundary cannot set')
            }
          };
        }
      }
    }
    return null;
  }

  /**
   * get selection of segment
   * @returns AVSelection
   */
  public getSegmentSelection(position_samples: number): AVSelection {
    // complex decision needed because there are no segments at position 0 and the end of the file
    let result = null;
    const segments = this.transcrService.segments;
    const length = this.transcrService.segments.length;

    if (length > 0) {
      if (position_samples < segments.get(0).time.samples) {
        // select in first Boundary
        result = new AVSelection(new AudioTime(0, this.audio.samplerate), segments.get(0).time);
      } else if (position_samples > segments.get(segments.length - 1).time.samples) {
        // select in first Boundary
        const seg = segments.get(segments.length - 1).time.clone();
        result = new AVSelection(seg, this.audio.duration);
      } else {
        for (let i = 1; i < length; i++) {
          if (position_samples > segments.get(i - 1).time.samples
            && position_samples < segments.get(i).time.samples) {
            const seg1 = segments.get(i - 1).time;
            const seg2 = segments.get(i).time;
            result = new AVSelection(seg1, seg2);
            return result;
          }
        }
      }
    }
    return result;
  }

  /**
   * get selection of an sample relative to its position and width
   * @param line
   * @param start_samples
   * @param end_samples
   * @param innerWidth
   * @returns {{start: number, end: number}}
   */
  public getRelativeSelectionByLine(line: Line, start_samples: number,
                                    end_samples: number, innerWidth: number): { start: number, end: number } {
    const selection = this.selection;

    if (selection) {
      if (!line) {
        throw new Error('line null');
      }
      const absX = line.number * innerWidth;
      const absEnd = absX + line.Size.width;
      const SelAbsStart = this.audioTCalculator.samplestoAbsX(start_samples - this.Chunk.time.start.samples);
      const SelAbsEnd = this.audioTCalculator.samplestoAbsX(end_samples - this.Chunk.time.start.samples);

      const result = {
        start: SelAbsStart,
        end: SelAbsEnd
      };

      // is some seletion in line?
      if (this.Lines.length > 0) {
        if (SelAbsEnd > -1 && SelAbsEnd >= absX) {
          if (SelAbsStart > -1) {
            // check start selection
            if (SelAbsStart >= absX) {
              result.start = SelAbsStart - (line.number * innerWidth);
            } else {
              result.start = 0;
            }
          } else {
            result.start = 0;
          }

          if (SelAbsStart <= absEnd) {
            // check end selection
            if (SelAbsEnd > absEnd) {
              result.end = innerWidth;
            } else if (SelAbsEnd <= absEnd) {
              result.end = SelAbsEnd - (line.number * innerWidth);
            }
            return result;
          } else {
            return {start: -3, end: -1};
          }
        } else {
          return {start: -1 * SelAbsStart, end: -1 * SelAbsEnd};
        }
      }
    }
    return {start: -4, end: -1};
  }

  /**
   * updates all lines of audioviewer: the number of lines and their sizes
   * @param innerWidth
   */
  public updateLines(innerWidth: number) {
    if (this.Settings.multi_line) {
      const lines = Math.ceil(this.audio_px_w / innerWidth);
      let rest_width = Number(this.audio_px_w);

      if (lines < this.Lines.length) {
        // too many lines, delete
        this.Lines.splice(lines - 1, (this.Lines.length - lines));
      } else if (lines > this.Lines.length) {
        // too few lines, add new ones
        for (let i = 0; i < lines - this.Lines.length; i++) {
          this.addLine(i, 0, this.Settings.height);
        }
      }

      for (let i = 0; i < lines; i++) {
        const w = (rest_width > innerWidth) ? innerWidth : rest_width;

        const line = this.Lines[i];
        if (line) {
          line.number = i;

          line.Size = {
            width: Number(w),
            height: Number(line.Size.height)
          };

          if (i > 0) {
            line.Pos = {
              x: Number(this.Lines[i - 1].Pos.x),
              y: Number(this.Lines[i - 1].Pos.y + this.Lines[i - 1].Size.height + this.Settings.margin.bottom)
            };
          } else {
            line.Pos = {
              x: this.Settings.margin.left,
              y: this.Settings.margin.right
            };
          }
        } else {
          this.addLine(i, w, this.Settings.height);
        }

        rest_width = rest_width - innerWidth;
      }
    } else {
      this.audio_px_w = innerWidth;
      const w = innerWidth;

      const line = this.Lines[0];
      if (line) {
        line.number = 0;
        line.Size = {
          width: w,
          height: this.Settings.height
        };

      } else {
        this.addLine(0, w, this.Settings.height);
      }
    }
  }


  /**
   * get Line by absolute width of the audio sample
   * @param absX
   * @param innerWidth
   * @returns Line
   */
  getLineByAbsX(absX, innerWidth): Line {
    const line_num = Math.floor(absX / innerWidth);
    if (this.Lines[line_num]) {
      return this.Lines[line_num];
    }

    return null;
  };

  /**
   * add line zu the list of lines
   * @param line_num
   * @param w
   * @param h
   */
  addLine(line_num: number, w: number, h: number) {
    const size = {
      height: h,
      width: w
    };

    const position = {
      x: this.Settings.margin.left,
      y: this.Settings.margin.top
    };

    // get new y coordinate
    for (let i = 0; i < this.Lines.length; i++) {
      position.y += this.Lines[i].Size.height + this.Settings.margin.bottom;
    }

    const line_obj = new Line(line_num, size, position);
    this.Lines.push(line_obj);
  }

  /**
   * get boundary number by absolute x position
   * @param absX
   * @returns {number}
   */
  getBoundaryNumber(absX: number): number {
    // last boundary may not be returned!
    for (let i = 0; i < this.transcrService.segments.length - 1; i++) {
      const segment = this.transcrService.segments.get(i);
      const segAbsX = this.audioTCalculator.samplestoAbsX(segment.time.samples - this.Chunk.time.start.samples);
      let next_unblocked = true;
      if (i < this.transcrService.segments.length - 1) {
        const next_segment = this.transcrService.segments.get(i + 1);
        if (next_segment.transcript !== '' && next_segment.transcript !== 'P') {
          next_unblocked = false;
        }
      }
      if (segAbsX >= absX - this.Settings.boundaries.width / 2
        && segAbsX <= absX + this.Settings.boundaries.width / 2
        && (segment.transcript === '' || segment.transcript === 'P')
        && next_unblocked
      ) {
        return i;
      }
    }
    return -1;
  }

  /**
   * move cursor to one direction and x samples
   * @param direction
   * @param samples
   */
  public moveCursor(direction: string, samples: number) {
    const line = this.mousecursor.line;
    if (samples > 0) {
      if ((direction === 'left' || direction === 'right') &&
        ((this.mousecursor.timePos.samples >= this.Chunk.time.start.samples + samples && direction === 'left') ||
          (this.mousecursor.timePos.samples <= this.Chunk.time.end.samples - samples && direction === 'right')
        )) {

        if (direction === 'left') {
          if (this.mousecursor.timePos.samples >= this.Chunk.time.start.samples + samples) {
            this.mousecursor.timePos.samples -= samples;
            const rel_samples = this.mousecursor.timePos.samples - this.Chunk.time.start.samples;
            const absx = this.audioTCalculator.samplestoAbsX(rel_samples, this.Chunk.time.duration);
            this.mousecursor.relPos.x = absx % line.Size.width;
            this.mousecursor.line = this.getLineByAbsX(absx, line.Size.width);
            this.last_line = this.mousecursor.line;
          }
        } else if (direction === 'right') {
          if (this.mousecursor.timePos.samples <= this.Chunk.time.end.samples - samples) {
            this.mousecursor.timePos.samples += samples;
            const rel_samples = this.mousecursor.timePos.samples - this.Chunk.time.start.samples;
            const absx = this.audioTCalculator.samplestoAbsX(rel_samples, this.Chunk.time.duration);
            this.mousecursor.relPos.x = absx % line.Size.width;
            this.mousecursor.line = this.getLineByAbsX(absx, line.Size.width);
            this.last_line = this.mousecursor.line;
          }
        }
      }
    } else {
      throw new Error('can not move cursor by given samples. Number of samples less than 0.');
    }
  }

  /**
   * destroy this audioviewer object
   */
  public destroy() {
    this.subscrmanager.destroy();
  }

  onKeyUp = (event) => {
    this.shift_pressed = false;
  }

  /**
   * validate audioviewer config
   */
  private validateConfig() {
    const validator: AudioviewerConfigValidator = new AudioviewerConfigValidator();
    const validation = validator.validateObject(this._settings);
    if (!validation.success) {
      throw validation.error;
    }

  }

  /**
   * initialize settings
   */
  public initializeSettings() {
    this._settings = new AudioviewerConfig();
    this._settings = this._settings.Settings;
    this.validateConfig();
  }

  public refresh() {
    this.computeDisplayData(this.AudioPxWidth / 2, this.Settings.height, this.channel);
  }
}
