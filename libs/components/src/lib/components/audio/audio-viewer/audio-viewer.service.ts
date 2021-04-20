import {Injectable} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {PlayCursor} from '../../../obj/play-cursor';
import {AudioviewerConfig} from './audio-viewer.config';
import {AudioChunk, AudioManager, AudioSelection, AudioTimeCalculator, PlayBackStatus, SampleUnit} from '@octra/media';
import {isUnset, MultiThreadingService, SubscriptionManager, TsWorkerJob} from '@octra/utilities';
import {ASRQueueItemType, Level} from '@octra/annotation';

@Injectable({
  providedIn: 'root'
})
export class AudioViewerService {
  public audioTCalculator: AudioTimeCalculator;
  public overboundary = false;
  public shiftPressed = false;
  public breakMarker: any;
  public channelInitialized = new Subject<void>();
  protected mouseClickPos: SampleUnit = null;
  protected playcursor: PlayCursor = null;

  // AUDIO
  protected audioPxW = 0;
  protected hZoom = 0;
  protected audioChunk: AudioChunk;
  private subscrManager: SubscriptionManager<Subscription> = new SubscriptionManager<Subscription>();

  private _currentTranscriptionLevel: Level;

  get currentTranscriptionLevel(): Level {
    return this._currentTranscriptionLevel;
  }

  private _drawnSelection: AudioSelection;

  get drawnSelection(): AudioSelection {
    return this._drawnSelection;
  }

  set drawnSelection(value: AudioSelection) {
    this._drawnSelection = value;
  }

  // MOUSE
  private _mouseDown = false;

  get mouseDown(): boolean {
    return this._mouseDown;
  }

  private _mouseCursor: SampleUnit;

  get mouseCursor(): SampleUnit {
    return this._mouseCursor;
  }

  private _innerWidth: number;

  get innerWidth(): number {
    return this._innerWidth;
  }

  get AudioPxWidth(): number {
    return this.audioPxW;
  }

  get MouseClickPos(): SampleUnit {
    return this.mouseClickPos;
  }

  set MouseClickPos(mouseClickPos: SampleUnit) {
    this.mouseClickPos = mouseClickPos;
  }

  // PlayCursor in absX
  get PlayCursor(): PlayCursor {
    return this.playcursor;
  }

  set PlayCursor(playcursor: PlayCursor) {
    this.playcursor = playcursor;
  }

  private _dragableBoundaryNumber = -1;

  get dragableBoundaryNumber(): number {
    return this._dragableBoundaryNumber;
  }

  set dragableBoundaryNumber(value: number) {
    this._dragableBoundaryNumber = value;
  }

  private _zoomY = 1;

  get zoomY(): number {
    return this._zoomY;
  }

  set zoomY(value: number) {
    this._zoomY = value;
  }

  private _settings = new AudioviewerConfig();

  get settings(): AudioviewerConfig {
    return this._settings;
  }

  set settings(value: AudioviewerConfig) {
    this._settings = value;
  }

  private _zoomX = 1;

  get zoomX(): number {
    return this._zoomX;
  }

  private _minmaxarray: number[] = [];

  get minmaxarray(): number[] {
    return this._minmaxarray;
  }

  protected get audioManager(): AudioManager {
    return this.audioChunk.audioManager;
  }

  constructor(private multiThreadingService: MultiThreadingService) {
  }

  public initialize(innerWidth: number, audioChunk: AudioChunk, currentTranscriptionLevel: Level) {
    const optionalScrollbarWidth = (this.settings.scrollbar.enabled) ? this.settings.scrollbar.width : 0;

    this.audioChunk = audioChunk;
    this._innerWidth = innerWidth - optionalScrollbarWidth;
    this._currentTranscriptionLevel = currentTranscriptionLevel;
  }

