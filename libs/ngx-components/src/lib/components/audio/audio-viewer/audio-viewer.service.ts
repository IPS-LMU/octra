import { EventEmitter, Injectable } from '@angular/core';
import { PlayCursor } from '../../../obj/play-cursor';
import { AudioviewerConfig } from './audio-viewer.config';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { SubscriptionManager } from '@octra/utilities';
import {
  AnnotationAnySegment,
  ASRContext,
  ASRQueueItemType,
  betweenWhichSegment,
  OctraAnnotation,
  OctraAnnotationAnyLevel,
  OctraAnnotationEvent,
  OctraAnnotationLink,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
  OItem,
  OLabel,
} from '@octra/annotation';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { MultiThreadingService } from '../../../multi-threading.service';
import {
  AudioChunk,
  AudioManager,
  AudioTimeCalculator,
  TsWorkerJob,
} from '@octra/web-media';

@Injectable({
  providedIn: 'root',
})
export class AudioViewerService {
  get boundaryDragging(): Subject<{
    status: 'started' | 'stopped' | 'dragging';
    id: number;
    shiftPressed?: boolean;
  }> {
    return this._boundaryDragging;
  }

  get currentLevel():
    | OctraAnnotationAnyLevel<OctraAnnotationSegment>
    | undefined {
    return this.annotation?.currentLevel;
  }

  public annotationChange = new EventEmitter<
    OctraAnnotation<ASRContext, OctraAnnotationSegment>
  >();
  public currentLevelChange = new EventEmitter<{
    type: 'change' | 'remove' | 'add';
    items: {
      index?: number;
      id?: number;
      instance?: AnnotationAnySegment;
    }[];
    removeOptions?: {
      silenceCode: string | undefined;
      mergeTranscripts: boolean;
    };
  }>();
  public audioTCalculator: AudioTimeCalculator | undefined;
  public overboundary = false;
  public shiftPressed = false;
  public silencePlaceholder?: string;
  public channelInitialized = new Subject<void>();
  protected mouseClickPos: SampleUnit | undefined;
  protected playcursor: PlayCursor | undefined;

  private _boundaryDragging: Subject<{
    status: 'started' | 'stopped' | 'dragging';
    id: number;
    shiftPressed?: boolean;
  }>;
  currentLevelID?: number;

  annotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
  tempAnnotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;

  // AUDIO
  protected audioPxW = 0;
  protected hZoom = 0;
  protected audioChunk: AudioChunk | undefined;
  private subscrManager: SubscriptionManager<Subscription> =
    new SubscriptionManager<Subscription>();

  private _drawnSelection: AudioSelection | undefined;

  get drawnSelection(): AudioSelection | undefined {
    return this._drawnSelection;
  }

  set drawnSelection(value: AudioSelection | undefined) {
    this._drawnSelection = value;
  }

  // MOUSE
  private _mouseDown = false;

  get mouseDown(): boolean {
    return this._mouseDown;
  }

  private _mouseCursor: SampleUnit | undefined;

  get mouseCursor(): SampleUnit | undefined {
    return this._mouseCursor;
  }

  private _innerWidth: number | undefined;

  get innerWidth(): number | undefined {
    if (this._innerWidth !== undefined) {
      return this._innerWidth;
    }
    return 0;
  }

  get AudioPxWidth(): number {
    return this.audioPxW;
  }

  get MouseClickPos(): SampleUnit | undefined {
    return this.mouseClickPos;
  }

  set MouseClickPos(mouseClickPos: SampleUnit | undefined) {
    this.mouseClickPos = mouseClickPos;
  }

  // PlayCursor in absX
  get PlayCursor(): PlayCursor | undefined {
    return this.playcursor;
  }

  set PlayCursor(playcursor: PlayCursor | undefined) {
    this.playcursor = playcursor;
  }

  private _dragableBoundaryID = -1;

  get dragableBoundaryID(): number {
    return this._dragableBoundaryID;
  }

