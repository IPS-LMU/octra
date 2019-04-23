import {Injectable} from '@angular/core';

import {TranslateService} from '@ngx-translate/core';
import {AudioviewerComponent} from './audioviewer.component';
import {AudioviewerConfig} from './audioviewer.config';
import {Interval, Position, Rectangle, Size} from '../../../objects';
import {AudioComponentService} from '../../../service';
import {AudioChunk, AudioSelection, AudioTimeCalculator, BrowserAudioTime} from '../../../obj/media/audio';
import {AVMousePos, Line, PlayCursor} from '../../../obj';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';
import {AudioService, KeymappingService, TranscriptionService} from '../../../../core/shared/service';
import {PlayBackState} from '../../../obj/media';
import {TaskManager} from '../../../../core/obj/TaskManager';
import {isNullOrUndefined} from '../../../../core/shared/Functions';


@Injectable()
export class AudioviewerService extends AudioComponentService {

  get LinesArray(): Line[] {
    return this.lines;
  }

  get Mousecursor(): AVMousePos {
    return this.mousecursor;
  }

  set Mousecursor(newPos: AVMousePos) {
    this.mousecursor = newPos;
  }

  get LastLine(): Line {
    return this.lastLine;
  }

  set LastLine(line: Line) {
    this.lastLine = line;
  }

  get Settings(): AudioviewerConfig {
    return this._settings;
  }

  set Settings(value: AudioviewerConfig) {
    this._settings = value;
  }

  get dragableBoundaryNumber(): number {
    return this._dragableBoundaryNumber;
  }

  get zoomY(): number {
    return this._zoomY;
  }

  set zoomY(value: number) {
    this._zoomY = value;
  }

  get zoomX(): number {
    return this._zoomX;
  }

  // AUDIO

  get minmaxarray(): number[] {
    return this._minmaxarray;
  }

  get drawnselection(): AudioSelection {
    return this._drawnselection;
  }

  set drawnselection(value: AudioSelection) {
    this._drawnselection = value;
  }

  get realRect(): Rectangle {
    return this._realRect;
  }

  get viewRect(): Rectangle {
    return this._viewRect;
  }

  get visibleLines(): Interval {
    return this._visibleLines;
  }