  /**
   * saves mouse click position
   */
  public setMouseClickPosition(absX: number, lineNum: number, $event: Event): Promise<number> {
    return new Promise<number>((resolve) => {
      const absXInTime = this.audioTCalculator.absXChunktoSampleUnit(absX, this.audioChunk);

      if (!isUnset(absXInTime)) {
        this._mouseCursor = absXInTime.clone();

        if (!this.audioManager.isPlaying) {
          // same line
          // fix margin settings
          if ($event.type === 'mousedown' && !this.shiftPressed) {
            // no line defined or same line
            this.mouseClickPos = absXInTime.clone();

            this.audioChunk.startpos = this.mouseClickPos.clone();
            this.audioChunk.selection.start = absXInTime.clone();
            this.audioChunk.selection.end = absXInTime.clone();
            this._drawnSelection = this.audioChunk.selection.clone();

            if (this._dragableBoundaryNumber > -1) {
              const segmentBefore = (this._dragableBoundaryNumber > 0)
                ? this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber - 1)
                : this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber);
              const segment = this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber);
              const segmentAfter = (this._dragableBoundaryNumber < this._currentTranscriptionLevel.segments.length - 1)
                ? this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber + 1)
                : this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber);

              if (segment.isBlockedBy === ASRQueueItemType.ASR || segmentBefore.isBlockedBy === ASRQueueItemType.ASR ||
                segmentAfter.isBlockedBy === ASRQueueItemType.ASR) {
                // prevent dragging boundary of blocked segment
                this._dragableBoundaryNumber = -1;
              }
            }
            this._mouseDown = true;
          } else if ($event.type === 'mouseup') {
            if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._dragableBoundaryNumber > -1 &&
              this._dragableBoundaryNumber < this._currentTranscriptionLevel.segments.length) {
              // some boundary dragged
              const segment = this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber);
              segment.time = this.audioTCalculator.absXChunktoSampleUnit(absX, this.audioChunk);
              this._currentTranscriptionLevel.segments.change(this._dragableBoundaryNumber, segment);
              this._currentTranscriptionLevel.segments.sort();
              this._dragableBoundaryNumber = -1;
            } else {
              // set selection
              this.audioChunk.selection.end = absXInTime.clone();
              this.audioChunk.selection.checkSelection();
              this._drawnSelection = this.audioChunk.selection.clone();

              // TODO check this!
              this.PlayCursor.changeSamples(this.audioChunk.absolutePlayposition.clone(), this.audioTCalculator, this.audioChunk);
            }

            this._dragableBoundaryNumber = -1;
            this.overboundary = false;
            this._mouseDown = false;
          }

          resolve(lineNum);
        } else if (this.audioManager.state === PlayBackStatus.PLAYING && ($event.type === 'mouseup')) {
          this.audioChunk.stopPlayback().then(() => {
            this.audioChunk.startpos = absXInTime.clone();
            this.audioChunk.selection.end = absXInTime.clone();
            this._drawnSelection = this.audioChunk.selection.clone();
            this.PlayCursor.changeSamples(absXInTime, this.audioTCalculator, this.audioChunk);

            this._mouseDown = false;
            this._dragableBoundaryNumber = -1;
            resolve(lineNum);
          }).catch((error) => {
            console.error(error);
          });
        }
      }
    });
  }

  onKeyUp = () => {
    this.shiftPressed = false;
  }

  public updateLevel(level: Level) {
    this._currentTranscriptionLevel = level;
  }

  /**
   * destroy this audioviewer object
   */
  public destroy() {
    this.subscrManager.destroy();
  }

  /**
   * initialize settings
   */
  public initializeSettings() {
    if (this._settings.multiLine) {
      this.audioPxW = this.audioManager.ressource.info.duration.seconds * this._settings.pixelPerSec;
      this.audioPxW = (this.audioPxW < this._innerWidth) ? this._innerWidth : this.AudioPxWidth;
    } else {
      this.audioPxW = this._innerWidth;
    }
    this.audioPxW = Math.round(this.audioPxW);

    if (this.AudioPxWidth > 0) {
      // initialize the default values
      this.audioTCalculator = new AudioTimeCalculator(this.audioChunk.time.duration, this.AudioPxWidth);
      this.MouseClickPos = this.audioManager.createSampleUnit(0);
      this._mouseCursor = this.audioManager.createSampleUnit(0);
      this.PlayCursor = new PlayCursor(0, new SampleUnit(0, this.audioChunk.sampleRate), this._innerWidth);
      this._drawnSelection = this.audioChunk.selection.clone();
      this._drawnSelection.end = this.drawnSelection.start.clone();
    } else {
      return new Promise<void>((resolve) => {
        console.error('audio px is 0.');
        resolve();
      });
    }

    return this.afterChannelInititialized();
  }

  public refreshComputedData(): Promise<any> {
    return new Promise<void>(
      (resolve, reject) => {
        try {
          this.computeWholeDisplayData(this.AudioPxWidth / 2, this._settings.lineheight, this.audioManager.channel,
            {
              start: this.audioChunk.time.start.samples / this.audioManager.channelDataFactor,
              end: this.audioChunk.time.end.samples / this.audioManager.channelDataFactor
            }).then((result) => {
            this._minmaxarray = result;

            resolve();
          }).catch((error) => {
            reject(error);
          });
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
  computeWholeDisplayData(width: number, height: number, cha: Float32Array,
                          _interval: { start: number; end: number; }): Promise<number[]> {
    return new Promise<number[]>((resolve, reject) => {
      const promises = [];

      const numberOfPieces = 8;

      const xZoom = ((_interval.end - _interval.start) / width);

      let piece = Math.floor(width / numberOfPieces);
      const samplePiece = Math.floor((_interval.end - _interval.start) / numberOfPieces);

      for (let i = 1; i <= numberOfPieces; i++) {

        const start = _interval.start + (i - 1) * samplePiece;
        let end = start + samplePiece;
        if (i === numberOfPieces) {
          // make sure to fit whole width
          piece = Math.round(width - (piece * (numberOfPieces - 1)));
          end = Math.ceil(_interval.end);
        }
        const tsJob = new TsWorkerJob(this.computeDisplayData, [piece, height, cha.slice(start, end), {
          start,
          end
        }, this._settings.roundValues, xZoom]);

        promises.push(this.multiThreadingService.run(tsJob));
      }

      Promise.all(promises).then((values: number[][]) => {
        let result = [];
        for (const value of values) {
          result = result.concat(value);
        }

        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * get Line by absolute width of the audio sample
   */
  getPlayCursorPositionOfLineByAbsX(absX): {
    x: number,
    y: number
  } {
    const lineNum = Math.floor(absX / this._innerWidth);
    let x = this.settings.margin.left - this.settings.playcursor.width / 2 + absX - lineNum * this._innerWidth;
    x = (isNaN(x)) ? 0 : x;
    let y = lineNum * (this._settings.lineheight + this.settings.margin.top);
    y = (isNaN(y)) ? 0 : y;

    return {x, y};
  }

  /**
   * get selection of an sample relative to its position and width
   */
  public getRelativeSelectionByLine(lineNum: number, lineWidth: number, startSamples: SampleUnit,
                                    endSamples: SampleUnit, innerWidth: number): { start: number, end: number } {
    const absX = lineNum * innerWidth;
    const absEnd = absX + lineWidth;
    const selAbsStart = this.audioTCalculator.samplestoAbsX(startSamples.sub(this.audioChunk.time.start));
    const selAbsEnd = this.audioTCalculator.samplestoAbsX(endSamples.sub(this.audioChunk.time.start));

    const result = {
      start: selAbsStart,
      end: selAbsEnd
    };

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
          result.end = selAbsEnd - (lineNum * innerWidth);
        }
        if (result.start > result.end) {
          const tmp = result.start;
          result.start = result.end;
          result.end = tmp;
        }
        return result;
      }
    }
    return {start: -3, end: -1};
  }

  /**
   * save mouse position for further processing
   */
  public setMouseMovePosition(absX: number) {
    let absXTime = this.audioTCalculator.absXChunktoSampleUnit(absX, this.audioChunk);

    if (absXTime !== null) {
      this._mouseCursor = absXTime.clone();

      if (this.mouseDown && this._dragableBoundaryNumber < 0) {
        // mouse down, nothing dragged
        this.audioChunk.selection.end = absXTime.clone();
        this._drawnSelection = this.audioChunk.selection.clone();
      } else if (this.settings.boundaries.enabled && this.mouseDown && this._dragableBoundaryNumber > -1) {
        // mouse down something dragged
        const segment = this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber).clone();
        const absXSeconds = absXTime.seconds;

        // prevent overwriting another boundary
        const segmentBefore = (this._dragableBoundaryNumber > 0)
          ? this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber - 1) : null;
        const segmentAfter = (this._dragableBoundaryNumber < this._currentTranscriptionLevel.segments.length - 1)
          ? this._currentTranscriptionLevel.segments.get(this._dragableBoundaryNumber + 1) : null;
        if (!(segmentBefore === null || segmentBefore === undefined)) {
          // check segment boundary before this segment
          if (absXSeconds < segmentBefore.time.seconds + 0.02) {
            absXTime = this.audioManager.createSampleUnit(
              segmentBefore.time.samples + Math.round((0.02) * this.audioManager.ressource.info.sampleRate)
            );
          }
        }
        if (!(segmentAfter === null || segmentAfter === undefined)) {
          // check segment boundary after this segment
          if (absXSeconds > segmentAfter.time.seconds - 0.02) {
            absXTime = this.audioManager.createSampleUnit(
              segmentAfter.time.samples - Math.round((0.02) * this.audioManager.ressource.info.sampleRate)
            );
          }
        }

        segment.time = absXTime.clone();
        this._currentTranscriptionLevel.segments.change(this._dragableBoundaryNumber, segment);
        this._currentTranscriptionLevel.segments.sort();
        // dragableBoundaryTemp = this.getBoundaryNumber(absX);
        // this._dragableBoundaryNumber = dragableBoundaryTemp;
      } else {
        this._mouseDown = false;
      }

      // set if boundary was dragged
      // this.overboundary = (dragableBoundaryTemp > -1);
    }
  }

  /**
   * addSegment() adds a boundary to the list of segments or removes the segment
   */
  public addSegment(): { type: string, seg_samples: number, seg_ID: number, msg: { type: string, text: string } } {
    let i = 0;
    this.audioTCalculator.audioPxWidth = this.audioPxW;

    if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly) {
      const absXTime = (!this.audioChunk.isPlaying)
        ? this._mouseCursor.samples : this.audioChunk.absolutePlayposition.samples;
      let bWidthTime = this.audioTCalculator.absXtoSamples2(this.settings.boundaries.width * 2, this.audioChunk);
      bWidthTime = Math.round(bWidthTime);

      if (this._currentTranscriptionLevel.segments.length > 0 && !this.audioChunk.isPlaying) {
        for (i = 0; i < this._currentTranscriptionLevel.segments.length; i++) {
          const segment = this._currentTranscriptionLevel.segments.get(i);
          if ((segment.time.samples >= absXTime - bWidthTime
            && segment.time.samples <= absXTime + bWidthTime)
            && segment.time.samples !== this.audioManager.ressource.info.duration.samples
          ) {

            const segSamples = segment.time.samples;
            this._currentTranscriptionLevel.segments.removeByIndex(i, this.breakMarker.code);

            return {
              type: 'remove',
              seg_samples: segSamples,
              seg_ID: segment.id,
              msg: {
                type: 'success',
                text: ''
              }
            };
          }
        }
      }

      const selection: number = !isUnset(this._drawnSelection) ? this._drawnSelection.length : 0;

      if (selection > 0 && !isUnset(this._drawnSelection) && absXTime >= this._drawnSelection.start.samples
        && absXTime <= this._drawnSelection.end.samples) {
        // some part selected
        const segm1 = this._currentTranscriptionLevel.segments.BetweenWhichSegment(this._drawnSelection.start.samples);
        const segm2 = this._currentTranscriptionLevel.segments.BetweenWhichSegment(this._drawnSelection.end.samples);

        if (segm1 === null && segm2 === null || (segm1 === segm2 || (segm1.transcript === '' && segm2.transcript === ''))) {
          if (this.drawnSelection.start.samples > 0) {
            // prevent setting boundary if first sample selected
            this._currentTranscriptionLevel.addSegment(this._drawnSelection.start);
          }
          this._currentTranscriptionLevel.addSegment(this.drawnSelection.end);
          return {
            type: 'add',
            seg_samples: this.drawnSelection.start.samples,
            seg_ID: -1,
            msg: {
              type: 'success',
              text: ''
            }
          };
        } else {
          return {
            type: 'add',
            seg_samples: -1,
            seg_ID: -1,
            msg: {
              type: 'error',
              text: 'boundary cannot set'
            }
          };
        }
      } else {
        // no selection
        let segment = this._currentTranscriptionLevel.segments.BetweenWhichSegment(absXTime);
        let transcript = '';
        if (segment) {
          if (this._currentTranscriptionLevel.segments.length > 1) {
            // clear right
            transcript = segment.transcript;
            segment.transcript = '';
          } else {
            // clear left
            transcript = '';
          }
        }
        this._currentTranscriptionLevel.addSegment(this.audioManager.createSampleUnit(Math.round(absXTime)), '', transcript);

        return {
          type: 'add',
          seg_samples: absXTime,
          seg_ID: segment.id,
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
    const segments = this._currentTranscriptionLevel.segments;
    const length = this._currentTranscriptionLevel.segments.length;

    if (length > 0) {
      if (positionSamples < segments.get(0).time.samples) {
        // select in first Boundary
        result = new AudioSelection(this.audioManager.createSampleUnit(0), segments.get(0).time);
      } else if (positionSamples > segments.get(segments.length - 1).time.samples) {
        // select in first Boundary
        const seg = segments.get(segments.length - 1).time.clone();
        result = new AudioSelection(seg, this.audioManager.ressource.info.duration);
      } else {
        for (let i = 1; i < length; i++) {
          if (positionSamples > segments.get(i - 1).time.samples
            && positionSamples < segments.get(i).time.samples) {
            result = new AudioSelection(segments.get(i - 1).time, segments.get(i).time);
            return result;
          }
        }
      }
    }
    return result;
  }

  /**
   * move cursor to one direction and x samples
   */
  public moveCursor(direction: string, samples: number) {
    if (samples > 0) {
      const mouseCursorPosition = this._mouseCursor.samples;
      if ((direction === 'left' || direction === 'right') &&
        ((mouseCursorPosition >= this.audioChunk.time.start.samples + samples && direction === 'left')
          || (mouseCursorPosition <= this.audioChunk.time.end.samples - samples && direction === 'right')
        )) {
        if (direction === 'left') {
          if (this._mouseCursor.samples >= this.audioChunk.time.start.samples + samples) {
            this._mouseCursor = this._mouseCursor.sub(this.audioManager.createSampleUnit(samples));
          }
        } else if (direction === 'right') {
          if (this._mouseCursor.samples <= this.audioChunk.time.end.samples - samples) {
            this._mouseCursor = this._mouseCursor.add(this.audioManager.createSampleUnit(samples));
          }
        }
      }
    } else {
      throw new Error('can not move cursor by given samples. Number of samples less than 0.');
    }
  }

  private computeDisplayData: (args: any[]) => Promise<any> = (args: any[]) => {
    return new Promise<any>((resolve, reject) => {
      const width: number = args[0];
      const height: number = args[1];
      const channel: Float32Array = args[2];
      const interval: { start: number, end: number } = args[3];

      const roundValues: boolean = args[4];
      const xZoom = args[5];

      if (interval.start !== null && interval.end !== null && interval.end >= interval.start) {
        const minMaxArray = [];
        const len = interval.end - interval.start;

        let min = 0;
        let max = 0;
        let val = 0;
        let offset = 0;
        let maxIndex = 0;

        const yZoom = height / 2;

        for (let i = 0; i < width && offset < channel.length; i++) {
          offset = Math.round(i * xZoom);
          let floatValue = channel[offset];

          if (isNaN(floatValue)) {
            floatValue = 0;
          }

          min = floatValue;
          max = floatValue;

          if ((offset + xZoom) > len) {
            maxIndex = len;
          } else {
            maxIndex = Math.round(offset + xZoom);
          }

          for (let j = offset; j < maxIndex; j++) {
            floatValue = channel[j];

            val = floatValue;
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

        args[2] = null;
        resolve(minMaxArray);
      } else {
        reject('interval.end is less than interval.start');
      }
    });
  }

  private calculateZoom(height: number, width: number, minmaxarray: number[]) {
    if (this._settings.justifySignalHeight) {
      // justify height to maximum top border
      let maxZoomX = 0;
      let maxZoomY = 0;
      const timeLineHeight = (this._settings.timeline.enabled) ? this._settings.timeline.height : 0;
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
  private afterChannelInititialized(calculateZoom: boolean = true): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.refreshComputedData()
        .then(() => {
          if (calculateZoom) {
            this.calculateZoom(this._settings.lineheight, this.AudioPxWidth, this._minmaxarray);
          }
          this.audioChunk.absolutePlayposition = this.audioChunk.time.start.clone();
          this.channelInitialized.next();
          this.channelInitialized.complete();
          resolve();
        })
        .catch((err) => {
          console.error(err);
          this.channelInitialized.error(err);
          reject(err);
        });
    });
  }
}