  set dragableBoundaryID(value: number) {
    if (value > -1 && this._dragableBoundaryID === -1) {
      // started
      this.tempAnnotation = this.annotation;
      this._boundaryDragging.next({
        shiftPressed: this.shiftPressed,
        id: value,
        status: 'started',
      });
    }
    this._dragableBoundaryID = value;
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

  protected get audioManager(): AudioManager | undefined {
    return this.audioChunk?.audioManager;
  }

  public itemIDCounter = 1;
  public itemIDCounterChange = new EventEmitter<number>();

  public getNextItemID() {
    this.itemIDCounter++;
    this.itemIDCounterChange.emit(this.itemIDCounter);
    return this.itemIDCounter - 1;
  }

  constructor(private multiThreadingService: MultiThreadingService) {
    this._boundaryDragging = new Subject<{
      status: 'started' | 'stopped' | 'dragging';
      id: number;
      shiftPressed?: boolean;
    }>();
  }

  public initialize(innerWidth: number, audioChunk: AudioChunk) {
    const optionalScrollbarWidth = this.settings.scrollbar.enabled
      ? this.settings.scrollbar.width
      : 0;

    this.audioChunk = audioChunk;
    this._innerWidth = innerWidth - optionalScrollbarWidth;
  }

  /**
   * saves mouse click position
   */
  public setMouseClickPosition(
    absX: number,
    lineNum: number,
    $event: Event
  ): Promise<number> {
    return new Promise<number>((resolve) => {
      if (this.audioChunk !== undefined) {
        const absXInTime = this.audioTCalculator?.absXChunktoSampleUnit(
          absX,
          this.audioChunk
        );

        if (
          absXInTime !== undefined &&
          this.audioManager !== undefined &&
          this.audioChunk !== undefined &&
          this.annotation?.currentLevel !== undefined &&
          this.annotation.currentLevel.items.length > 0 &&
          this.audioTCalculator !== undefined &&
          this.PlayCursor !== undefined
        ) {
          this._mouseCursor = absXInTime.clone();

          if (!this.audioManager.isPlaying) {
            // same line
            // fix margin settings
            if ($event.type === 'mousedown') {
              // no line defined or same line
              this.mouseClickPos = absXInTime.clone();

              this.audioChunk.startpos = this.mouseClickPos.clone();
              this.audioChunk.selection.start = absXInTime.clone();
              this.audioChunk.selection.end = absXInTime.clone();
              if (!this.shiftPressed) {
                this._drawnSelection = this.audioChunk.selection.clone();
              }

              if (this._dragableBoundaryID > -1) {
                const currentLevel = this
                  .currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
                const index = this.annotation.currentLevel.items.findIndex(
                  (a) => a.id === this._dragableBoundaryID
                );

                const segmentBefore = currentLevel!.getLeftSibling(index);
                const segment = this.annotation.currentLevel.items[
                  index
                ] as OctraAnnotationSegment<ASRContext>;
                const segmentAfter = currentLevel!.getRightSibling(index);

                if (
                  segment?.context?.asr?.isBlockedBy === ASRQueueItemType.ASR ||
                  segmentBefore?.context?.asr?.isBlockedBy ===
                    ASRQueueItemType.ASR ||
                  segmentAfter?.context?.asr?.isBlockedBy ===
                    ASRQueueItemType.ASR
                ) {
                  // prevent dragging boundary of blocked segment
                  this._dragableBoundaryID = -1;
                }
              }
              this._mouseDown = true;
            } else if ($event.type === 'mouseup') {
              this.handleBoundaryDragging(absX, absXInTime, true);

              this.overboundary = false;
              this._mouseDown = false;

              this._boundaryDragging.next({
                shiftPressed: this.shiftPressed,
                id: this._dragableBoundaryID,
                status: 'stopped',
              });
              this._dragableBoundaryID = -1;
            }

            resolve(lineNum);
          } else if (
            this.audioManager.state === PlayBackStatus.PLAYING &&
            $event.type === 'mouseup'
          ) {
            this.audioChunk
              .stopPlayback()
              .then(() => {
                if (
                  this.audioChunk !== undefined &&
                  this.audioTCalculator !== undefined
                ) {
                  this.audioChunk.startpos = absXInTime.clone();
                  this.audioChunk.selection.end = absXInTime.clone();
                  this._drawnSelection = this.audioChunk.selection.clone();
                  this.PlayCursor?.changeSamples(
                    absXInTime,
                    this.audioTCalculator,
                    this.audioChunk
                  );

                  this._mouseDown = false;
                  this._dragableBoundaryID = -1;
                }

                resolve(lineNum);
              })
              .catch((error: any) => {
                console.error(error);
              });
          }
        }
      }
    });
  }

  handleBoundaryDragging(absX: number, absXInTime: SampleUnit, emit = false) {
    let annotation = this.tempAnnotation?.clone();
    const currentLevel =
      annotation?.currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
    const limitPadding = 500;

    const index = currentLevel?.items.findIndex(
      (a) => a.id === this._dragableBoundaryID
    );
    if (
      annotation &&
      currentLevel &&
      index !== undefined &&
      index > -1 &&
      this.audioTCalculator &&
      this.audioChunk &&
      this.audioManager &&
      this.PlayCursor
    ) {
      const draggedItem = currentLevel.items[index];

      if (
        this.settings.boundaries.enabled &&
        !this.settings.boundaries.readonly &&
        this._dragableBoundaryID > -1
      ) {
        // some boundary dragged
        const segment: OctraAnnotationSegment | undefined =
          draggedItem?.clone();

        if (segment) {
          if (!this.shiftPressed) {
            // move only this boundary
            const previousSegment: OctraAnnotationSegment | undefined =
              currentLevel.getLeftSibling(index)!;
            const nextSegment: OctraAnnotationSegment | undefined =
              currentLevel.getRightSibling(index)!;

            let newTime = this.audioTCalculator.absXChunktoSampleUnit(
              absX,
              this.audioChunk
            )!;

            if (
              previousSegment &&
              newTime.samples < previousSegment.time.samples + limitPadding
            ) {
              newTime = previousSegment.time.add(
                this.audioManager.createSampleUnit(limitPadding)
              );
            } else if (
              nextSegment &&
              newTime.samples > nextSegment.time.samples - limitPadding
            ) {
              newTime = nextSegment.time.sub(
                this.audioManager.createSampleUnit(limitPadding)
              );
            }

            segment.time = newTime;
            annotation.changeCurrentSegmentBySamplePosition(
              segment.time,
              segment
            );

            if (emit) {
              this.currentLevelChange.emit({
                type: 'change',
                items: [
                  {
                    instance: segment,
                  },
                ],
              });
              this.annotationChange.emit(annotation);
            }
          } else if (this.drawnSelection?.duration?.samples) {
            // move all segments with difference to left or right
            const oldSamplePosition = segment.time.samples;
            const newSamplePosition =
              this.audioTCalculator.absXChunktoSampleUnit(
                absX,
                this.audioChunk
              )?.samples;
            const diff = newSamplePosition! - oldSamplePosition;
            let changedItems: OctraAnnotationSegment[] = [];

            if (diff > 0) {
              // shift to right
              for (const currentLevelElement of (annotation.currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>)!
                .items) {
                if (
                  currentLevelElement.time.samples >= segment.time.samples &&
                  currentLevelElement.time.samples + diff <
                    this.drawnSelection.end!.samples
                ) {
                  const newItem = currentLevelElement.clone(
                    currentLevelElement.id
                  );
                  newItem.time = currentLevelElement.time.add(
                    this.audioManager.createSampleUnit(diff)
                  );
                  annotation = annotation.changeCurrentItemById(
                    currentLevelElement.id,
                    newItem
                  );
                  changedItems.push(newItem);
                }
              }
            } else {
              // shift to left
              for (const currentLevelElement of (annotation.currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>)!
                .items) {
                if (
                  currentLevelElement.time.samples <= segment.time.samples &&
                  currentLevelElement.time.samples + diff >
                    this.drawnSelection.start!.samples
                ) {
                  const newItem = currentLevelElement.clone(
                    currentLevelElement.id
                  );
                  newItem.time = currentLevelElement.time.add(
                    this.audioManager.createSampleUnit(diff)
                  );
                  annotation = annotation.changeCurrentItemById(
                    currentLevelElement.id,
                    newItem
                  );
                  changedItems.push(newItem);
                } else if (currentLevelElement.time.samples - diff < 0) {
                  changedItems = [];
                  break;
                }
              }
            }

            if (changedItems.length > 0 && emit) {
              this.currentLevelChange.emit({
                type: 'change',
                items: changedItems.map((a) => ({ instance: a })),
              });
              this.annotationChange.emit(annotation);
            }
          }
        }
        this.annotation = annotation;
      } else {
        // set selection
        this.audioChunk.selection.end = absXInTime.clone();
        this.audioChunk.selection.checkSelection();
        this._drawnSelection = this.audioChunk.selection.clone();

        this.PlayCursor.changeSamples(
          this.audioChunk.absolutePlayposition.clone(),
          this.audioTCalculator,
          this.audioChunk
        );
      }
    }
  }

  onKeyUp = () => {
    this.shiftPressed = false;
  };

  /**
   * destroy this audioviewer object
   */
  public destroy() {
    this.subscrManager.destroy();
  }

  /**
   * initialize settings
   */
  public initializeSettings = async () => {
    if (!this.audioManager) {
      throw new Error('Audiomanager is undefined');
    }
    if (!this.audioChunk) {
      throw new Error('AudioChunk is undefined');
    }
    if (!this._innerWidth) {
      throw new Error('Inner width is undefined');
    }

    if (this._settings.multiLine) {
      this.audioPxW =
        this.audioManager.resource.info.duration.seconds *
        this._settings.pixelPerSec;
      this.audioPxW =
        this.audioPxW < this._innerWidth ? this._innerWidth : this.AudioPxWidth;
    } else {
      this.audioPxW = this._innerWidth;
    }
    this.audioPxW = Math.round(this.audioPxW);

    if (this.audioPxW <= 0) {
      throw new Error(`Audio px is ${this.AudioPxWidth}`);
    }

    // initialize the default values
    this.audioTCalculator = new AudioTimeCalculator(
      this.audioChunk.time.duration,
      this.AudioPxWidth
    );
    this.MouseClickPos = this.audioManager.createSampleUnit(0);
    this._mouseCursor = this.audioManager.createSampleUnit(0);
    this.PlayCursor = new PlayCursor(
      0,
      new SampleUnit(0, this.audioChunk.sampleRate),
      this._innerWidth
    );
    this._drawnSelection = this.audioChunk.selection.clone();
    this._drawnSelection.end = this._drawnSelection.start.clone();

    return this.afterChannelInititialized();
  };

  public refreshComputedData(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (this.audioManager !== undefined && this.audioChunk !== undefined) {
          this.computeWholeDisplayData(
            this.AudioPxWidth / 2,
            this._settings.lineheight,
            this.audioManager.channel as any,
            {
              start:
                this.audioChunk.time.start.samples /
                this.audioManager.channelDataFactor,
              end:
                this.audioChunk.time.end.samples /
                this.audioManager.channelDataFactor,
            }
          )
            .then((result) => {
              this._minmaxarray = result;

              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          reject(new Error('audioManager or audioChunk is undefined'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * computeDisplayData() generates an array of min-max pairs representing the
   * audio signal. The values of the array are float in the range -1 .. 1.
   */
  computeWholeDisplayData(
    width: number,
    height: number,
    cha: Float32Array,
    _interval: { start: number; end: number }
  ): Promise<number[]> {
    return new Promise<number[]>((resolve, reject) => {
      const promises = [];

      const numberOfPieces = 8;

      const xZoom = (_interval.end - _interval.start) / width;

      let piece = Math.floor(width / numberOfPieces);
      const samplePiece = Math.floor(
        (_interval.end - _interval.start) / numberOfPieces
      );

      for (let i = 1; i <= numberOfPieces; i++) {
        const start = _interval.start + (i - 1) * samplePiece;
        let end = start + samplePiece;
        if (i === numberOfPieces) {
          // make sure to fit whole width
          piece = Math.round(width - piece * (numberOfPieces - 1));
          end = Math.ceil(_interval.end);
        }
        const tsJob = new TsWorkerJob(this.computeDisplayData, [
          piece,
          height,
          cha.slice(start, end),
          {
            start,
            end,
          },
          this._settings.roundValues,
          xZoom,
        ]);

        promises.push(this.multiThreadingService.run(tsJob));
      }

      Promise.all(promises)
        .then((values: number[][]) => {
          let result: any[] | PromiseLike<number[]> = [];
          for (const value of values) {
            result = result.concat(value);
          }

          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * get Line by absolute width of the audio sample
   */
  getPlayCursorPositionOfLineByAbsX(absX: number): {
    x: number;
    y: number;
  } {
    if (this._innerWidth !== undefined && this._innerWidth > 0) {
      const lineNum = Math.floor(absX / this._innerWidth);
      let x =
        this.settings.margin.left -
        this.settings.playcursor.width / 2 +
        absX -
        lineNum * this._innerWidth;
      x = isNaN(x) ? 0 : x;
      let y = lineNum * (this._settings.lineheight + this.settings.margin.top);
      y = isNaN(y) ? 0 : y;

      return { x, y };
    }
    return {
      x: 0,
      y: 0,
    };
  }

  /**
   * get selection of an sample relative to its position and width
   */
  public getRelativeSelectionByLine(
    lineNum: number,
    lineWidth: number,
    startSamples: SampleUnit,
    endSamples: SampleUnit,
    innerWidth: number
  ): { start: number; end: number } {
    if (this.audioTCalculator !== undefined && this.audioChunk !== undefined) {
      const absX = lineNum * innerWidth;
      const absEnd = absX + lineWidth;
      const selAbsStart = this.audioTCalculator.samplestoAbsX(
        startSamples.sub(this.audioChunk.time.start)
      );
      const selAbsEnd = this.audioTCalculator.samplestoAbsX(
        endSamples.sub(this.audioChunk.time.start)
      );

      const result = {
        start: selAbsStart,
        end: selAbsEnd,
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
            result.end = selAbsEnd - lineNum * innerWidth;
          }
          if (result.start > result.end) {
            const tmp = result.start;
            result.start = result.end;
            result.end = tmp;
          }
          return result;
        }
      }
    }

    return { start: -3, end: -1 };
  }

  /**
   * save mouse position for further processing
   */
  public setMouseMovePosition(absX: number) {
    if (
      this.audioTCalculator !== undefined &&
      this.audioChunk !== undefined &&
      this.annotation?.currentLevel?.items &&
      this.annotation.currentLevel.items.length > 0
    ) {
      const absXTime = this.audioTCalculator.absXChunktoSampleUnit(
        absX,
        this.audioChunk
      );

      if (absXTime !== undefined) {
        this._mouseCursor = absXTime.clone();

        if (this.mouseDown && this._dragableBoundaryID < 0) {
          // mouse down, nothing dragged
          if (!this.shiftPressed) {
            this.audioChunk.selection.end = absXTime.clone();
            this._drawnSelection = this.audioChunk.selection.clone();
          }
        } else if (
          this.settings.boundaries.enabled &&
          this.mouseDown &&
          this._dragableBoundaryID > -1
        ) {
          this.handleBoundaryDragging(absX, absXTime, false);

          this._boundaryDragging.next({
            shiftPressed: this.shiftPressed,
            id: this._dragableBoundaryID,
            status: 'dragging',
          });
        }
      }
    }
  }

  /**
   * addSegment() adds a boundary to the list of segments or removes the segment
   */
  public addOrRemoveSegment():
    | {
        type: string;
        seg_samples: number;
        seg_ID: number;
        msg: { type: string; text: string };
      }
    | undefined {
    let i = 0;

    if (
      this.settings.boundaries.enabled &&
      !this.settings.boundaries.readonly &&
      this.audioTCalculator !== undefined &&
      this.audioChunk !== undefined &&
      this._mouseCursor !== undefined &&
      this.annotation?.currentLevel?.items &&
      this.annotation.currentLevel.items.length > 0
    ) {
      this.audioTCalculator.audioPxWidth = this.audioPxW;
      const absXTime = !this.audioChunk.isPlaying
        ? this._mouseCursor.samples
        : this.audioChunk.absolutePlayposition.samples;
      let bWidthTime = this.audioTCalculator.absXtoSamples2(
        this.settings.boundaries.width * 2,
        this.audioChunk
      );
      bWidthTime = Math.round(bWidthTime);

      if (
        this.annotation.currentLevel.items.length > 0 &&
        !this.audioChunk.isPlaying
      ) {
        for (i = 0; i < this.annotation.currentLevel.items.length; i++) {
          const segment = this.annotation.currentLevel.items[
            i
          ] as OctraAnnotationSegment<ASRContext>;
          if (
            segment?.time !== undefined &&
            this.audioManager !== undefined &&
            segment.time.samples >= absXTime - bWidthTime &&
            segment.time.samples <= absXTime + bWidthTime &&
            segment.time.samples !==
              this.audioManager.resource.info.duration.samples
          ) {
            const segSamples = segment.time.samples;
            this.removeSegmentByIndex(i, this.silencePlaceholder, true);

            return {
              type: 'remove',
              seg_samples: segSamples,
              seg_ID: segment.id,
              msg: {
                type: 'success',
                text: '',
              },
            };
          }
        }
      }

      const selection: number =
        this._drawnSelection !== undefined ? this._drawnSelection.length : 0;

      if (
        selection > 0 &&
        this._drawnSelection !== undefined &&
        absXTime >= this._drawnSelection.start.samples &&
        absXTime <= this._drawnSelection.end.samples
      ) {
        // some part selected
        const segm1 = betweenWhichSegment(
          this.annotation.currentLevel
            .items as OctraAnnotationSegment<ASRContext>[],
          this._drawnSelection.start.samples
        );
        const segm2 = betweenWhichSegment(
          this.annotation.currentLevel
            .items as OctraAnnotationSegment<ASRContext>[],
          this._drawnSelection.end.samples
        );

        if (
          this.drawnSelection !== undefined &&
          ((segm1 === undefined && segm2 === undefined) ||
            segm1 === segm2 ||
            (segm1 !== undefined &&
              segm2 !== undefined &&
              segm1.getFirstLabelWithoutName('Speaker')?.value === '' &&
              segm2.getFirstLabelWithoutName('Speaker')?.value === ''))
        ) {
          if (this.drawnSelection.start.samples > 0) {
            // prevent setting boundary if first sample selected
            this.addSegment(this._drawnSelection.start);
          }

          this.addSegment(this._drawnSelection.end);

          return {
            type: 'add',
            seg_samples: this.drawnSelection.start.samples,
            seg_ID: -1,
            msg: {
              type: 'success',
              text: '',
            },
          };
        } else {
          return {
            type: 'add',
            seg_samples: -1,
            seg_ID: -1,
            msg: {
              type: 'error',
              text: 'boundary cannot set',
            },
          };
        }
      } else {
        // no selection

        this.addSegment(
          this.audioManager!.createSampleUnit(Math.round(absXTime))
        );

        return {
          type: 'add',
          seg_samples: absXTime,
          seg_ID: -1,
          msg: {
            type: 'success',
            text: '',
          },
        };
      }
    }
    return undefined;
  }

  /**
   * get selection of segment
   * @returns AudioSelection
   */
  public getSegmentSelection(
    positionSamples: number
  ): AudioSelection | undefined {
    // complex decision needed because there are no segments at position 0 and the end of the file
    let result = undefined;
    if (
      this.annotation?.currentLevel?.items &&
      this.annotation.currentLevel.items.length > 0
    ) {
      const segments = this.annotation.currentLevel.items;
      const length = this.annotation.currentLevel.items.length;

      if (
        length > 0 &&
        segments !== undefined &&
        this.audioManager !== undefined
      ) {
        const firstSegment = segments[0] as OctraAnnotationSegment<ASRContext>;
        const lastSegment = segments[
          segments.length - 1
        ] as OctraAnnotationSegment<ASRContext>;

        if (firstSegment.time.samples !== lastSegment.time.samples) {
          if (positionSamples < firstSegment.time.samples) {
            // select in first Boundary
            result = new AudioSelection(
              this.audioManager.createSampleUnit(0),
              firstSegment.time
            );
          } else if (positionSamples > lastSegment.time.samples) {
            // select in first Boundary
            const seg = lastSegment.time.clone();
            result = new AudioSelection(
              seg,
              this.audioManager.resource.info.duration
            );
          } else {
            for (let i = 1; i < length; i++) {
              const currentSegment = segments[
                i
              ] as OctraAnnotationSegment<ASRContext>;
              const previousSegment = segments[
                i - 1
              ] as OctraAnnotationSegment<ASRContext>;

              if (
                previousSegment?.time !== undefined &&
                currentSegment?.time !== undefined
              ) {
                if (
                  positionSamples > previousSegment.time.samples &&
                  positionSamples < currentSegment.time.samples
                ) {
                  result = new AudioSelection(
                    previousSegment.time,
                    currentSegment.time
                  );
                  return result;
                }
              }
            }
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
    if (
      this._mouseCursor !== undefined &&
      this.audioChunk !== undefined &&
      this.audioManager !== undefined
    ) {
      if (samples > 0) {
        const mouseCursorPosition = this._mouseCursor.samples;
        if (
          (direction === 'left' || direction === 'right') &&
          ((mouseCursorPosition >=
            this.audioChunk.time.start.samples + samples &&
            direction === 'left') ||
            (mouseCursorPosition <=
              this.audioChunk.time.end.samples - samples &&
              direction === 'right'))
        ) {
          if (direction === 'left') {
            if (
              this._mouseCursor.samples >=
              this.audioChunk.time.start.samples + samples
            ) {
              this._mouseCursor = this._mouseCursor.sub(
                this.audioManager.createSampleUnit(samples)
              );
            }
          } else if (direction === 'right') {
            if (
              this._mouseCursor.samples <=
              this.audioChunk.time.end.samples - samples
            ) {
              this._mouseCursor = this._mouseCursor.add(
                this.audioManager.createSampleUnit(samples)
              );
            }
          }
        }
      } else {
        throw new Error(
          'can not move cursor by given samples. Number of samples less than 0.'
        );
      }
    }
  }

  private computeDisplayData = (
    width: number,
    height: number,
    channel: Float32Array,
    interval: {
      start: number;
      end: number;
    },
    roundValues: boolean,
    xZoom: number
  ) => {
    return new Promise<any>((resolve, reject) => {
      if (
        interval.start !== undefined &&
        interval.end !== undefined &&
        interval.end >= interval.start
      ) {
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

          if (offset + xZoom > len) {
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

        (channel as any) = undefined;
        resolve(minMaxArray);
      } else {
        reject('interval.end is less than interval.start');
      }
    });
  };

  private calculateZoom(height: number, width: number, minmaxarray: number[]) {
    if (this._settings.justifySignalHeight) {
      // justify height to maximum top border
      let maxZoomX = 0;
      let maxZoomY = 0;
      const timeLineHeight = this._settings.timeline.enabled
        ? this._settings.timeline.height
        : 0;
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

      let rest = height - timeLineHeight - (maxZoomY + Math.abs(maxZoomYMin));
      rest = Math.floor(rest - 2);

      if (rest > 0) {
        this._zoomY = rest / (maxZoomY + Math.abs(maxZoomYMin)) + 1;
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
  private afterChannelInititialized(
    calculateZoom: boolean = true
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.refreshComputedData()
        .then(() => {
          if (calculateZoom) {
            this.calculateZoom(
              this._settings.lineheight,
              this.AudioPxWidth,
              this._minmaxarray
            );
          }
          if (this.audioChunk !== undefined) {
            this.audioChunk.absolutePlayposition =
              this.audioChunk.time.start.clone();
          }
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

  public removeSegmentByIndex(
    index: number,
    silenceCode: string | undefined,
    mergeTranscripts: boolean,
    triggerChange = true
  ) {
    if (this.annotation?.currentLevel) {
      this.annotation?.removeItemByIndex(index, silenceCode, mergeTranscripts);
      if (triggerChange) {
        this.currentLevelChange.emit({
          type: 'remove',
          items: [
            {
              index,
            },
          ],
          removeOptions: {
            silenceCode,
            mergeTranscripts,
          },
        });
        this.annotationChange.emit(this.annotation);
      }
    } else {
      throw new Error(
        "Can't remove segment by index: current level is undefined"
      );
    }
  }

  public addSegment(start: SampleUnit, value?: string) {
    const result = this.annotation!.addItemToCurrentLevel(
      start,
      value ? [new OLabel(this.currentLevel!.name, value)] : undefined
    );
    this.currentLevelChange.emit({
      type: 'add',
      items: [
        {
          instance: this.annotation!.createSegment(
            start,
            value ? [new OLabel(this.currentLevel!.name, value)] : undefined
          ),
        },
      ],
    });
    this.annotationChange.emit(result);
  }

  public changeSegment(start: SampleUnit, segment: OctraAnnotationSegment) {
    const result = this.annotation!.changeCurrentSegmentBySamplePosition(
      start,
      segment
    );
    this.currentLevelChange.emit({
      type: 'change',
      items: [
        {
          instance: segment,
        },
      ],
    });
    this.annotationChange.emit(result);
  }

  getChanges(
    oldAnnotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>,
    newAnnotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>
  ): AnnotationChange[] {
    if (!oldAnnotation || !newAnnotation) {
      return [];
    }

    const result: AnnotationChange[] = [];
    const state: {
      old: {
        levelIDs: number[];
        itemIDs: number[];
        linkIDs: number[];
      };
      new: {
        levelIDs: number[];
        itemIDs: number[];
        linkIDs: number[];
      };
    } = {
      old: {
        levelIDs: [],
        itemIDs: [],
        linkIDs: [],
      },
      new: {
        levelIDs: [],
        itemIDs: [],
        linkIDs: [],
      },
    };

    // first read all IDs
    const readIDs: (
      annotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>
    ) => {
      levelIDs: number[];
      itemIDs: number[];
      linkIDs: number[];
    } = (annotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>) => {
      const idResult: {
        levelIDs: number[];
        itemIDs: number[];
        linkIDs: number[];
      } = {
        levelIDs: [],
        itemIDs: [],
        linkIDs: [],
      };

      // read level ids
      for (const level of annotation.levels) {
        idResult.levelIDs.push(level.id);
        for (const item of level.items) {
          idResult.itemIDs.push(item.id);
        }
      }

      // read link ids
      for (const link of annotation.links) {
        idResult.linkIDs.push(link.id);
      }

      return idResult;
    };

    state.old = readIDs(oldAnnotation);
    state.new = readIDs(newAnnotation);

    // iterate old annotation and compare with new annotation
    for (const oldAnnoLevel of oldAnnotation.levels) {
      const newLevel = newAnnotation.levels.find(
        (a) => a.id === oldAnnoLevel.id
      );

      if (!newLevel) {
        // level was removed
        result.push({
          type: 'remove',
          level: {
            old: oldAnnoLevel,
            new: undefined,
          },
        });
      } else {
        for (const item of oldAnnoLevel.items) {
          const found = newLevel.items.find((a) => a.id === item.id);

          if (found) {
            // compare changes
            if (item.type === found.type) {
              if (
                item.type === 'segment' &&
                item instanceof OctraAnnotationSegment &&
                found instanceof OctraAnnotationSegment
              ) {
                if (!item.isEqualWith(found)) {
                  // changed
                  result.push({
                    type: 'change',
                    level: {
                      old: newLevel,
                      new: newLevel,
                    },
                    item: {
                      old: item,
                      new: found,
                    },
                  });
                }
                state.old.itemIDs = state.old.itemIDs.filter(
                  (a) => a !== item.id
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id
                );
              } else if (
                item.type === 'event' &&
                item instanceof OctraAnnotationEvent &&
                found instanceof OctraAnnotationEvent
              ) {
                if (!item.isEqualWith(found)) {
                  // changed
                  result.push({
                    type: 'change',
                    level: {
                      old: newLevel,
                      new: newLevel,
                    },
                    item: {
                      old: item,
                      new: found,
                    },
                  });
                }
                state.old.itemIDs = state.old.itemIDs.filter(
                  (a) => a !== item.id
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id
                );
              } else if (
                item.type === 'item' &&
                item instanceof OItem &&
                found instanceof OItem
              ) {
                if (!item.isEqualWith(found)) {
                  // changed
                  result.push({
                    type: 'change',
                    level: {
                      old: newLevel,
                      new: newLevel,
                    },
                    item: {
                      old: item,
                      new: found,
                    },
                  });
                }
                state.old.itemIDs = state.old.itemIDs.filter(
                  (a) => a !== item.id
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id
                );
              } else {
                throw new Error("Can't find correct item instance");
              }
            } else {
              // types changed
              result.push({
                type: 'change',
                level: {
                  old: newLevel,
                  new: newLevel,
                },
                item: {
                  old: item,
                  new: found,
                },
              });
              state.old.itemIDs = state.old.itemIDs.filter(
                (a) => a !== item.id
              );
              state.new.itemIDs = state.new.itemIDs.filter(
                (a) => a !== item.id
              );
            }
          } else {
            // newAnnotation doesn't have this item => was removed
            result.push({
              type: 'remove',
              item: {
                old: item,
                new: undefined,
              },
            });
            state.old.itemIDs = state.old.itemIDs.filter((a) => a !== item.id);
            state.new.itemIDs = state.new.itemIDs.filter((a) => a !== item.id);
          }
        }
        state.old.levelIDs = state.old.levelIDs.filter(
          (a) => a !== oldAnnoLevel.id
        );
        state.new.levelIDs = state.new.levelIDs.filter(
          (a) => a !== oldAnnoLevel.id
        );
      }
    }
    if (state.new.levelIDs.length > 0) {
      // new levels added
      for (const id of state.new.levelIDs) {
        const level: OctraAnnotationAnyLevel<OctraAnnotationSegment> =
          newAnnotation.levels.find((a) => a.id === id)!;
        result.push({
          type: 'add',
          level: {
            old: undefined,
            new: level,
          },
        });

        state.new.itemIDs = state.new.itemIDs.filter(
          (a) => level.items.find((b) => b.id === a) === undefined
        );
      }
    }

    if (state.new.itemIDs.length > 0) {
      // new levels added
      for (const id of state.new.itemIDs) {
        let item: AnnotationAnySegment | undefined;
        const level: OctraAnnotationAnyLevel<OctraAnnotationSegment> =
          newAnnotation.levels.find((a) => {
            const found = a.items.find((b) => b.id === id);
            if (found) {
              item = found;
              return true;
            }
            return false;
          })!;

        result.push({
          type: 'add',
          item: {
            old: undefined,
            new: item,
          },
          level: {
            old: level,
            new: level,
          },
        });
      }
    }

    // iterate old links and compare with new annotation
    for (const link of oldAnnotation.links) {
      const found = newAnnotation.links.find((a) => a.id === link.id);
      if (found) {
        if (
          link.link.fromID !== found.link.fromID ||
          link.link.toID !== found.link.toID
        ) {
          // changed
          result.push({
            type: 'change',
            link: {
              old: link,
              new: found,
            },
          });
          state.old.linkIDs = state.old.linkIDs.filter((a) => a !== link.id);
          state.new.linkIDs = state.new.linkIDs.filter((a) => a !== link.id);
        }
      } else {
        // removed
        state.old.linkIDs = state.old.linkIDs.filter((a) => a !== link.id);
      }
    }

    if (state.new.linkIDs.length > 0) {
      for (const id of state.new.linkIDs) {
        const link: OctraAnnotationLink = newAnnotation.links.find(
          (a) => a.id === id
        )!;
        result.push({
          type: 'add',
          link: {
            old: undefined,
            new: link,
          },
        });
      }
    }

    return result;
  }
}

export interface AnnotationChange {
  type: 'add' | 'remove' | 'change';
  level?: {
    old?: OctraAnnotationAnyLevel<OctraAnnotationSegment>,
    new?: OctraAnnotationAnyLevel<OctraAnnotationSegment>
  };
  item?: {
    old?: AnnotationAnySegment;
    new?: AnnotationAnySegment;
  };
  link?: {
    old?: OctraAnnotationLink;
    new?: OctraAnnotationLink;
  };
}