  constructor(protected audio: AudioService,
              protected transcrService: TranscriptionService,
              private keyMap: KeymappingService,
              private langService: TranslateService) {
    super();

    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.keyMap.onkeyup.subscribe(this.onKeyUp));
  }

  public overboundary = false;
  public focused = false;
  public shiftPressed = false;
  private _settings: AudioviewerConfig;
  private subscrmanager: SubscriptionManager;
  // LINES
  private lines: Line[] = [];

  private _dragableBoundaryNumber = -1;

  private _zoomY = 1;

  private _zoomX = 1;

  private _minmaxarray: number[] = [];

  private _drawnselection: AudioSelection;

  private _realRect: Rectangle = new Rectangle(new Position(0, 0), new Size(0, 0));

  private _viewRect: Rectangle = new Rectangle(new Position(0, 0), new Size(0, 0));

  private tManager: TaskManager;
  private _visibleLines: Interval = new Interval(0, 0);
  onKeyUp = () => {
    this.shiftPressed = false;
  }

  /**
   * initializes audioviewer using inner width
   */
  public initialize(innerWidth: number, audiochunk: AudioChunk): Promise<void> {
    super.initialize(innerWidth, audiochunk);

    this.lines = [];

    if (this.Settings.multiLine) {
      this.AudioPxWidth = this.audiomanager.ressource.info.duration.browserSample.seconds * this.Settings.pixelPerSec;
      this.AudioPxWidth = (this.AudioPxWidth < innerWidth) ? innerWidth : this.AudioPxWidth;
    } else {
      this.AudioPxWidth = innerWidth;
    }

    if (this.AudioPxWidth > 0) {
      // initialize the default values
      this.audioTCalculator = new AudioTimeCalculator(this.audiomanager.ressource.info.samplerate,
        this.audiochunk.time.duration as BrowserAudioTime, this.AudioPxWidth);
      this.Mousecursor = new AVMousePos(0, 0, 0, this.audiomanager.createBrowserAudioTime(0));
      this.MouseClickPos = new AVMousePos(0, 0, 0, this.audiomanager.createBrowserAudioTime(0));
      this.PlayCursor = new PlayCursor(0, this.audiomanager.createBrowserAudioTime(0), innerWidth);
    } else {
      return new Promise<void>((resolve) => {
        console.error('audio px is 0.');
        resolve();
      });
    }

    this.tManager = new TaskManager([{
      name: 'compute',
      do(args) {
        let width = args[0];
        const height = args[1];
        const cha = args[2];
        const _interval = args[3];
        const roundValues = args[4];
        width = Math.floor(width);

        if (_interval.start !== null && _interval.end !== null && _interval.end >= _interval.start) {
          const minMaxArray = [];
          const len = _interval.end - _interval.start;

          let min = 0;
          let max = 0;
          let val = 0;
          let offset = 0;
          let maxindex = 0;

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

            if (roundValues) {
              minMaxArray.push(Math.round(min * yZoom));
              minMaxArray.push(Math.round(max * yZoom));
            } else {
              minMaxArray.push(min * yZoom);
              minMaxArray.push(max * yZoom);
            }
          }

          return minMaxArray;
        } else {
          throw new Error('interval.end is less than interval.start');
        }
      }
    }]);
    return this.afterChannelInititialized(innerWidth);
  }

  /**
   * save mouse position for further processing
   */
  public setMouseMovePosition(type: string, x: number, y: number, currLine: Line, innerWidth) {
    super.setMouseMovePosition(type, x, y, currLine, innerWidth);

    const absX = this.getAbsXByLine(currLine, x - currLine.Pos.x, innerWidth);
    let absXTime = this.audioTCalculator.absXChunktoSamples(absX, this.audiochunk);

    let dragableBoundaryTemp = this.getBoundaryNumber(absX);

    if (this.mouseDown && this._dragableBoundaryNumber < 0) {
      // mouse down, nothing dragged
      this.audiochunk.selection.end = this.audiomanager.createBrowserAudioTime(absXTime);
      this.drawnselection.end = this.audiochunk.selection.end.clone();
    } else if (this.mouseDown && this._dragableBoundaryNumber > -1) {
      // mouse down something dragged
      const segment = this.transcrService.currentlevel.segments.get(this._dragableBoundaryNumber).clone();
      const absXSeconds = (absXTime / this.audiomanager.ressource.info.samplerate);

      // prevent overwriting another boundary
      const segmentBefore = (this._dragableBoundaryNumber > 0)
        ? this.transcrService.currentlevel.segments.get(this._dragableBoundaryNumber - 1) : null;
      const segmentAfter = (this._dragableBoundaryNumber < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this._dragableBoundaryNumber + 1) : null;
      if (!(segmentBefore === null || segmentBefore === undefined)) {
        // check segment boundary before this segment
        if (absXSeconds < segmentBefore.time.browserSample.seconds + 0.02) {
          absXTime = segmentBefore.time.browserSample.value + Math.round((0.02) * this.audiomanager.ressource.info.samplerate);
        }
      }
      if (!(segmentAfter === null || segmentAfter === undefined)) {
        // check segment boundary after this segment
        if (absXSeconds > segmentAfter.time.browserSample.seconds - 0.02) {
          absXTime = segmentAfter.time.browserSample.value - Math.round((0.02) * this.audiomanager.ressource.info.samplerate);
        }
      }

      segment.time.browserSample.value = absXTime;
      this.transcrService.currentlevel.segments.change(this._dragableBoundaryNumber, segment);
      this.transcrService.currentlevel.segments.sort();
      dragableBoundaryTemp = this.getBoundaryNumber(absX);
      this._dragableBoundaryNumber = dragableBoundaryTemp;
    } else {
      this.mouseDown = false;
    }

    // set if boundary was dragged
    this.overboundary = (dragableBoundaryTemp > -1);
  }

  /**
   * saves mouse click position
   */
  public setMouseClickPosition(x: number, y: number, currLine: Line, $event: Event,
                               innerWidth: number, viewer: AudioviewerComponent): Promise<Line> {
    const promise = new Promise<Line>((resolve) => {
      super.setMouseClickPosition(x, y, currLine, $event, innerWidth);

      const absX = this.getAbsXByLine(currLine, x - currLine.Pos.x, innerWidth);
      const absXInTime = this.audioTCalculator.absXChunktoSamples(absX, this.audiochunk);

      if (!this.audiomanager.isPlaying) {
        if (this.lastLine === null || this.lastLine === currLine) {
          // same line
          // fix margin settings
          if ($event.type === 'mousedown' && !this.shiftPressed) {
            if (this.lastLine === null || this.lastLine.number === this.lastLine.number) {
              // no line defined or same line
              this.mouseClickPos.absX = absX;
              this.mouseClickPos.timePos = this.audiomanager.createBrowserAudioTime(absXInTime);
              this.mouseClickPos.line = currLine;

              this.audiochunk.startpos = this.mouseClickPos.timePos.clone();
              this._drawnselection.end = this.audiochunk.selection.start.clone();

              this._dragableBoundaryNumber = this.getBoundaryNumber(this.mouseClickPos.absX);
            }
            this.mouseDown = true;
          } else if ($event.type === 'mouseup') {
            if (this._dragableBoundaryNumber > -1 &&
              this._dragableBoundaryNumber < this.transcrService.currentlevel.segments.length) {
              // some boundary dragged
              const segment = this.transcrService.currentlevel.segments.get(this._dragableBoundaryNumber);
              segment.time.browserSample.value = this.audioTCalculator.absXChunktoSamples(absX, this.audiochunk);
              this.transcrService.currentlevel.segments.change(this._dragableBoundaryNumber, segment);
              this.transcrService.currentlevel.segments.sort();
            } else {
              // set selection
              this.audiochunk.selection.end = this.audiomanager.createBrowserAudioTime(absXInTime);

              this.audiochunk.selection.checkSelection();
              this._drawnselection = this.audiochunk.selection.clone();
              this.PlayCursor.changeSamples(this.audiochunk.playposition.browserSample.value, this.audioTCalculator, this.audiochunk);
            }

            this._dragableBoundaryNumber = -1;
            this.overboundary = false;
            this.mouseDown = false;
          }
        } else if ($event.type === 'mouseup') {
          if (this._dragableBoundaryNumber > -1 && this._dragableBoundaryNumber < this.transcrService.currentlevel.segments.length) {
            // some boundary dragged
            const segment = this.transcrService.currentlevel.segments.get(this._dragableBoundaryNumber);
            segment.time.browserSample.value = this.audioTCalculator.absXChunktoSamples(absX, this.audiochunk);
            this.transcrService.currentlevel.segments.sort();
          } else {
            // set selection
            if (!this.mouseDown) {
              // click only
              this.audiochunk.selection.end = this.audiochunk.selection.start.clone();
            } else {
              this.audiochunk.selection.end = this.audiomanager.createBrowserAudioTime(absXInTime);
            }
            this.audiochunk.selection.checkSelection();
            this.PlayCursor.changeSamples(this.audiochunk.playposition.browserSample.value, this.audioTCalculator, this.audiochunk);
          }

          this._dragableBoundaryNumber = -1;
          this.overboundary = false;
          this.mouseDown = false;
        }
      } else if (this.audiomanager.state === PlayBackState.PLAYING && ($event.type === 'mouseup')) {
        this.audiochunk.stopPlayback().then(() => {
          const time = this.audiomanager.createBrowserAudioTime(absXInTime);
          this.audiochunk.startpos = time;
          this.audiochunk.selection.end = time.clone();
          this.PlayCursor.changeSamples(absXInTime, this.audioTCalculator, this.audiochunk);
          viewer.drawSegments();
          viewer.drawCursor(this.Mousecursor.line);
          viewer.drawPlayCursorOnly(this.Mousecursor.line);
          viewer.startPlayback();
          this.mouseDown = false;
          this._dragableBoundaryNumber = -1;
        }).catch((error) => {
          console.error(error);
        });
      }

      resolve(this.mouseClickPos.line);
    });

    return promise;
  }

  public getLineByMousePosition(x, y): Line {
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].mouseIn(x, y)) {
        return this.lines[i];
      }
    }
    return null;
  }

  /**
   * addSegment() adds a boundary to the list of segments or removes the segment
   */
  public addSegment(): { type: string, seg_samples: number, msg: { type: string, text: string } } {
    let i = 0;
    const line = this.lastLine;
    this.audioTCalculator.audioPxWidth = this.audioPxW;

    if (!(line === null || line === undefined) && this.Settings.boundaries.enabled && !this.Settings.boundaries.readonly) {
      const absXTime = (!this.audiochunk.isPlaying)
        ? this.mousecursor.timePos.browserSample.value : this.audiochunk.playposition.browserSample.value;
      let bWidthTime = this.audioTCalculator.absXtoSamples2(this.Settings.boundaries.width * 2, this.audiochunk);
      bWidthTime = Math.round(bWidthTime);

      if (this.transcrService.currentlevel.segments.length > 0 && !this.audiochunk.isPlaying) {
        for (i = 0; i < this.transcrService.currentlevel.segments.length; i++) {
          const segment = this.transcrService.currentlevel.segments.get(i);
          if ((segment.time.browserSample.value >= absXTime - bWidthTime
            && segment.time.browserSample.value <= absXTime + bWidthTime)
            && segment.time.browserSample.value !== this.audiomanager.ressource.info.duration.browserSample.value
          ) {

            const segSamples = this.transcrService.currentlevel.segments.get(i).time.browserSample.value;
            this.transcrService.currentlevel.segments.removeByIndex(i, this.transcrService.break_marker.code);

            return {
              type: 'remove',
              seg_samples: segSamples,
              msg: {
                type: 'success',
                text: ''
              }
            };
          }
        }
      }

      const selection: number = !(this.drawnselection === null || this.drawnselection === undefined) ? this.drawnselection.length : 0;

      if (selection > 0 && absXTime >= this.drawnselection.start.browserSample.value
        && absXTime <= this.drawnselection.end.browserSample.value) {
        // some part selected
        const segm1 = this.transcrService.currentlevel.segments.BetweenWhichSegment(this.drawnselection.start.browserSample.value);
        const segm2 = this.transcrService.currentlevel.segments.BetweenWhichSegment(this.drawnselection.end.browserSample.value);

        if (segm1 === null && segm2 === null || (segm1 === segm2 || (segm1.transcript === '' && segm2.transcript === ''))) {
          if (this.drawnselection.start.browserSample.value > 0) {
            // prevent setting boundary if first sample selected
            this.transcrService.currentlevel.segments.add(this.drawnselection.start);
          }
          this.transcrService.currentlevel.segments.add(this.drawnselection.end);
          return {
            type: 'add',
            seg_samples: this.drawnselection.start.browserSample.value,
            msg: {
              type: 'success',
              text: ''
            }
          };
        } else {
          return {
            type: 'add',
            seg_samples: this.drawnselection.start.browserSample.value,
            msg: {
              type: 'error',
              text: this.langService.instant('boundary cannot set')
            }
          };
        }
      } else {
        // no selection
        let segment = this.transcrService.currentlevel.segments.BetweenWhichSegment(absXTime);
        const transcript = '';
        if (!isNullOrUndefined(segment)) {
          segment.transcript = '';
        }
        this.transcrService.currentlevel.segments.add(this.audiomanager.createBrowserAudioTime(Math.round(absXTime)));
        segment = this.transcrService.currentlevel.segments.BetweenWhichSegment(absXTime);
        segment.transcript = transcript;
        return {
          type: 'add',
          seg_samples: -1,
          msg: {
            type: 'success',
            text: ''
          }
        };
      }
    }
    return null;
  }

  /**
   * get selection of segment
   * @returns AudioSelection
   */
  public getSegmentSelection(positionSamples: number): AudioSelection {
    // complex decision needed because there are no segments at position 0 and the end of the file
    let result = null;
    const segments = this.transcrService.currentlevel.segments;
    const length = this.transcrService.currentlevel.segments.length;

    if (length > 0) {
      if (positionSamples < segments.get(0).time.browserSample.value) {
        // select in first Boundary
        result = new AudioSelection(this.audiomanager.createBrowserAudioTime(0), segments.get(0).time);
      } else if (positionSamples > segments.get(segments.length - 1).time.browserSample.value) {
        // select in first Boundary
        const seg = segments.get(segments.length - 1).time.clone();
        result = new AudioSelection(seg, this.audiomanager.ressource.info.duration);
      } else {
        for (let i = 1; i < length; i++) {
          if (positionSamples > segments.get(i - 1).time.browserSample.value
            && positionSamples < segments.get(i).time.browserSample.value) {
            const seg1 = segments.get(i - 1).time;
            const seg2 = segments.get(i).time;
            result = new AudioSelection(seg1, seg2);
            return result;
          }
        }
      }
    }
    return result;
  }

  /**
   * get selection of an sample relative to its position and width
   */
  public getRelativeSelectionByLine(line: Line, startSamples: number,
                                    endSamples: number, innerWidth: number): { start: number, end: number } {

    if (!(line === null || line === undefined)) {
      const absX = line.number * innerWidth;
      const absEnd = absX + line.Size.width;
      const selAbsStart = this.audioTCalculator.samplestoAbsX(startSamples - this.audiochunk.time.start.browserSample.value);
      const selAbsEnd = this.audioTCalculator.samplestoAbsX(endSamples - this.audiochunk.time.start.browserSample.value);

      const result = {
        start: selAbsStart,
        end: selAbsEnd
      };

      // is some seletion in line?
      if (this.lines.length > 0) {
        if (selAbsEnd > -1 && selAbsEnd >= absX) {
          if (selAbsStart > -1) {
            // check start selection
            if (selAbsStart >= absX) {
              result.start = selAbsStart - absX;
            } else {
              result.start = 0;
            }
          } else {
            result.start = 0;
          }

          if (selAbsStart <= absEnd) {
            // check end selection
            if (selAbsEnd > absEnd) {
              result.end = innerWidth;
            } else if (selAbsEnd <= absEnd) {
              result.end = selAbsEnd - (line.number * innerWidth);
            }
            return result;
          } else {
            return {start: -3, end: -1};
          }
        } else {
          return {start: -1 * selAbsStart, end: -1 * selAbsEnd};
        }
      }
    }
  }

  /**
   * updates all lines of audioviewer: the number of lines and their sizes
   */
  public updateLines(innerWidth: number) {
    if (this.Settings.multiLine) {
      const lines = Math.ceil(this.audioPxW / innerWidth);
      let restWidth = Number(this.audioPxW);

      if (lines < this.lines.length) {
        // too many lines, delete
        this.lines.splice(lines - 1, (this.lines.length - lines));
      } else if (lines > this.lines.length) {
        // too few lines, add new ones
        for (let i = 0; i < lines - this.lines.length; i++) {
          this.addLine(i, 0, this.Settings.lineheight);
        }
      }

      for (let i = 0; i < lines; i++) {
        const w = (restWidth > innerWidth) ? innerWidth : restWidth;

        const line = this.lines[i];
        if (line) {
          line.number = i;

          line.Size = {
            width: Number(w),
            height: Number(line.Size.height)
          };

          if (i > 0) {
            line.Pos = {
              x: Number(this.lines[i - 1].Pos.x),
              y: Number(this.lines[i - 1].Pos.y + this.lines[i - 1].Size.height + this.Settings.margin.bottom)
            };
          } else {
            line.Pos = {
              x: this.Settings.margin.left,
              y: this.Settings.margin.top
            };
          }
        } else {
          this.addLine(i, w, this.Settings.lineheight);
        }

        restWidth = restWidth - innerWidth;
      }
    } else {
      this.audioPxW = innerWidth;
      const w = innerWidth;

      const line = this.lines[0];
      if (!(line === null || line === undefined)) {
        line.number = 0;
        line.Size = {
          width: w,
          height: this.Settings.lineheight
        };
      } else {
        this.addLine(0, w, this.Settings.lineheight);
      }
    }
  }

  /**
   * get Line by absolute width of the audio sample
   */
  getLineByAbsX(absX, innerWidth): Line {
    const lineNum = Math.floor(absX / innerWidth);
    if (this.lines[lineNum]) {
      return this.lines[lineNum];
    }

    return null;
  }

  /**
   * add line zu the list of lines
   */
  addLine(lineNum: number, w: number, h: number) {
    const size = {
      height: h,
      width: w
    };

    const position = {
      x: this.Settings.margin.left,
      y: this.Settings.margin.top
    };

    position.y += (this.lines.length > lineNum - 1 && !(this.lines[lineNum - 1] === null
      || this.lines[lineNum - 1] === undefined)) ? this.lines[lineNum - 1].Pos.y : 0;
    const lineObj = new Line(lineNum, size, position);
    this.lines.push(lineObj);
  }

  /**
   * get boundary number by absolute x position
   */
  getBoundaryNumber(absX: number): number {
    // last boundary may not be returned!
    for (let i = 0; i < this.transcrService.currentlevel.segments.length - 1; i++) {
      const segment = this.transcrService.currentlevel.segments.get(i);
      const segAbsX = this.audioTCalculator.samplestoAbsX(segment.time.browserSample.value
        - this.audiochunk.time.start.browserSample.value);
      const nextUnblocked = true;

      /*
       if (i < this.transcrService.currentlevel.segments.length - 1) {
       const next_segment = this.transcrService.currentlevel.segments.get(i + 1);
       if (next_segment.transcript !== '' && next_segment.transcript !== this.transcrService.break_marker.code) {
       nextUnblocked = false;
       }
       }*/
      if (segAbsX >= absX - this.Settings.boundaries.width / 2
        && segAbsX <= absX + this.Settings.boundaries.width / 2
        // && (segment.transcript === '' || segment.transcript === this.transcrService.break_marker.code)
        && nextUnblocked
      ) {
        return i;
      }
    }
    return -1;
  }

  /**
   * move cursor to one direction and x samples
   */
  public moveCursor(direction: string, samples: number) {
    const line = this.mousecursor.line;
    if (samples > 0) {
      const mouseCursorPosition = this.mousecursor.timePos.browserSample.value;
      if ((direction === 'left' || direction === 'right') &&
        ((mouseCursorPosition >= this.audiochunk.time.start.browserSample.value + samples && direction === 'left')
          || (mouseCursorPosition <= this.audiochunk.time.end.browserSample.value - samples && direction === 'right')
        )) {
        if (direction === 'left') {
          if (this.mousecursor.timePos.browserSample.value >= this.audiochunk.time.start.browserSample.value + samples) {
            this.mousecursor.timePos.browserSample.value -= samples;
            const relSamples = this.mousecursor.timePos.browserSample.value - this.audiochunk.time.start.browserSample.value;
            const absx = this.audioTCalculator.samplestoAbsX(relSamples, this.audiochunk.time.duration as BrowserAudioTime);
            this.mousecursor.relPos.x = absx % line.Size.width;
            this.mousecursor.line = this.getLineByAbsX(absx, line.Size.width);
            this.lastLine = this.mousecursor.line;
          }
        } else if (direction === 'right') {
          if (this.mousecursor.timePos.browserSample.value <= this.audiochunk.time.end.browserSample.value - samples) {
            this.mousecursor.timePos.browserSample.value += samples;
            const relSamples = this.mousecursor.timePos.browserSample.value - this.audiochunk.time.start.browserSample.value;
            const absx = this.audioTCalculator.samplestoAbsX(relSamples, this.audiochunk.time.duration as BrowserAudioTime);
            this.mousecursor.relPos.x = absx % line.Size.width;
            this.mousecursor.line = this.getLineByAbsX(absx, line.Size.width);
            this.lastLine = this.mousecursor.line;
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

  /**
   * initialize settings
   */
  public initializeSettings() {
    this._settings = new AudioviewerConfig();
  }

  public refresh(): Promise<any> {
    return new Promise<void>(
      (resolve, reject) => {
        try {
          this._minmaxarray = this.computeDisplayData(this.AudioPxWidth / 2, this.Settings.lineheight, this.audiochunk.audiomanager.channel,
            {
              start: this.audiochunk.time.start.browserSample.value,
              end: this.audiochunk.time.end.browserSample.value
            });
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    );
  }

  /**
   * computeDisplayData() generates an array of min-max pairs representing the
   * audio signal. The values of the array are float in the range -1 .. 1.
   */
  computeDisplayData(width: number, height: number, cha: Float32Array, _interval: { start: number; end: number; }) {
    width = Math.floor(width);

    if (_interval.start !== null && _interval.end !== null && _interval.end >= _interval.start) {
      const minMaxArray = [];
      const len = _interval.end - _interval.start;

      let min = 0;
      let max = 0;
      let val = 0;
      let offset = 0;
      let maxIndex = 0;

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
          maxIndex = len;
        } else {
          maxIndex = Math.round(offset + xZoom);
        }

        for (let j = offset; j < maxIndex; j++) {
          val = cha[j];
          max = Math.max(max, val);
          min = Math.min(min, val);
        }

        if (this.Settings.roundValues) {
          minMaxArray.push(Math.round(min * yZoom));
          minMaxArray.push(Math.round(max * yZoom));
        } else {
          minMaxArray.push(min * yZoom);
          minMaxArray.push(max * yZoom);
        }
      }

      return minMaxArray;
    } else {
      throw new Error('interval.end is less than interval.start');
    }
  }

  private calculateZoom(height: number, width: number, minmaxarray: number[]) {
    if (this.Settings.justifySignalHeight) {
      // justify height to maximum top border
      let maxZoomX = 0;
      let maxZoomY = 0;
      const timeLineHeight = (this.Settings.timeline.enabled) ? this.Settings.timeline.height : 0;
      let maxZoomYMin = height / 2;
      const xMax = this.AudioPxWidth;

      // get_max_signal_length
      for (let i = 0; i <= xMax; i++) {
        maxZoomX = i;

        if (isNaN(minmaxarray[i])) {
          break;
        }
        maxZoomY = Math.max(maxZoomY, minmaxarray[i]);
        maxZoomYMin = Math.min(maxZoomYMin, minmaxarray[i]);
      }

      let rest = (height - timeLineHeight - (maxZoomY + Math.abs(maxZoomYMin)));
      rest = Math.floor(rest - 2);

      if (rest > 0) {
        this._zoomY = (rest / (maxZoomY + Math.abs(maxZoomYMin))) + 1;
        this._zoomY = Math.floor(this._zoomY * 10) / 10;
        this._zoomX = width / maxZoomX;
      }
    } else {
      this._zoomY = 1;
    }
  }

  /**
   * after Channel was initialzed
   */
  private afterChannelInititialized(innerWidth: number, calculateZoom: boolean = true): Promise<void> {
    return this.refresh()
      .then(() => {
        if (calculateZoom) {
          this.calculateZoom(this.Settings.lineheight, this.AudioPxWidth, this._minmaxarray);
        }

        this.audiochunk.playposition = this.audiochunk.time.start.clone() as BrowserAudioTime;
        this.updateLines(innerWidth);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
