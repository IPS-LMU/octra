import { EventEmitter, inject, Injectable, Renderer2 } from '@angular/core';
import {
  AnnotationAnySegment,
  AnnotationLevelType,
  ASRContext,
  ASRQueueItemType,
  betweenWhichSegment,
  getSegmentBySamplePosition,
  getSegmentsOfRange,
  getStartTimeBySegmentID,
  OctraAnnotation,
  OctraAnnotationAnyLevel,
  OctraAnnotationEvent,
  OctraAnnotationLink,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
  OItem,
  OLabel,
} from '@octra/annotation';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { TimespanPipe } from '@octra/ngx-utilities';
import { SubscriptionManager, TsWorkerJob } from '@octra/utilities';
import {
  AudioChunk,
  AudioManager,
  AudioTimeCalculator,
  ShortcutGroup,
  ShortcutManager,
} from '@octra/web-media';
import Konva from 'konva';
import { Subject, timer } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { MultiThreadingService } from '../../../multi-threading.service';
import { Position, Size } from '../../../obj';
import { PlayCursor } from '../../../obj/play-cursor';
import { AudioViewerShortcutEvent } from './audio-viewer.component';
import { AudioviewerConfig } from './audio-viewer.config';
import Vector2d = Konva.Vector2d;
import Group = Konva.Group;
import Layer = Konva.Layer;
import Shape = Konva.Shape;
import Context = Konva.Context;

@Injectable()
export class AudioViewerService {
  private multiThreadingService = inject(MultiThreadingService);

  get focused(): boolean {
    return this._focused;
  }

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

  private viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  public get mouseCursorCanvasElement(): {
    location: Vector2d | undefined;
    size:
      | {
          height: number;
          width: number;
        }
      | undefined;
  } {
    if (this.canvasElements.mouseCaret === undefined) {
      return {
        location: {
          x: 0,
          y: 0,
        },
        size: {
          width: 0,
          height: 0,
        },
      };
    } else {
      return {
        location: this.canvasElements?.mouseCaret?.position(),
        size: this.canvasElements?.mouseCaret?.size(),
      };
    }
  }

  public playcursorchange = new EventEmitter<PlayCursor>();

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

  private size?: {
    width: number;
    height: number;
  };
  private stage: Konva.Stage | undefined;
  private konvaContainer?: HTMLDivElement;
  public renderer?: Renderer2;
  public shortcut = new EventEmitter<AudioViewerShortcutEvent>();
  public selchange = new EventEmitter<AudioSelection>();

  private layers:
    | {
        background: Konva.Layer;
        playhead: Konva.Layer;
        boundaries: Konva.Layer;
        overlay: Konva.Layer;
        scrollBars: Konva.Layer;
      }
    | undefined;

  private canvasElements: {
    playHead: Konva.Group | undefined;
    mouseCaret: Konva.Group | undefined;
    scrollBar: Konva.Group | undefined;
    scrollbarSelector: Konva.Rect | undefined;
    lastLine: Konva.Group | undefined;
  } = {
    playHead: undefined,
    mouseCaret: undefined,
    scrollBar: undefined,
    scrollbarSelector: undefined,
    lastLine: undefined,
  };

  private styles = {
    playHead: {
      backgroundColor: '#56a09e',
      strokeColor: 'pruple',
      strokeWidth: 1,
      width: 10,
    },
    caret: {
      strokeColor: 'red',
      strokeWidth: 1,
    },
    height: 200,
    border: {
      width: 1,
      color: '#b5b5b5',
    },
    background: {
      color: '#e2e6ff',
    },
    grid: {
      strokeColor: 'gray',
      strokeWidth: 1,
    },
    signal: {
      strokeColor: 'green',
      strokeWidth: 1,
    },
  };

  public shortcutsManager: ShortcutManager;
  public refreshOnInternChanges = true;
  public audioTCalculator: AudioTimeCalculator | undefined;
  public overboundary = false;
  public shiftPressed = false;
  public silencePlaceholder?: string;
  public channelInitialized = new Subject<void>();
  protected mouseClickPos: SampleUnit | undefined;
  protected playcursor: PlayCursor | undefined;
  private _focused = false;
  public onInitialized = new Subject<void>();

  private _boundaryDragging: Subject<{
    status: 'started' | 'stopped' | 'dragging';
    id: number;
    shiftPressed?: boolean;
  }>;
  currentLevelID?: number;

  public secondsPerLine = 5;
  private hoveredLine = -1;
  private refreshRunning = false;
  public mousecursorchange = new EventEmitter<{
    event: MouseEvent | undefined;
    time: SampleUnit | undefined;
  }>();

  private croppingData:
    | {
        x: number;
        y: number;
        radius: number;
      }
    | undefined;
  private animation: {
    playHead: Konva.Animation | undefined;
  } = {
    playHead: undefined,
  };

  private grid = {
    verticalLines: 3,
    horizontalLines: 2,
  };

  annotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
  tempAnnotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
  public name = '';

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
      this.subscrManager.add(
        timer(0).subscribe({
          next: () => {
            this.redrawSegment(value);
            this.drawAllBoundaries();
            this.drawWholeSelection();
          },
        }),
      );

      if (this.refreshOnInternChanges) {
        this.redrawSegment(value);
      }

      this._boundaryDragging.next({
        shiftPressed: this.shiftPressed,
        id: value,
        status: 'started',
      });
    }
    this._dragableBoundaryID = value;
  }

  private _zoomY = 1;
  public alert = new EventEmitter<{ type: string; message: string }>();
  public segmententer = new EventEmitter<{
    index: number;
    pos: { Y1: number; Y2: number };
  }>();

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

  public get audioManager(): AudioManager | undefined {
    return this.audioChunk?.audioManager;
  }

  public itemIDCounter = 1;
  public itemIDCounterChange = new EventEmitter<number>();

  public getNextItemID() {
    this.itemIDCounter++;
    this.itemIDCounterChange.emit(this.itemIDCounter);
    return this.itemIDCounter - 1;
  }

  constructor() {
    this.shortcutsManager = new ShortcutManager();
    this._boundaryDragging = new Subject<{
      status: 'started' | 'stopped' | 'dragging';
      id: number;
      shiftPressed?: boolean;
    }>();
  }

  public initialize(
    stageWidth: number | undefined,
    stageHeight: number | undefined,
    container: HTMLDivElement | undefined,
    audioChunk: AudioChunk | undefined,
  ) {
    if (stageWidth && stageHeight && container && this.renderer) {
      this.konvaContainer = container;
      this.audioChunk = audioChunk;
      this.updateSize(stageWidth, stageHeight);
      const optionalScrollbarWidth = this.settings.scrollbar.enabled
        ? this.settings.scrollbar.width
        : 0;
      this._innerWidth =
        this.size!.width -
        (this.settings.margin.left + this.settings.margin.right) -
        optionalScrollbarWidth;
      this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);

      if (!this.settings.multiLine && this.size) {
        this.settings.lineheight =
          this.size.height -
          this.settings.margin.top -
          this.settings.margin.bottom;
      }

      if (!this.stage) {
        this.stage = new Konva.Stage({
          container, // id of container <div>,
          width: this.size!.width,
          height: this.size!.height,
        });
        this.initializeLayers();

        if (this.layers) {
          for (const [, layer] of Object.entries(this.layers)) {
            this.stage.add(layer);
          }
        }
      } else {
        this.stage.width(this.size!.width);
        this.stage.height(this.size!.height);
      }

      this.updateViewPort();
      this.removeEventListenersFromContainer(container);
      this.addEventListenersForContainer(container);

      this.initializeStageContainer();

      this.shortcutsManager.clearShortcuts();
      this.shortcutsManager.registerShortcutGroup(this.settings.shortcuts);
    }
  }

  private showOnlyLinesInViewport() {
    if (this.viewport && this.layers?.background) {
      const lines = this.layers.background.find('.line');
      let i = 0;
      for (const line of lines) {
        line.visible(
          this.isVisibleInView(line.x(), line.y(), line.width(), line.height()),
        );
        i++;
      }
    }
  }

  /**
   * apply changes from custom change detection. Only items relevant because audioviewer can only view on level at the same time.
   * @param changes
   * @private
   */
  public applyChanges(
    changes: AnnotationChange[],
    oldAnnotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>,
  ) {
    const getIndexOfSegmentID = (
      level: OctraAnnotationAnyLevel<OctraAnnotationSegment>,
      id: number,
    ) => {
      return level.items.findIndex((a) => a.id === id);
    };

    const checkNeighbours = (item: AnnotationAnySegment) => {
      const currentLevel = (this
        .currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>)!;
      const rightNeighbour = currentLevel.getRightSibling(
        getIndexOfSegmentID(currentLevel, item.id),
      );
      if (rightNeighbour) {
        this.removeSegmentFromCanvas(rightNeighbour.id);
        this.addNewSegmentOnCanvas(rightNeighbour.id);
      }

      const leftNeighbour = currentLevel.getLeftSibling(
        getIndexOfSegmentID(currentLevel, item.id),
      );
      if (leftNeighbour) {
        this.removeSegmentFromCanvas(leftNeighbour.id);
        this.addNewSegmentOnCanvas(leftNeighbour.id);
      }
    };
    for (const change of changes) {
      if (change.type === 'change') {
        if (change.item?.new) {
          // item changed
          this.removeSegmentFromCanvas(change.item.new.id);
          this.addNewSegmentOnCanvas(change.item.new.id);

          checkNeighbours(change.item.new);
        }
      } else if (change.type === 'add') {
        if (change.item?.new) {
          this.addNewSegmentOnCanvas(change.item.new.id);
          checkNeighbours(change.item.new);
        }
      } else if (change.type === 'remove') {
        if (change.item?.old) {
          this.removeSegmentFromCanvas(change.item.old.id);
          const oldLevel =
            oldAnnotation.currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
          const oldLeft = oldLevel.getLeftSibling(
            getIndexOfSegmentID(oldLevel, change!.item!.old!.id!),
          )! as OctraAnnotationSegment;
          if (oldLeft) {
            checkNeighbours(oldLeft);
          }
        }
      }
    }

    this.bringToFront('#timeStamps');
    this.bringToFront('.line-selections');
  }

  private bringToFront(name: string) {
    this.layers?.overlay.find(name).map((a) => {
      // selections to foreground
      a.zIndex((this.layers?.overlay.children?.length ?? 1) - 1);
      return a;
    });
  }

  public getPixelPerSecond(secondsPerLine: number) {
    if (this.innerWidth !== undefined) {
      if (secondsPerLine !== undefined) {
        if (
          this.audioChunk?.time &&
          this.audioChunk.time.duration.seconds < secondsPerLine
        ) {
          return this.innerWidth / this.audioChunk.time.duration.seconds;
        }
        return this.innerWidth / secondsPerLine;
      } else {
        console.error(`secondsPerLine is undefined or undefined!`);
      }
      return this.innerWidth / 5;
    }
    return 0;
  }

  onResize = async (newWidth?: number, newHeight?: number) => {
    try {
      if (
        this.audioChunk !== undefined &&
        this.currentLevel &&
        this.stage !== undefined &&
        newWidth &&
        newHeight &&
        this.currentLevel.items.length > 0
      ) {
        const playpos = this.audioChunk?.absolutePlayposition.clone();
        const drawnSelection = this.drawnSelection?.clone();
        const viewport = this.viewport;
        this.initialize(
          newWidth,
          newHeight,
          this.konvaContainer,
          this.audioChunk,
        );
        this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
        await this.initializeSettings();
        this.initializeView();

        if (this.audioChunk !== undefined) {
          if (!this.audioChunk.isPlaying) {
            this.audioChunk.absolutePlayposition = playpos.clone();
          }
          this.drawnSelection = drawnSelection;
        }
        this.scrollToAbsY(viewport!.y!);
        this.bringToFront('#timeStamps');
        this.bringToFront('.line-selections');

        this.drawWholeSelection();
        this.updatePlayCursor();
        this.layers?.playhead.draw();
      }
    } catch (e) {
      //ignore
      console.error(e);
    }
  };

  public initializeView() {
    if (
      this.currentLevel &&
      this.currentLevel.items.length > 0 &&
      this.stage &&
      this.size?.height &&
      this.layers
    ) {
      this.stage.height(this.size.height);

      for (const [, value] of Object.entries(this.layers)) {
        value.removeChildren();
      }

      if (
        this.settings.cropping === 'circle' &&
        this.innerWidth !== undefined
      ) {
        this.settings.lineheight = this.innerWidth;
        const circleWidth = this.innerWidth - 5;
        this.croppingData = {
          x: circleWidth / 2 + 2 + this.settings.margin.left,
          y: circleWidth / 2 + 2 + this.settings.margin.top,
          radius: circleWidth / 2,
        };
      }

      const addSingleLineOnly = () => {
        if (this.innerWidth !== undefined) {
          const line = this.createLine(
            new Size(this.innerWidth, this.settings.lineheight),
            new Position(this.settings.margin.left, 0),
            0,
          );
          this.layers?.background.add(line);
          this.canvasElements.lastLine = line;
        }
      };

      if (
        this.settings.multiLine &&
        this.audioChunk!.time!.duration.seconds > this.secondsPerLine
      ) {
        let lineWidth = this.innerWidth;

        if (lineWidth !== undefined) {
          const numOfLines = Math.ceil(this.AudioPxWidth / lineWidth);
          let y = 0;
          if (numOfLines > 1) {
            let drawnWidth = 0;
            for (let i = 0; i < numOfLines - 1; i++) {
              const line = this.createLine(
                new Size(lineWidth, this.settings.lineheight),
                new Position(this.settings.margin.left, y),
                i,
              );
              line.listening(false);
              line.visible(
                this.isVisibleInView(
                  line.x(),
                  line.y(),
                  line.width(),
                  line.height(),
                ),
              );

              this.layers.background.add(line);
              y += this.settings.lineheight + this.settings.margin.top;
              this.canvasElements.lastLine = line;
              drawnWidth += lineWidth;
            }
            // add last line
            lineWidth = this.AudioPxWidth - drawnWidth;
            if (lineWidth > 0) {
              const line = this.createLine(
                new Size(lineWidth, this.settings.lineheight),
                new Position(this.settings.margin.left, y),
                numOfLines - 1,
              );
              this.layers.background.add(line);
              this.canvasElements.lastLine = line;
            }
          } else {
            addSingleLineOnly();
          }
        } else {
          addSingleLineOnly();
        }
      } else {
        addSingleLineOnly();
      }

      // this.layers.background.batchDraw();
      this.updateAllSegments();

      let y = 0;
      let lineWidth = this.innerWidth!;
      const numOfLines = Math.ceil(this.AudioPxWidth / lineWidth);

      let drawnWidth = 0;
      const selectionGroup = new Konva.Group({
        name: 'line-selections',
      });

      for (let i = 0; i < numOfLines - 1; i++) {
        const selectElem = this.createLineSelectionGroup(
          new Size(lineWidth, this.settings.lineheight),
          new Position(this.settings.margin.left, y),
          i,
        );

        selectionGroup.add(selectElem);
        y += this.settings.lineheight + this.settings.margin.top;
        drawnWidth += lineWidth;
      }

      // add last line
      lineWidth = this.AudioPxWidth - drawnWidth;
      if (lineWidth > 0) {
        const selectElem = this.createLineSelectionGroup(
          new Size(lineWidth, this.settings.lineheight),
          new Position(this.settings.margin.left, y),
          numOfLines - 1,
        );
        selectionGroup.add(selectElem);
      }

      this.layers.overlay.add(selectionGroup);
      this.layers.overlay.batchDraw();

      this.canvasElements.playHead = this.createLinePlayCursor();
      if (this.settings.selection.enabled) {
        this.layers.playhead.add(this.canvasElements.playHead);
      }

      this.canvasElements.mouseCaret = this.createLineMouseCaret();
      this.layers.playhead.add(this.canvasElements.mouseCaret);

      if (
        this.settings.cropping === 'circle' &&
        this.croppingData !== undefined
      ) {
        const cropGroup = this.createCropContainer();
        this.layers.playhead.removeChildren();
        this.canvasElements.mouseCaret.position({
          x: this.croppingData.radius + 2,
          y: 2,
        });

        cropGroup.add(this.canvasElements.playHead);
        cropGroup.add(this.canvasElements.mouseCaret);
        this.layers.playhead.add(cropGroup);
      }

      if (this.settings.scrollbar.enabled) {
        this.canvasElements.scrollBar = this.createScrollBar();
        if (this.canvasElements?.scrollBar !== undefined) {
          this.layers.scrollBars.add(this.canvasElements.scrollBar);
        }
      }

      this.stage.batchDraw();
      this.onInitialized.next();
    } else {
      console.error(`transcriptionLevel is undefined`);
    }
  }

  public updateLines = () => {
    if (this.layers?.background && this.layers?.overlay) {
      const lines: Group[] | undefined = this.layers.background.find('.line');
      const lineSelections: Group[] | undefined =
        this.layers.overlay.find('.line-selection');

      if (this.innerWidth !== undefined) {
        if (lines && lineSelections) {
          // check all lines but the last one
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineSelection = lineSelections[i];
            line.width(this.innerWidth);
            lineSelection.width(this.innerWidth);
            const geometrics = line.getChildren();
            for (let j = 0; j < geometrics.length; j++) {
              const elem = geometrics[j];
              if (
                (lines.length > 1 && i < lines.length - 1) ||
                lines.length === 1
              ) {
                elem.width(this.innerWidth);
              } else {
                const width = this.AudioPxWidth % this.innerWidth;
                line.width(width);
                // last line
                elem.width(width);
              }
            }

            line.visible(
              this.isVisibleInView(
                line.x(),
                line.y(),
                line.width(),
                line.height(),
              ),
            );
          }
        }

        const scrollbars = this.layers?.scrollBars.find('#scrollBar');
        if (scrollbars !== undefined && scrollbars.length > 0) {
          scrollbars[0].x(this.innerWidth + this.settings.margin.left);
        }
      }
    }
  };

  private updateViewPort() {
    if (this.size && this.layers?.background) {
      this.viewport = {
        x: Math.abs(this.layers.background.x()),
        y: Math.abs(this.layers.background.y()),
        width: this.size.width,
        height: this.size.height,
      };
    }
  }

  public scrollToAbsY(absY: number) {
    if (
      this.canvasElements !== undefined &&
      this.canvasElements.lastLine !== undefined
    ) {
      const deltaY =
        absY /
        (this.canvasElements.lastLine.y() +
          this.canvasElements.lastLine.height());
      this.scrollWithDeltaY(-deltaY);
    }
  }

  async onSecondsPerLineChanged(secondsPerLine: number) {
    try {
      this.secondsPerLine = secondsPerLine;
      this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
      await this.initializeSettings();
      this.initializeView();
    } catch (error) {
      console.error(error);
    }
  }

  private createCropContainer(id?: string): Group {
    return new Konva.Group({
      id,
      clipFunc: (ctx) => {
        if (this.croppingData !== undefined) {
          ctx.arc(
            this.croppingData.x,
            this.croppingData.y,
            this.croppingData.radius,
            0,
            Math.PI * 2,
            false,
          );
        }
      },
    });
  }

  public onPlaybackStarted() {
    if (this.animation.playHead && !this.animation.playHead.isRunning()) {
      this.animation.playHead.start();
    }
  }

  public onPlaybackPaused() {
    if (this.animation.playHead !== undefined) {
      this.animation.playHead.stop();
    }
  }

  public onPlaybackStopped() {
    this.animation.playHead?.stop();
    this.updatePlayCursor();
    this.layers?.playhead.draw();
  }

  public onPlaybackEnded() {
    this.animation.playHead?.stop();
    this.updatePlayCursor();
    this.layers?.playhead.draw();
  }

  private createLineBackground(line: Konva.Group, size: Size) {
    const container = new Konva.Rect({
      fill: this.settings.backgroundcolor,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position',
    });
    line.add(container);
  }

  private createLineBorder(line: Konva.Group, size: Size) {
    const frame = new Konva.Rect({
      stroke: this.settings.frame.color,
      strokeWidth: 1,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position',
    });
    line.add(frame);
  }

  private createLineSelection(line: Konva.Group, size: Size) {
    const frame = new Konva.Rect({
      name: 'selection',
      opacity: 0.2,
      fill: this.settings.selection.color,
      width: 0,
      height: size.height,
      transformsEnabled: 'position',
    });
    line.add(frame);
  }

  private createLineGrid(line: Konva.Group, size: Size) {
    const frame = new Konva.Shape({
      opacity: 0.2,
      stroke: this.settings.grid.color,
      strokeWidth: 1,
      width: size.width,
      height: size.height,
      sceneFunc: this.sceneFuncGrid,
      transformsEnabled: 'position',
    });
    frame.perfectDrawEnabled(false);
    line.add(frame);
  }

  private sceneFuncGrid = (context: Konva.Context, shape: Konva.Shape) => {
    if (
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.audioManager !== undefined &&
      this.audioTCalculator !== undefined
    ) {
      const position = {
        x: 0,
        y: 0,
      };
      const pxPerSecond = Math.round(
        this.audioTCalculator.samplestoAbsX(
          new SampleUnit(
            this.audioManager.sampleRate,
            this.audioManager.sampleRate,
          ),
        ),
      );

      if (pxPerSecond >= 5) {
        const timeLineHeight = this.settings.timeline.enabled
          ? this.settings.timeline.height
          : 0;
        const vZoom = Math.round(
          (this.settings.lineheight - timeLineHeight) /
            this.grid.horizontalLines,
        );

        if (pxPerSecond > 0 && vZoom > 0) {
          // --- get the appropriate context
          context.beginPath();

          // set horizontal lines
          for (
            let y = Math.round(vZoom / 2);
            y < this.settings.lineheight - timeLineHeight;
            y = y + vZoom
          ) {
            context.moveTo(position.x, y + position.y);
            context.lineTo(
              position.x +
                shape.width() -
                (this.settings.margin.left + this.settings.margin.right),
              y + position.y,
            );
          }
          // set vertical lines
          for (
            let x = pxPerSecond;
            x <
            shape.width() -
              (this.settings.margin.left + this.settings.margin.right);
            x = x + pxPerSecond
          ) {
            context.moveTo(position.x + x, position.y);
            context.lineTo(
              position.x + x,
              position.y + this.settings.lineheight - timeLineHeight,
            );
          }

          context.stroke();
          context.fillStrokeShape(shape);
        }
      }
    }
  };

  private createLinePlayCursor() {
    const group = new Konva.Group({
      name: 'playhead',
      x: this.settings.margin.left - this.settings.playcursor.width / 2,
      y: 0,
      transformsEnabled: 'position',
    });

    const frame = new Konva.Rect({
      fill: this.settings.playcursor.color,
      width: this.settings.playcursor.width,
      height: this.settings.lineheight,
      opacity: 0.25,
      transformsEnabled: 'position',
    });

    const caret = new Konva.Line({
      points: [
        this.settings.playcursor.width / 2,
        0,
        this.settings.playcursor.width / 2,
        this.settings.lineheight,
      ],
      stroke: 'black',
      strokeWidth: 2,
      transformsEnabled: 'position',
    });

    group.add(frame);
    group.add(caret);

    if (this.layers !== undefined) {
      this.animation.playHead = new Konva.Animation(
        this.doPlayHeadAnimation,
        this.layers.playhead,
      );
    }

    return group;
  }

  private createLine(
    size: Size,
    position: Position,
    lineNum: number,
  ): Konva.Group {
    const result = new Konva.Group({
      name: 'line',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position',
    });

    let lineGroup = result;

    if (this.settings.cropping === 'circle' && this.innerWidth !== undefined) {
      lineGroup = this.createCropContainer();
      size = new Size(this.innerWidth, this.innerWidth);
    }

    this.createLineBackground(lineGroup, size);
    this.createLineGrid(lineGroup, size);
    this.createLineSignal(lineGroup, size, lineNum);
    this.createLineBorder(lineGroup, size);

    if (
      this.settings.cropping === 'circle' &&
      this.croppingData !== undefined
    ) {
      const shadowCircle = new Konva.Circle({
        stroke: '#555555',
        strokeWidth: 1,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius,
        shadowColor: 'gray',
        shadowEnabled: true,
        shadowBlur: 5,
        shadowOffset: { x: 2.5, y: 0 },
        shadowOpacity: 1,
      });
      result.add(shadowCircle);
      result.add(lineGroup);
      const borderedCircle = new Konva.Circle({
        stroke: '#555555',
        strokeWidth: 1,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius,
      });
      result.add(borderedCircle);
    }

    return result;
  }

  private createLineSelectionGroup(
    size: Size,
    position: Position,
    lineNum: number,
  ): Konva.Group {
    const result = new Konva.Group({
      name: 'line-selection',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });

    let lineGroup = result;

    if (this.settings.cropping === 'circle' && this.innerWidth !== undefined) {
      lineGroup = this.createCropContainer();
      size = new Size(this.innerWidth, this.innerWidth);
    }

    this.createLineSelection(lineGroup, size);

    if (
      this.settings.cropping === 'circle' &&
      this.croppingData !== undefined
    ) {
      const shadowCircle = new Konva.Circle({
        stroke: '#555555',
        strokeWidth: 1,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius,
        shadowColor: 'gray',
        shadowEnabled: true,
        shadowBlur: 5,
        shadowOffset: { x: 2.5, y: 0 },
        shadowOpacity: 1,
      });
      result.add(shadowCircle);
      result.add(lineGroup);
      const borderedCircle = new Konva.Circle({
        stroke: '#555555',
        strokeWidth: 1,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius,
      });
      result.add(borderedCircle);
    }

    return result;
  }

  private createLineSignal(line: Konva.Group, size: Size, lineNum: number) {
    const frame = new Konva.Shape({
      stroke: this.settings.data.color,
      strokeWidth: 1,
      width: size.width,
      height: size.height,
      sceneFunc: (context, shape) => {
        this.sceneFuncSignal(context, shape, lineNum);
      },
      transformsEnabled: 'position',
    });
    line.add(frame);
  }

  private sceneFuncSignal = (
    context: Konva.Context,
    shape: Konva.Shape,
    lineNum: number,
  ) => {
    if (
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.innerWidth
    ) {
      const timeLineHeight = this.settings.timeline.enabled
        ? this.settings.timeline.height
        : 0;
      const midline = Math.round(
        (this.settings.lineheight - timeLineHeight) / 2,
      );
      const absXPos = lineNum * this.innerWidth;

      const zoomX = this.zoomX;
      const zoomY = this.zoomY;

      const position = {
        x: 0,
        y: 0,
      };
      context.beginPath();
      context.moveTo(
        position.x,
        position.y + midline - this.minmaxarray[absXPos],
      );

      if (
        !(midline === null || midline === undefined) &&
        !(zoomY === null || zoomY === undefined)
      ) {
        for (let x = 0; x + absXPos < absXPos + shape.width(); x++) {
          const xDraw = !this.settings.roundValues
            ? position.x + x * zoomX
            : Math.round(position.x + x * zoomX);
          const yDraw = !this.settings.roundValues
            ? position.y + midline - this.minmaxarray[x + absXPos] * zoomY
            : Math.round(
                position.y + midline - this.minmaxarray[x + absXPos] * zoomY,
              );

          if (!isNaN(yDraw) && !isNaN(xDraw)) {
            context.lineTo(xDraw, yDraw);
          } else {
            context.lineTo(x, midline);
          }
        }
      } else {
        if (midline === undefined || midline === undefined) {
          throw Error('midline is undefined!');
        } else if (zoomY === undefined || zoomY === undefined) {
          throw Error('ZoomY is undefined!');
        }
      }
      context.fillStrokeShape(shape);
    }
  };

  private doPlayHeadAnimation = () => {
    this.updatePlayCursor();
  };

  public updatePlayCursor = () => {
    if (
      this.settings.selection.enabled &&
      this.audioChunk &&
      this.canvasElements?.playHead &&
      this.audioTCalculator &&
      this.audioChunk.relativePlayposition &&
      this.PlayCursor
    ) {
      let currentAbsX = this.audioTCalculator.samplestoAbsX(
        this.audioChunk.relativePlayposition,
      );
      const endAbsX = this.audioTCalculator.samplestoAbsX(
        this.audioChunk.time.end.sub(this.audioChunk.time.start),
      );
      currentAbsX = Math.min(currentAbsX, endAbsX - 1);
      this.changePlayCursorAbsX(currentAbsX);

      // get line of PlayCursor
      const cursorPosition = this.getPlayCursorPositionOfLineByAbsX(
        this.PlayCursor.absX,
      );
      this.canvasElements.playHead.position(cursorPosition);
    }
  };

  private changePlayCursorAbsX = (newValue: number) => {
    if (
      this.audioChunk !== undefined &&
      this.PlayCursor !== undefined &&
      this.audioTCalculator !== undefined
    ) {
      this.PlayCursor.changeAbsX(
        newValue,
        this.audioTCalculator,
        this.AudioPxWidth,
        this.audioChunk,
      );
    }
  };

  updateAllSegments(clearAll = false) {
    let y = 0;
    const segCanvasElements = this.layers?.overlay.find('.segments');
    if (clearAll) {
      segCanvasElements?.forEach((a) => a.destroy());
    }

    const segTimeLabels = this.layers?.overlay.find('#timeStamps');
    if (clearAll) {
      segTimeLabels?.forEach((a) => a.destroy());
    }

    if (clearAll && this.layers?.boundaries) {
      this.layers.boundaries.children.forEach((a) => a.destroy());
      this.layers.boundaries.children = [];
    }

    if (this.innerWidth !== undefined) {
      const maxLineWidth = this.innerWidth;
      let numOfLines = Math.ceil(this.AudioPxWidth / maxLineWidth);
      if (!this.settings.multiLine) {
        numOfLines = 1;
      }

      if (
        this.audioManager !== undefined &&
        this.layers !== undefined &&
        this.layers.overlay !== undefined &&
        this.currentLevel &&
        this.currentLevel.items.length > 0 &&
        this.audioChunk !== undefined &&
        this.viewport &&
        this._innerWidth &&
        this.size
      ) {
        let root: Konva.Group | Konva.Layer = this.layers.overlay;

        if (this.settings.cropping === 'circle' && !this.settings.multiLine) {
          const cropGroup = new Konva.Group({
            clipFunc: (ctx) => {
              if (this.croppingData !== undefined) {
                ctx.arc(
                  this.croppingData.x,
                  this.croppingData.y,
                  this.croppingData.radius,
                  0,
                  Math.PI * 2,
                  false,
                );
              }
            },
          });

          this.layers.overlay.add(cropGroup);
          root = cropGroup;
        }

        const { startIndex, endIndex } = getSegmentsOfRange(
          this.currentLevel.items as OctraAnnotationSegment[],
          this.audioChunk.time.start.clone(),
          this.audioChunk.time.end.clone(),
        );
        const segments = this.currentLevel.items as OctraAnnotationSegment[];

        const boundariesToDraw: {
          x: number;
          y: number;
          num: number;
          id: number;
        }[] = [];

        if (
          this.audioTCalculator !== undefined &&
          startIndex >= 0 &&
          endIndex >= 0 &&
          endIndex >= startIndex
        ) {
          const newShapes: (Group | Shape)[] = [];

          for (let i = startIndex; i <= endIndex; i++) {
            try {
              const segment = segments[i];
              const beginTime =
                i > 0
                  ? segments[i - 1].time.clone()
                  : this.audioManager.createSampleUnit(0);
              const start = beginTime.sub(this.audioChunk.time.start.clone());
              const absXStart = this.audioTCalculator.samplestoAbsX(
                start,
                this.audioChunk.time.duration,
              );
              const absXEnd = this.audioTCalculator.samplestoAbsX(
                segment.time,
                this.audioChunk.time.duration,
              );

              const yStart =
                (this.innerWidth < this.AudioPxWidth
                  ? Math.floor(absXStart / this.innerWidth)
                  : 0) *
                (this.settings.lineheight + this.settings.margin.top);

              const yEnd =
                (this.innerWidth < this.AudioPxWidth
                  ? Math.ceil(absXEnd / this.innerWidth)
                  : 0) *
                (this.settings.lineheight + this.settings.margin.top);

              if (
                this.isVisibleInView(
                  0,
                  yStart,
                  this._innerWidth!,
                  yEnd - yStart === 0
                    ? this.settings.lineheight
                    : yEnd - yStart,
                )
              ) {
                const createdShapes = this.createSegmentOnCanvas(
                  numOfLines,
                  {
                    index: i,
                    segment: segments[i],
                  },
                  { start: startIndex, end: endIndex },
                );

                if (createdShapes) {
                  newShapes.push(createdShapes.overlayGroup);
                }

                // draw boundary
                if (
                  segment.time.samples !==
                    this.audioManager.resource.info.duration.samples &&
                  segment.time.samples <=
                    this.audioManager.resource.info.duration.samples
                ) {
                  let relX = 0;
                  if (this.settings.multiLine) {
                    relX =
                      (absXStart % this.innerWidth) + this.settings.margin.left;
                  } else {
                    relX = absXStart + this.settings.margin.left;
                  }

                  boundariesToDraw.push({
                    x: relX,
                    y: yStart,
                    num: i,
                    id: segment.id,
                  });
                }
              }
            } catch (e) {
              console.error(e);
            }
          }

          // draw time labels
          if (this.settings.showTimePerLine) {
            const foundText = this.layers.overlay.findOne('#timeStamps');
            if (foundText !== undefined) {
              foundText.remove();
            }
            const timeStampLabels = new Konva.Shape({
              id: 'timeStamps',
              width: this.innerWidth,
              height: this.size.height,
              x: this.settings.margin.left,
              y: this.settings.margin.top,
              fontSize: 10,
              fontFamily: 'Arial',
              transformsEnabled: 'position',
              sceneFunc: (context, shape) => {
                this.timeLabelSceneFunction(y, numOfLines, context, shape);
              },
            });
            this.layers.overlay.add(timeStampLabels);
          }

          this.drawAllBoundaries();

          const segmentsGroup = new Konva.Group({
            name: 'segments',
          });
          segmentsGroup.add(...newShapes);
          root.add(segmentsGroup);
        }
      }
    }

    this.bringToFront('#timeStamps');
    this.bringToFront('.line-selections');
  }

  drawAllBoundaries() {
    // draw boundaries after all overlays were drawn

    if (
      this.audioManager !== undefined &&
      this.layers !== undefined &&
      this.layers.overlay !== undefined &&
      this.currentLevel &&
      this.innerWidth &&
      this.currentLevel.items.length > 0 &&
      this.audioChunk !== undefined
    ) {
      let y = 0;
      const { startIndex, endIndex } = getSegmentsOfRange(
        this.currentLevel.items as OctraAnnotationSegment[],
        this.audioChunk.time.start.clone(),
        this.audioChunk.time.end.clone(),
      );
      const segments = this.currentLevel.items as OctraAnnotationSegment[];

      const boundariesToDraw: {
        x: number;
        y: number;
        num: number;
        id: number;
      }[] = [];

      if (this.audioTCalculator !== undefined) {
        for (let i = startIndex; i <= endIndex; i++) {
          try {
            const segment = segments[i];
            const start = segment.time.sub(this.audioChunk.time.start.clone());
            const absX = this.audioTCalculator.samplestoAbsX(
              start,
              this.audioChunk.time.duration,
            );

            y =
              (this.innerWidth < this.AudioPxWidth
                ? Math.floor(absX / this.innerWidth)
                : 0) *
              (this.settings.lineheight + this.settings.margin.top);

            // draw boundary
            if (
              segment.time.samples !==
                this.audioManager.resource.info.duration.samples &&
              segment.time.samples <=
                this.audioManager.resource.info.duration.samples
            ) {
              let relX = 0;
              if (this.settings.multiLine) {
                relX = (absX % this.innerWidth) + this.settings.margin.left;
              } else {
                relX = absX + this.settings.margin.left;
              }

              boundariesToDraw.push({
                x: relX,
                y,
                num: i,
                id: segment.id,
              });
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (this.settings.boundaries.enabled) {
          this.layers.boundaries.children.forEach((a) => a.destroy());
          this.drawNewBoundaries(boundariesToDraw);
          this.layers.boundaries.batchDraw();
        }
      }
    }
  }

  private drawNewBoundaries(
    boundariesToDraw: {
      x: number;
      y: number;
      num: number;
      id: number;
    }[],
  ) {
    if (this.layers) {
      let boundaryRoot: Group | Layer = this.layers.boundaries;
      if (this.settings.cropping === 'circle') {
        boundaryRoot = this.layers.boundaries.findOne(`#boundary-root`) as any;

        if (boundaryRoot === undefined) {
          boundaryRoot = this.createCropContainer('boundary-root');
          this.layers.boundaries.add(boundaryRoot);
        }
      }

      for (const boundary of boundariesToDraw) {
        const h = this.settings.lineheight;

        const foundBoundary = this.layers.boundaries.findOne(
          `#boundary_${boundary.id}`,
        );
        if (foundBoundary !== undefined) {
          foundBoundary.remove();
        }

        const boundaryObj = new Konva.Line({
          id: `boundary_${boundary.id}`,
          strokeWidth: this.settings.boundaries.width,
          stroke: this.settings.boundaries.color,
          points: [boundary.x, boundary.y, boundary.x, boundary.y + h],
          transformsEnabled: 'position',
        });

        boundaryObj.on('mousedown', () => {
          if (!this.settings.boundaries.readonly) {
            this.dragableBoundaryID = boundary.id;
          }
        });
        boundaryObj.on('mouseenter', () => {
          if (this.konvaContainer !== undefined) {
            this.renderer?.setStyle(this.konvaContainer, 'cursor', 'move');
          }
        });
        boundaryObj.on('mouseleave', () => {
          if (this.konvaContainer !== undefined) {
            this.renderer?.setStyle(this.konvaContainer, 'cursor', 'auto');
          }
        });

        boundaryRoot.add(boundaryObj);
      }
    }
  }

  private createSegmentOnCanvas(
    numOfLines: number,
    segmentData: {
      index: number;
      segment: OctraAnnotationSegment;
    },
    segmentInterval: {
      start: number;
      end: number;
    },
  ):
    | {
        overlayGroup: Konva.Group;
      }
    | undefined {
    const { segment, index } = segmentData;

    if (
      this.innerWidth &&
      this.audioManager !== undefined &&
      this.layers !== undefined &&
      this.layers.overlay !== undefined &&
      this.currentLevel &&
      this.currentLevel.items.length > 0 &&
      this.audioChunk !== undefined
    ) {
      if (this.audioTCalculator !== undefined) {
        if (segment !== undefined && segment?.time !== undefined) {
          const start = segment.time.sub(this.audioChunk.time.start.clone());
          const absX = this.audioTCalculator.samplestoAbsX(
            start,
            this.audioChunk.time.duration,
          );
          let beginTime = this.audioManager.createSampleUnit(0);
          const previousSegment: OctraAnnotationSegment | undefined =
            index > segmentInterval.start
              ? (this.currentLevel.items[index - 1] as OctraAnnotationSegment)
              : undefined;

          if (previousSegment && previousSegment.time !== undefined) {
            beginTime = previousSegment.time;
          }
          const beginX = this.audioTCalculator.samplestoAbsX(beginTime);
          const endX = this.audioTCalculator.samplestoAbsX(segment.time);
          const lineNum1 = this.settings.multiLine
            ? Math.floor(beginX / this.innerWidth)
            : 0;
          const lineNum2 = this.settings.multiLine
            ? Math.floor(endX / this.innerWidth)
            : 0;

          const segmentEnd = segment.time.clone();
          const audioChunkStart = this.audioChunk.time.start.clone();
          const audioChunkEnd = this.audioChunk.time.end.clone();
          let overlayGroup: Konva.Group | undefined = undefined;

          if (
            // segment start is in chunk
            (beginTime.samples >= audioChunkStart.samples &&
              beginTime.samples <= audioChunkEnd.samples) ||
            // segment end is in chunk
            (segmentEnd.samples >= audioChunkStart.samples &&
              segmentEnd.samples <= audioChunkEnd.samples) ||
            // segment start and end are out of chunk
            (beginTime.samples <= audioChunkStart.samples &&
              segmentEnd.samples >= audioChunkEnd.samples)
          ) {
            let lastI: number | undefined = 0;
            this.removeSegmentFromCanvas(segment.id); // TODO hier werden segmente entfernt
            const segmentHeight =
              (lineNum2 - lineNum1 + 1) *
              (this.settings.lineheight + this.settings.margin.top);

            overlayGroup = new Konva.Group({
              id: `segment_${segment.id}`,
            });

            const overlaySegment = new Konva.Shape({
              x: this.settings.margin.left,
              y:
                lineNum1 *
                (this.settings.lineheight + this.settings.margin.top),
              fontFamily: 'Arial',
              fontSize: 9,
              width: this.innerWidth,
              height: segmentHeight,
              transformsEnabled: 'position',
              listening: false,
              sceneFunc: (context, shape) => {
                this.sceneFuncOverlay(
                  context,
                  shape,
                  segment,
                  numOfLines,
                  segmentInterval,
                  {
                    start: lineNum1,
                    end: lineNum2,
                  },
                );
              },
            });

            overlayGroup.add(overlaySegment);

            if (this.settings.showTranscripts) {
              const textBackground = new Konva.Shape({
                opacity: 0.75,
                x: this.settings.margin.left,
                y: 0,
                width: this.innerWidth,
                listening: false,
                height: segmentHeight,
                transformsEnabled: 'position',
                sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
                  this.sceneFuncTranscripts(
                    context,
                    shape,
                    segmentInterval,
                    segment,
                    {
                      from: lineNum1,
                      to: lineNum2,
                    },
                    numOfLines,
                  );
                },
              });

              overlayGroup.add(textBackground);
              const segmentText = new Konva.Shape({
                fill: 'black',
                fontFamily: 'Arial',
                fontSize: 11,
                listening: false,
                x: this.settings.margin.left,
                y: 0,
                transformsEnabled: 'position',
                sceneFunc: (context, shape) => {
                  if (
                    this.currentLevel &&
                    this.currentLevel.items.length > 0 &&
                    this.audioManager
                  ) {
                    const segIndex = this.currentLevel.items.findIndex(
                      (a) => a.id === segment.id,
                    );
                    const prevSeg =
                      segIndex > segmentInterval.start
                        ? (this.currentLevel.items[
                            segIndex - 1
                          ] as OctraAnnotationSegment)
                        : undefined;
                    const seg = this.currentLevel.items[
                      segIndex
                    ] as OctraAnnotationSegment;
                    const nextSeg =
                      segIndex < segmentInterval.end
                        ? (this.currentLevel.items[
                            segIndex + 1
                          ] as OctraAnnotationSegment)
                        : undefined;

                    if (seg?.type !== 'segment') {
                      return;
                    }

                    if (
                      seg?.getFirstLabelWithoutName('Speaker')?.value !==
                      undefined
                    ) {
                      lastI = this.drawTextLabel(
                        context,
                        seg.getFirstLabelWithoutName('Speaker')!.value,
                        this.innerWidth! < this.AudioPxWidth
                          ? Math.floor(beginX / this.innerWidth!)
                          : 0,
                        this.innerWidth! < this.AudioPxWidth
                          ? Math.floor(absX / this.innerWidth!)
                          : 0,
                        seg.time.clone(),
                        prevSeg
                          ? prevSeg.time.clone()
                          : this.audioManager.createSampleUnit(0),
                        lastI,
                        numOfLines,
                        seg,
                        segIndex === this.currentLevel.items.length - 1,
                      );
                    }
                  }
                },
              });
              overlayGroup.add(segmentText);
            }
          }

          if (overlayGroup) {
            return {
              overlayGroup,
            };
          }
        }
      }
    } else {
      console.log('no segment created');
    }

    return undefined;
  }

  private sceneFuncTranscripts = (
    context: Konva.Context,
    shape: Konva.Shape,
    segmentInterval: {
      start: number;
      end: number;
    },
    segment: OctraAnnotationSegment,
    lineInterval: {
      from: number;
      to: number;
    },
    numOfLines: number,
  ) => {
    if (this.currentLevel?.items && this.audioManager && this.innerWidth) {
      const segIndex = this.currentLevel.items.findIndex(
        (a) => a.id === segment.id,
      );
      const prevSeg =
        segIndex > segmentInterval.start
          ? (this.currentLevel.items[segIndex - 1] as OctraAnnotationSegment)
          : undefined;
      const seg = this.currentLevel.items[segIndex] as OctraAnnotationSegment;

      this.transcriptBackgroundSceneFunc(
        lineInterval,
        seg,
        segIndex === this.currentLevel.items.length - 1,
        prevSeg ? prevSeg.time.clone() : this.audioManager.createSampleUnit(0),
        numOfLines,
        context,
        shape,
      );
    }
  };

  private sceneFuncOverlay = (
    context: Konva.Context,
    shape: Konva.Shape,
    segment: OctraAnnotationSegment,
    numOfLines: number,
    segmentInterval: {
      start: number;
      end: number;
    },
    lineInterval: {
      start: number;
      end: number;
    },
  ) => {
    if (this.currentLevel?.items && this.audioManager && this.innerWidth) {
      // TODO perhaps there is a problem with segInterval if indices changes
      const segIndex = this.currentLevel.items.findIndex(
        (a) => a.id === segment.id,
      );
      const seg = this.currentLevel.items[segIndex] as OctraAnnotationSegment;
      const prevSeg =
        segIndex > segmentInterval.start
          ? (this.currentLevel.items[segIndex - 1] as OctraAnnotationSegment)
          : undefined;

      const nextSeg =
        segIndex < segmentInterval.end
          ? (this.currentLevel.items[segIndex + 1] as OctraAnnotationSegment)
          : undefined;

      this.overlaySceneFunction(
        {
          from: lineInterval.start,
          to: lineInterval.end,
        },
        seg,
        nextSeg === undefined,
        prevSeg ? prevSeg.time.clone() : this.audioManager.createSampleUnit(0),
        numOfLines,
        context,
        shape,
      );
    }
  };

  /**
   * saves mouse click position
   */
  public async setMouseClickPosition(
    absX: number,
    lineNum: number,
    $event: Event,
  ): Promise<number | undefined> {
    if (this.audioChunk !== undefined) {
      const absXInTime = this.audioTCalculator?.absXChunktoSampleUnit(
        absX,
        this.audioChunk,
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
                (a) => a.id === this._dragableBoundaryID,
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
                segmentAfter?.context?.asr?.isBlockedBy === ASRQueueItemType.ASR
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
            this.updateAllSegments();
          }

          return lineNum;
        } else if (
          this.audioManager.state === PlayBackStatus.PLAYING &&
          $event.type === 'mouseup'
        ) {
          try {
            await this.audioChunk.stopPlayback();

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
                this.audioChunk,
              );

              this._mouseDown = false;
              this._dragableBoundaryID = -1;
            }

            return lineNum;
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    return undefined;
  }

  handleBoundaryDragging(absX: number, absXInTime: SampleUnit, emit = false) {
    let annotation = this.tempAnnotation?.clone();
    const currentLevel =
      annotation?.currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
    const limitPadding = 500;

    const index = currentLevel?.items.findIndex(
      (a) => a.id === this._dragableBoundaryID,
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
              this.audioChunk,
            )!;

            if (
              previousSegment &&
              newTime.samples < previousSegment.time.samples + limitPadding
            ) {
              newTime = previousSegment.time.add(
                this.audioManager.createSampleUnit(limitPadding),
              );
            } else if (
              nextSegment &&
              newTime.samples > nextSegment.time.samples - limitPadding
            ) {
              newTime = nextSegment.time.sub(
                this.audioManager.createSampleUnit(limitPadding),
              );
            }

            segment.time = newTime;
            annotation.changeCurrentSegmentBySamplePosition(
              segment.time,
              segment,
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
                this.audioChunk,
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
                    currentLevelElement.id,
                  );
                  newItem.time = currentLevelElement.time.add(
                    this.audioManager.createSampleUnit(diff),
                  );
                  annotation = annotation.changeCurrentItemById(
                    currentLevelElement.id,
                    newItem,
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
                    currentLevelElement.id,
                  );
                  newItem.time = currentLevelElement.time.add(
                    this.audioManager.createSampleUnit(diff),
                  );
                  annotation = annotation.changeCurrentItemById(
                    currentLevelElement.id,
                    newItem,
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
          this.audioChunk,
        );
      }
    }
  }

  onKeyUp = (event: KeyboardEvent) => {
    this.shiftPressed = false;
    this.shortcutsManager.checkKeyEvent(event, Date.now());
  };

  /**
   * destroy this audioviewer object
   */
  public destroy() {
    this.subscrManager.destroy();
    this.stage?.destroy();

    this.konvaContainer?.removeEventListener('keydown', this.onKeyDown);
    this.konvaContainer?.removeEventListener('keyup', this.onKeyUp);
    this.konvaContainer?.removeEventListener('mouseleave', this.onMouseLeave);
    this.konvaContainer?.removeEventListener('mouseenter', this.onMouseEnter);
    this.konvaContainer?.removeEventListener('mousemove', this.onMouseMove);
    this.konvaContainer?.removeEventListener('mousedown', this.mouseChange);
    this.konvaContainer?.removeEventListener('mouseup', this.mouseChange);
  }

  private onMouseEnter = () => {
    this.stage?.container().focus();
    this._focused = true;
  };

  private onMouseLeave = () => {
    this._focused = false;
  };

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
      this.AudioPxWidth,
    );
    this.MouseClickPos = this.audioManager.createSampleUnit(0);
    this._mouseCursor = this.audioManager.createSampleUnit(0);
    this.PlayCursor = new PlayCursor(
      0,
      new SampleUnit(0, this.audioChunk.sampleRate),
      this._innerWidth,
    );
    this._drawnSelection = this.audioChunk.selection.clone();
    this._drawnSelection.end = this._drawnSelection.start.clone();

    return this.afterChannelInitialized();
  };

  public async refreshComputedData(): Promise<void> {
    if (this.audioManager !== undefined && this.audioChunk !== undefined) {
      this._minmaxarray = await this.computeWholeDisplayData(
        this.AudioPxWidth / 2,
        this._settings.lineheight,
        this.audioManager.channel!,
        {
          start: Math.ceil(
            this.audioChunk.time.start.samples /
              this.audioManager.channelDataFactor,
          ),
          end: Math.min(
            this.audioManager.channel!.length,
            Math.ceil(
              this.audioChunk.time.end.samples /
                this.audioManager.channelDataFactor,
            ),
          ),
        },
      );
    } else {
      throw new Error('audioManager or audioChunk is undefined');
    }
  }

  private isVisibleInView(x: number, y: number, width: number, height: number) {
    if (this.viewport) {
      const view = this.viewport;
      const { topLeft, topRight, bottomLeft, bottomRight } = {
        topLeft: {
          x,
          y,
        },
        topRight: {
          x: x + width,
          y,
        },
        bottomLeft: {
          x,
          y: y + height,
        },
        bottomRight: {
          x: x + width,
          y: y + height,
        },
      };

      return Konva.Util.haveIntersection(
        {
          x,
          y,
          width,
          height,
        },
        {
          x: view.x,
          y: view.y,
          height: view.height,
          width: view.width,
        },
      );
    }
    return false;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const shortcutInfo = this.shortcutsManager.checkKeyEvent(event, Date.now());

    this.shiftPressed =
      event.keyCode === 16 ||
      event.code?.includes('Shift') ||
      event.key?.includes('Shift');

    if (shortcutInfo !== undefined) {
      const comboKey = shortcutInfo.shortcut;

      if (this.settings.shortcutsEnabled) {
        if (this._focused && this.isDisabledKey(comboKey)) {
          // key pressed is disabled by config
          event.preventDefault();
        } else {
          const shortcutName = shortcutInfo.shortcutName;
          const focuscheck =
            shortcutInfo.onFocusOnly === false ||
            shortcutInfo.onFocusOnly === this._focused;

          if (focuscheck) {
            switch (shortcutName) {
              case 'undo':
                if (
                  this.settings.boundaries.enabled &&
                  this._focused &&
                  !this.settings.boundaries.readonly
                ) {
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    type: 'application',
                    timePosition: this?.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });
                }
                break;
              case 'redo':
                if (
                  this.settings.boundaries.enabled &&
                  this._focused &&
                  !this.settings.boundaries.readonly
                ) {
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    type: 'application',
                    timePosition: this?.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });
                }
                break;
              case 'set_boundary':
                if (
                  this.settings.boundaries.enabled &&
                  !this.settings.boundaries.readonly &&
                  this._focused &&
                  this.audioManager !== undefined &&
                  this.annotation?.currentLevel?.items
                ) {
                  const result = this.addOrRemoveSegment();
                  if (result !== undefined && result.msg !== undefined) {
                    if (result.msg.text && result.msg.text !== '') {
                      this.alert.emit({
                        type: result.msg.type,
                        message: result.msg.text,
                      });
                    } else if (result.type !== undefined) {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: result.type,
                        type: 'boundary',
                        timePosition: this.audioManager.createSampleUnit(
                          result.seg_samples,
                        ),
                        timestamp: shortcutInfo.timestamp,
                      });
                    }
                  }
                }
                break;
              case 'set_break':
                if (
                  this.settings.boundaries.enabled &&
                  this._focused &&
                  this.mouseCursor !== undefined
                ) {
                  const xSamples = this.mouseCursor.clone();

                  if (
                    xSamples !== undefined &&
                    this.currentLevel &&
                    this.currentLevel.items.length > 0
                  ) {
                    const segmentI = getSegmentBySamplePosition(
                      this.currentLevel.items as OctraAnnotationSegment[],
                      xSamples,
                    );
                    if (
                      this.currentLevel.type === AnnotationLevelType.SEGMENT
                    ) {
                      const segment = this.currentLevel.items[
                        segmentI
                      ] as OctraAnnotationSegment<ASRContext>;

                      if (
                        segmentI > -1 &&
                        segment.context?.asr?.isBlockedBy === undefined &&
                        this.silencePlaceholder !== undefined
                      ) {
                        if (
                          segment.getFirstLabelWithoutName('Speaker')?.value !==
                          this.silencePlaceholder
                        ) {
                          segment.changeFirstLabelWithoutName(
                            'Speaker',
                            this.silencePlaceholder,
                          );
                          this.shortcut.emit({
                            shortcut: comboKey,
                            shortcutName,
                            value: 'set_break',
                            type: 'segment',
                            timePosition: xSamples.clone(),
                            timestamp: shortcutInfo.timestamp,
                          });
                        } else {
                          segment.changeFirstLabelWithoutName('Speaker', '');
                          this.shortcut.emit({
                            shortcut: comboKey,
                            shortcutName,
                            value: 'remove_break',
                            type: 'segment',
                            timePosition: xSamples.clone(),
                            timestamp: shortcutInfo.timestamp,
                          });
                        }
                        this.changeSegment(xSamples, segment);
                        this.redraw();
                      }
                    }
                  }
                }
                break;
              case 'play_selection':
                if (
                  this._focused &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.audioChunk !== undefined &&
                  this.audioManager !== undefined &&
                  this.mouseCursor !== undefined
                ) {
                  const xSamples = this.mouseCursor.clone();

                  const boundarySelect = this.getSegmentSelection(
                    this.mouseCursor.samples,
                  );
                  if (boundarySelect) {
                    const segmentI = getSegmentBySamplePosition(
                      this.currentLevel
                        .items as OctraAnnotationSegment<ASRContext>[],
                      xSamples,
                    );
                    if (segmentI > -1) {
                      if (
                        this.currentLevel.type === AnnotationLevelType.SEGMENT
                      ) {
                        const currentLevel = this
                          .currentLevel as OctraAnnotationSegmentLevel<
                          OctraAnnotationSegment<ASRContext>
                        >;
                        const segment = currentLevel.items[segmentI];

                        const startTime = getStartTimeBySegmentID(
                          currentLevel.items as OctraAnnotationSegment<ASRContext>[],
                          segment.id,
                        );

                        // make shure, that segments boundaries are visible
                        if (
                          segment?.time !== undefined &&
                          (startTime as any).samples >=
                            this.audioChunk.time.start.samples &&
                          segment.time.samples <=
                            this.audioChunk.time.end.samples + 1 &&
                          this.audioTCalculator !== undefined
                        ) {
                          const absX = this.audioTCalculator.samplestoAbsX(
                            segment.time,
                          );
                          this.audioChunk.selection = boundarySelect.clone();
                          this.drawnSelection = boundarySelect.clone();
                          this.selchange.emit(this.audioChunk.selection);
                          this.drawWholeSelection();

                          const begin = (
                            segmentI > 0
                              ? this.currentLevel.items[segmentI - 1]
                              : this.annotation!.createSegment(
                                  this.audioManager.createSampleUnit(0),
                                  [new OLabel(this.currentLevel.name, '')],
                                )
                          ) as OctraAnnotationSegment<ASRContext>;

                          if (
                            begin?.time !== undefined &&
                            this.innerWidth !== undefined
                          ) {
                            const beginX = this.audioTCalculator.samplestoAbsX(
                              begin.time,
                            );

                            const posY1 =
                              this.innerWidth < this.AudioPxWidth
                                ? Math.floor(beginX / this.innerWidth + 1) *
                                    (this.settings.lineheight +
                                      this.settings.margin.bottom) -
                                  this.settings.margin.bottom
                                : 0;

                            const posY2 =
                              this.innerWidth < this.AudioPxWidth
                                ? Math.floor(absX / this.innerWidth + 1) *
                                    (this.settings.lineheight +
                                      this.settings.margin.bottom) -
                                  this.settings.margin.bottom
                                : 0;

                            if (
                              xSamples.samples >=
                                this.audioChunk.selection.start.samples &&
                              xSamples.samples <=
                                this.audioChunk.selection.end.samples
                            ) {
                              this.audioChunk.absolutePlayposition =
                                this.audioChunk.selection.start.clone();
                              this.changePlayCursorSamples(
                                this.audioChunk.selection.start,
                              );
                              this.updatePlayCursor();

                              this.shortcut.emit({
                                shortcut: comboKey,
                                shortcutName,
                                value: shortcutName,
                                type: 'audio',
                                timePosition: xSamples.clone(),
                                selection: boundarySelect.clone(),
                                timestamp: shortcutInfo.timestamp,
                              });

                              this.audioChunk.stopPlayback().then(() => {
                                if (this.audioChunk !== undefined) {
                                  // after stopping start audio playback
                                  this.audioChunk.selection =
                                    boundarySelect.clone();
                                  this.playSelection(this.afterAudioEnded);
                                }
                              });
                            }

                            if (!this.settings.multiLine) {
                              this.segmententer.emit({
                                index: segmentI,
                                pos: { Y1: posY1, Y2: posY2 },
                              });
                            }
                          } else {
                            this.alert.emit({
                              type: 'error',
                              message: 'segment invisible',
                            });
                          }
                        }
                      }
                    }
                  }
                }
                break;
              case 'delete_boundaries':
                if (
                  this.settings.boundaries.enabled &&
                  !this.settings.boundaries.readonly &&
                  this._focused &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.audioManager !== undefined
                ) {
                  let start = undefined;
                  let end = undefined;
                  const removedIDs: number[] = [];

                  if (this.currentLevel.items.length > 0) {
                    this.shortcut.emit({
                      shortcut: comboKey,
                      shortcutName,
                      value: shortcutName,
                      type: 'audio',
                      timePosition: this.mouseCursor?.clone(),
                      selection: this.drawnSelection?.clone(),
                      timestamp: shortcutInfo.timestamp,
                    });

                    for (let i = 0; i < this.currentLevel.items.length; i++) {
                      const segment = this.currentLevel.items[
                        i
                      ] as OctraAnnotationSegment<ASRContext>;

                      if (segment?.time !== undefined) {
                        if (
                          this.drawnSelection !== undefined &&
                          segment.time.samples >=
                            this.drawnSelection.start.samples &&
                          segment.time.samples <=
                            this.drawnSelection.end.samples &&
                          i < this.currentLevel.items.length - 1
                        ) {
                          this.removeSegmentByIndex(
                            i,
                            this.silencePlaceholder,
                            true,
                            false,
                          );
                          removedIDs.push(segment.id);
                          i--;
                          if (start === undefined) {
                            start = i;
                          }
                          end = i;
                        } else if (
                          this.drawnSelection !== undefined &&
                          this.drawnSelection.end.samples < segment.time.samples
                        ) {
                          break;
                        }
                      }
                    }
                  }

                  if (
                    start !== undefined &&
                    end !== undefined &&
                    this.drawnSelection !== undefined
                  ) {
                    this.drawnSelection.start =
                      this.audioManager.createSampleUnit(0);
                    this.drawnSelection.end = this.drawnSelection.start.clone();
                  }

                  if (removedIDs && removedIDs.length > 0) {
                    this.annotationChange.emit(this.annotation);
                    this.currentLevelChange.emit({
                      type: 'remove',
                      items: removedIDs.map((a) => ({
                        id: a,
                      })),
                      removeOptions: {
                        silenceCode: this.silencePlaceholder,
                        mergeTranscripts: true,
                      },
                    });
                  }
                }
                break;
              case 'segment_enter':
                if (
                  this.settings.boundaries.enabled &&
                  !this.settings.boundaries.readonly &&
                  this._focused &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.stage !== undefined &&
                  this.mouseCursor !== undefined
                ) {
                  event.preventDefault();
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'segment',
                    timePosition: this.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });

                  const segInde = getSegmentBySamplePosition(
                    this.currentLevel
                      .items as OctraAnnotationSegment<ASRContext>[],
                    this.mouseCursor,
                  );
                  this.selectSegment(segInde)
                    .then(({ posY1, posY2 }) => {
                      this._focused = false;
                      this.drawWholeSelection();
                      this.stage?.draw();
                      this.segmententer.emit({
                        index: segInde,
                        pos: { Y1: posY1, Y2: posY2 },
                      });
                    })
                    .catch(() => {
                      this.alert.emit({
                        type: 'error',
                        message: 'segment invisible',
                      });
                    });
                }
                break;
              case 'cursor_left':
                if (
                  this._focused &&
                  this.audioManager !== undefined &&
                  this.mouseCursor !== undefined
                ) {
                  // move cursor to left
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'mouse',
                    timePosition: this.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });
                  this.moveCursor(
                    'left',
                    this.settings.stepWidthRatio * this.audioManager.sampleRate,
                  );
                  this.changeMouseCursorSamples(this.mouseCursor);
                  this.mousecursorchange.emit({
                    event: undefined,
                    time: this.mouseCursor,
                  });
                }
                break;
              case 'cursor_right':
                if (
                  this._focused &&
                  this.audioManager !== undefined &&
                  this.mouseCursor !== undefined
                ) {
                  // move cursor to right
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'mouse',
                    timePosition: this.mouseCursor.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });

                  this.moveCursor(
                    'right',
                    this.settings.stepWidthRatio * this.audioManager.sampleRate,
                  );
                  this.changeMouseCursorSamples(this.mouseCursor);
                  this.mousecursorchange.emit({
                    event: undefined,
                    time: this.mouseCursor,
                  });
                }
                break;
              case 'playonhover':
                if (
                  this._focused &&
                  !this.settings.boundaries.readonly &&
                  this.mouseCursor !== undefined
                ) {
                  // move cursor to right
                  this.shortcut.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'option',
                    timePosition: this.mouseCursor.clone(),
                    timestamp: shortcutInfo.timestamp,
                  });
                }
                break;

              case 'do_asr':
                if (
                  this.settings.boundaries.enabled &&
                  this.focused &&
                  this.settings.asr.enabled &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.mouseCursor !== undefined
                ) {
                  const segmentI = getSegmentBySamplePosition(
                    this.currentLevel
                      .items as OctraAnnotationSegment<ASRContext>[],
                    this.mouseCursor,
                  );
                  const segment = this.currentLevel.items[
                    segmentI
                  ] as OctraAnnotationSegment<ASRContext>;

                  if (segmentI > -1) {
                    if (segment?.context?.asr?.isBlockedBy === undefined) {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_asr',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    } else {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_asr',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    }
                  }
                }
                break;
              case 'do_asr_maus':
                if (
                  this.settings.boundaries.enabled &&
                  this.settings.asr.enabled &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.mouseCursor !== undefined
                ) {
                  const segmentI = getSegmentBySamplePosition(
                    this.currentLevel
                      .items as OctraAnnotationSegment<ASRContext>[],
                    this.mouseCursor,
                  );
                  const segment = this.currentLevel.items[
                    segmentI
                  ] as OctraAnnotationSegment<ASRContext>;

                  if (segmentI > -1) {
                    if (segment?.context?.asr?.isBlockedBy === undefined) {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_asr_maus',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    } else {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_asr_maus',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    }
                  }
                }
                break;

              case 'do_maus':
                if (
                  this.settings.boundaries.enabled &&
                  this.settings.asr.enabled &&
                  this.currentLevel?.items &&
                  this.currentLevel.items.length > 0 &&
                  this.mouseCursor !== undefined
                ) {
                  const segmentI = getSegmentBySamplePosition(
                    this.currentLevel
                      .items as OctraAnnotationSegment<ASRContext>[],
                    this.mouseCursor,
                  );
                  const segment = this.currentLevel.items[
                    segmentI
                  ] as OctraAnnotationSegment<ASRContext>;

                  if (segmentI > -1) {
                    if (segment?.context?.asr?.isBlockedBy === undefined) {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_maus',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    } else {
                      this.shortcut.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_maus',
                        type: 'segment',
                        timePosition: this.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp,
                      });
                    }
                  }
                }
                break;
            }
          }
        }
      }
    }
  };

  /**
   * playSelection() plays the selected signal fragment or the selection in this chunk
   */
  playSelection = (afterAudioEnded: () => void) => {
    this.audioChunk
      ?.startPlayback()
      .then(() => {
        if (this.audioChunk !== undefined) {
          if (
            this.drawnSelection !== undefined &&
            this.drawnSelection.duration.samples > 0
          ) {
            this.audioChunk.selection = this.drawnSelection.clone();
            this.audioChunk.absolutePlayposition =
              this.audioChunk.selection.start.clone();
          }
          afterAudioEnded();
        }
      })
      .catch((error: any) => {
        console.error(error);
      });
  };

  public async selectSegment(
    segIndex: number,
  ): Promise<{ posY1: number; posY2: number }> {
    if (
      segIndex > -1 &&
      this.currentLevel &&
      this.currentLevel.items.length > 0 &&
      this.audioChunk !== undefined &&
      this.audioManager !== undefined
    ) {
      const segment = this.currentLevel.items[
        segIndex
      ] as OctraAnnotationSegment;
      if (segment.type !== 'segment') {
        throw new Error("Segment is not of type 'segment'");
      }
      const items = this.currentLevel.items as OctraAnnotationSegment[];

      const startTime = getStartTimeBySegmentID(items, segment.id);

      // make shure, that segments boundaries are visible
      if (
        segment?.time?.samples !== undefined &&
        this.audioTCalculator !== undefined &&
        (startTime as any).samples >= this.audioChunk.time.start.samples &&
        segment.time.samples <= this.audioChunk.time.end.samples + 1 &&
        this.innerWidth !== undefined
      ) {
        const absX = this.audioTCalculator.samplestoAbsX(segment.time);
        let begin: OctraAnnotationSegment;

        if (segIndex > 0) {
          begin = items[segIndex - 1];
        } else {
          begin = new OctraAnnotationSegment(
            this.getNextItemID(),
            this.audioManager.createSampleUnit(0),
            [],
          );
        }

        const beginX = this.audioTCalculator.samplestoAbsX(begin.time);
        const posY1 =
          this.innerWidth < this.AudioPxWidth
            ? Math.floor(beginX / this.innerWidth + 1) *
                (this.settings.lineheight + this.settings.margin.bottom) -
              this.settings.margin.bottom
            : 0;

        let posY2 = 0;

        if (this.innerWidth < this.AudioPxWidth) {
          posY2 =
            Math.floor(absX / this.innerWidth + 1) *
              (this.settings.lineheight + this.settings.margin.bottom) -
            this.settings.margin.bottom;
        }

        const boundarySelect = this.getSegmentSelection(
          segment.time.samples - 1,
        );
        if (boundarySelect) {
          this.audioChunk.selection = boundarySelect;
          this.drawnSelection = boundarySelect.clone();
          this.settings.selection.color = 'gray';
          this.audioChunk.absolutePlayposition =
            this.audioChunk.selection.start.clone();
          this.changePlayCursorSamples(this.audioChunk.selection.start);
          this.updatePlayCursor();

          if (this.audioManager.isPlaying) {
            this.audioManager.stopPlayback().catch((error: any) => {
              console.error(error);
            });
          }
        }

        return { posY1, posY2 };
      } else {
        throw new Error('Segment not selected.');
      }
    } else {
      throw new Error('Invalid segment');
    }
  }

  /**
   * checks if the comboKey is part of the list of disabled keys
   */
  private isDisabledKey(comboKey: string): boolean {
    for (const disabledKey of this.settings.disabledKeys) {
      if (disabledKey === comboKey) {
        return true;
      }
    }

    return false;
  }

  /**
   * change samples of playcursor
   */
  public changePlayCursorSamples = (
    newValue: SampleUnit,
    chunk?: AudioChunk,
  ) => {
    if (this.PlayCursor !== undefined && this.audioTCalculator !== undefined) {
      this.PlayCursor.changeSamples(newValue, this.audioTCalculator, chunk);
      this.playcursorchange.emit(this.PlayCursor);
    }
  };

  /**
   * computeDisplayData() generates an array of min-max pairs representing the
   * audio signal. The values of the array are float in the range -1 .. 1.
   */
  async computeWholeDisplayData(
    width: number,
    height: number,
    cha: Float32Array,
    _interval: { start: number; end: number },
  ): Promise<number[]> {
    return new Promise<number[]>((resolve, reject) => {
      const promises = [];

      const numberOfPieces = 8;

      const xZoom = (_interval.end - _interval.start) / width;

      let piece = Math.floor(width / numberOfPieces);
      const samplePiece = Math.floor(
        (_interval.end - _interval.start) / numberOfPieces,
      );

      for (let i = 1; i <= numberOfPieces; i++) {
        const start = _interval.start + (i - 1) * samplePiece;
        let end = start + samplePiece;
        if (i === numberOfPieces) {
          // make sure to fit whole width
          piece = Math.round(width - piece * (numberOfPieces - 1));
          end = Math.ceil(_interval.end);
        }
        const tsJob = new TsWorkerJob<
          [
            width: number,
            height: number,
            channel: Float32Array,
            interval: {
              start: number;
              end: number;
            },
            roundValues: boolean,
            xZoom: number,
          ],
          number[]
        >(
          this.computeDisplayData,
          piece,
          height,
          cha.slice(start, end),
          {
            start,
            end,
          },
          this._settings.roundValues,
          xZoom,
        );

        promises.push(this.multiThreadingService.run<number[]>(tsJob));
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
    innerWidth: number,
  ): { start: number; end: number } {
    if (this.audioTCalculator !== undefined && this.audioChunk !== undefined) {
      const absX = lineNum * innerWidth;
      const absEnd = absX + lineWidth;
      const selAbsStart = this.audioTCalculator.samplestoAbsX(
        startSamples.sub(this.audioChunk.time.start),
      );
      const selAbsEnd = this.audioTCalculator.samplestoAbsX(
        endSamples.sub(this.audioChunk.time.start),
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
        this.audioChunk,
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
          this.layers?.overlay.batchDraw();
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
        this.audioChunk,
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
          this._drawnSelection.start.samples,
        );
        const segm2 = betweenWhichSegment(
          this.annotation.currentLevel
            .items as OctraAnnotationSegment<ASRContext>[],
          this._drawnSelection.end.samples,
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
          this.audioManager!.createSampleUnit(Math.round(absXTime)),
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
    positionSamples: number,
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
              firstSegment.time,
            );
          } else if (positionSamples > lastSegment.time.samples) {
            // select in first Boundary
            const seg = lastSegment.time.clone();
            result = new AudioSelection(
              seg,
              this.audioManager.resource.info.duration,
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
                    currentSegment.time,
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
                this.audioManager.createSampleUnit(samples),
              );
            }
          } else if (direction === 'right') {
            if (
              this._mouseCursor.samples <=
              this.audioChunk.time.end.samples - samples
            ) {
              this._mouseCursor = this._mouseCursor.add(
                this.audioManager.createSampleUnit(samples),
              );
            }
          }
        }
      } else {
        throw new Error(
          'can not move cursor by given samples. Number of samples less than 0.',
        );
      }
    }
  }

  /**
   *
   * IMPORTANT! DON'T make async from this method, because it's not working with async in a web worker!
   *
   * @param width
   * @param height
   * @param channel
   * @param interval
   * @param roundValues
   * @param xZoom
   */
  private computeDisplayData = (
    width: number,
    height: number,
    channel: Float32Array,
    interval: {
      start: number;
      end: number;
    },
    roundValues: boolean,
    xZoom: number,
  ) => {
    return new Promise<number[]>((resolve, reject) => {
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
   * after Channel was initialized
   */
  private async afterChannelInitialized(calculateZoom = true): Promise<void> {
    try {
      await this.refreshComputedData();

      if (calculateZoom) {
        this.calculateZoom(
          this._settings.lineheight,
          this.AudioPxWidth,
          this._minmaxarray,
        );
      }
      if (this.audioChunk !== undefined) {
        this.audioChunk.absolutePlayposition =
          this.audioChunk.time.start.clone();
      }
      this.channelInitialized.next();
      this.channelInitialized.complete();
    } catch (e) {
      console.error(e);
      this.channelInitialized.error(e);
    }
  }

  private addNewSegmentOnCanvas(id: number) {
    if (this.innerWidth !== undefined) {
      const maxLineWidth = this.innerWidth;
      let numOfLines = Math.ceil(this.AudioPxWidth / maxLineWidth);
      if (!this.settings.multiLine) {
        numOfLines = 1;
      }

      if (
        this.audioManager !== undefined &&
        this.layers !== undefined &&
        this.layers.overlay !== undefined &&
        this.currentLevel &&
        this.audioTCalculator &&
        this.currentLevel.items.length > 0 &&
        this.audioChunk !== undefined
      ) {
        const segments = this.currentLevel.items as OctraAnnotationSegment[];
        const i = this.currentLevel.items.findIndex((a) => a.id === id);
        const segment = segments[i];
        const start = segment.time.sub(this.audioChunk.time.start);
        const absX = this.audioTCalculator.samplestoAbsX(
          start,
          this.audioChunk.time.duration,
        );
        const y =
          (this.innerWidth < this.AudioPxWidth
            ? Math.floor(absX / this.innerWidth)
            : 0) *
          (this.settings.lineheight + this.settings.margin.top);
        const { startIndex, endIndex } = getSegmentsOfRange(
          this.currentLevel.items as OctraAnnotationSegment[],
          this.audioChunk.time.start,
          this.audioChunk.time.end,
        );
        const root: Konva.Group | Konva.Layer = this.layers.overlay;

        const boundariesToDraw: {
          x: number;
          y: number;
          num: number;
          id: number;
        }[] = [];

        const createdShapes = this.createSegmentOnCanvas(
          numOfLines,
          {
            index: i,
            segment: segment,
          },
          { start: startIndex, end: endIndex },
        );

        if (createdShapes) {
          root.add(createdShapes.overlayGroup);
        }

        // draw boundary
        if (
          segment.time.samples !==
            this.audioManager.resource.info.duration.samples &&
          segment.time.samples <=
            this.audioManager.resource.info.duration.samples
        ) {
          let relX = 0;
          if (this.settings.multiLine) {
            relX = (absX % this.innerWidth) + this.settings.margin.left;
          } else {
            relX = absX + this.settings.margin.left;
          }

          boundariesToDraw.push({
            x: relX,
            y,
            num: i,
            id: segment.id,
          });
        }

        this.drawNewBoundaries(boundariesToDraw);
      }
    }
  }

  private timeLabelSceneFunction = (
    y: number,
    numOfLines: number,
    context: Konva.Context,
    shape: Konva.Shape,
  ) => {
    if (
      this.canvasElements?.lastLine !== undefined &&
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.audioChunk !== undefined &&
      this.innerWidth !== undefined &&
      this.innerWidth
    ) {
      for (let j = 0; j < numOfLines; j++) {
        // draw time label
        y = j * (this.settings.lineheight + this.settings.margin.top);

        let startTime =
          this.audioChunk.time.start.unix + j * (this.secondsPerLine * 1000);
        let endTime = 0;

        if (numOfLines > 1) {
          endTime = Math.min(
            startTime + this.secondsPerLine * 1000,
            this.audioChunk.time.duration.unix,
          );
          endTime = Math.ceil(endTime / 1000) * 1000;
          startTime = Math.floor(startTime / 1000) * 1000;
        } else {
          endTime =
            this.audioChunk.time.start.unix +
            this.audioChunk.time.duration.unix;
        }

        const pipe = new TimespanPipe();
        const maxDuration = this.audioChunk.time.duration.unix;
        const startTimeString = pipe.transform(startTime, {
          showHour: true,
          showMilliSeconds: !this.settings.multiLine,
          maxDuration,
        });
        const endTimeString = pipe.transform(endTime, {
          showHour: true,
          showMilliSeconds: !this.settings.multiLine,
          maxDuration,
        });
        const length = this.layers.overlay
          .getContext()
          .measureText(startTimeString).width;
        context.fillStyle = 'dimgray';
        context.fillText(startTimeString, 3, y + 8);
        context.fillText(
          endTimeString,
          (j < numOfLines - 1
            ? this.innerWidth
            : this.canvasElements.lastLine.width()) -
            length -
            3,
          y + 8,
        );
      }
    }
  };

  public removeSegmentByIndex(
    index: number,
    silenceCode: string | undefined,
    mergeTranscripts: boolean,
    triggerChange = true,
    changeTranscript?: (transcript: string) => string,
  ) {
    if (this.annotation?.currentLevel) {
      this.annotation?.removeItemByIndex(
        index,
        silenceCode,
        mergeTranscripts,
        changeTranscript,
      );
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
        "Can't remove segment by index: current level is undefined",
      );
    }
  }

  public addSegment(start: SampleUnit, value?: string) {
    const result = this.annotation!.addItemToCurrentLevel(
      start,
      value ? [new OLabel(this.currentLevel!.name, value)] : undefined,
    );
    this.currentLevelChange.emit({
      type: 'add',
      items: [
        {
          instance: this.annotation!.createSegment(
            start,
            value ? [new OLabel(this.currentLevel!.name, value)] : undefined,
          ),
        },
      ],
    });
    this.annotationChange.emit(result);
  }

  public changeSegment(start: SampleUnit, segment: OctraAnnotationSegment) {
    const result = this.annotation!.changeCurrentSegmentBySamplePosition(
      start,
      segment,
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
    newAnnotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>,
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
      annotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>,
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
        (a) => a.id === oldAnnoLevel.id,
      );

      if (!newLevel) {
        // level was removed
        result.push({
          type: 'remove',
          affectedLevelID: oldAnnoLevel.id,
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
              if (item.type === 'segment' && found.type === 'segment') {
                if (
                  !(item as OctraAnnotationSegment).isEqualWith(
                    found as OctraAnnotationSegment,
                  )
                ) {
                  // changed
                  result.push({
                    type: 'change',
                    affectedLevelID: newLevel.id,
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
                  (a) => a !== item.id,
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id,
                );
              } else if (item.type === 'event' && found.type === 'event') {
                if (
                  !(item as OctraAnnotationEvent).isEqualWith(
                    found as OctraAnnotationEvent,
                  )
                ) {
                  // changed
                  result.push({
                    type: 'change',
                    affectedLevelID: newLevel.id,
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
                  (a) => a !== item.id,
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id,
                );
              } else if (item.type === 'item' && found.type === 'item') {
                if (!(item as OItem).isEqualWith(found as OItem)) {
                  // changed
                  result.push({
                    type: 'change',
                    affectedLevelID: newLevel.id,
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
                  (a) => a !== item.id,
                );
                state.new.itemIDs = state.new.itemIDs.filter(
                  (a) => a !== item.id,
                );
              } else {
                throw new Error("Can't find correct item instance");
              }
            } else {
              // types changed
              result.push({
                type: 'change',
                affectedLevelID: newLevel.id,
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
                (a) => a !== item.id,
              );
              state.new.itemIDs = state.new.itemIDs.filter(
                (a) => a !== item.id,
              );
            }
          } else {
            // newAnnotation doesn't have this item => was removed
            result.push({
              type: 'remove',
              affectedLevelID: newLevel.id,
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
          (a) => a !== oldAnnoLevel.id,
        );
        state.new.levelIDs = state.new.levelIDs.filter(
          (a) => a !== oldAnnoLevel.id,
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
          affectedLevelID: level.id,
          level: {
            old: undefined,
            new: level,
          },
        });

        state.new.itemIDs = state.new.itemIDs.filter(
          (a) => level.items.find((b) => b.id === a) === undefined,
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
          affectedLevelID: level.id,
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
            affectedLevelID: -1,
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
          (a) => a.id === id,
        )!;
        result.push({
          type: 'add',
          affectedLevelID: -1,
          link: {
            old: undefined,
            new: link,
          },
        });
      }
    }

    return result;
  }

  private transcriptBackgroundSceneFunc = (
    lineInterval: {
      from: number;
      to: number;
    },
    segment: OctraAnnotationSegment,
    isLastSegment: boolean,
    beginTime: SampleUnit,
    numOfLines: number,
    context: Context,
    shape: Shape,
  ) => {
    const viewY =
      lineInterval.from * (this.settings.lineheight + this.settings.margin.top);
    const viewHeight =
      (lineInterval.to + 1) *
        (this.settings.lineheight + this.settings.margin.top) -
      viewY;

    if (
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.canvasElements?.lastLine !== undefined &&
      this.innerWidth !== undefined
    ) {
      for (let j = lineInterval.from; j <= lineInterval.to; j++) {
        const localY =
          j * (this.settings.lineheight + this.settings.margin.top);

        if (segment?.time !== undefined) {
          const lineWidth =
            j < numOfLines - 1
              ? this.innerWidth
              : this.canvasElements.lastLine.width();
          const select = this.getRelativeSelectionByLine(
            j,
            lineWidth,
            beginTime,
            segment?.time,
            this.innerWidth,
          );

          let w = 0;
          let x = select.start;

          if (select.start > -1 && select.end > -1) {
            w = Math.abs(select.end - select.start);
          }

          if (select.start < 1 || select.start > lineWidth) {
            x = 1;
          }
          if (select.end < 1) {
            w = 0;
          }
          if (select.end < 1 || select.end > lineWidth) {
            w = select.end;
          }

          if (j === numOfLines - 1 && isLastSegment) {
            w = lineWidth - select.start + 1;
          }

          context.fillStyle = 'white';
          context.clearRect(x, localY + this.settings.lineheight - 20, w, 20);
          context.fillRect(x, localY + this.settings.lineheight - 20, w, 20);
        }
      }
      context.fillStrokeShape(shape);
    }
  };

  private overlaySceneFunction = (
    lineInterval: {
      from: number;
      to: number;
    },
    sceneSegment: OctraAnnotationSegment,
    isLastSegment: boolean,
    beginTime: SampleUnit,
    numOfLines: number,
    context: Konva.Context,
    shape: Shape,
  ) => {
    if (
      this.currentLevel &&
      this.innerWidth &&
      this.currentLevel.items.length > 0 &&
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.audioChunk &&
      this.canvasElements?.lastLine
    ) {
      if (
        sceneSegment &&
        this.currentLevel.type === AnnotationLevelType.SEGMENT
      ) {
        for (let j = 0; j <= lineInterval.to - lineInterval.from; j++) {
          let localY =
            j * (this.settings.lineheight + this.settings.margin.top);

          if (this.innerWidth !== undefined) {
            const startSecond = j * this.secondsPerLine;
            let endSecond = 0;

            if (numOfLines > 1) {
              endSecond = Math.ceil(
                Math.min(
                  startSecond + this.secondsPerLine,
                  this.audioChunk.time.duration.seconds,
                ),
              );
            } else {
              endSecond = Math.ceil(this.audioChunk.time.duration.seconds);
            }

            const pipe = new TimespanPipe();
            const maxDuration = this.audioChunk.time.duration.unix;

            const timeString = pipe.transform(endSecond * 1000, {
              showHour: true,
              showMilliSeconds: !this.settings.multiLine,
              maxDuration,
            });
            const timestampWidth = this.layers.overlay
              .getContext()
              .measureText(timeString).width;

            const h = this.settings.lineheight;
            const lineWidth =
              j < numOfLines - 1
                ? this.innerWidth
                : this.canvasElements.lastLine.width();
            const select = this.getRelativeSelectionByLine(
              j + lineInterval.from,
              lineWidth,
              beginTime,
              sceneSegment.time,
              this.innerWidth,
            );
            let w = 0;
            let x = select.start;

            if (select.start > -1 && select.end > -1) {
              w = Math.abs(select.end - select.start);
            }

            if (select.start < 1 || select.start > lineWidth) {
              x = 0;
            }
            if (select.end < 1) {
              w = 0;
            }
            if (select.end > lineWidth) {
              w = select.end;
            }

            if (j === numOfLines - 1 && isLastSegment) {
              w = lineWidth - select.start;
            }

            if (w === 0) {
              // skip drawing empty rect
              continue;
            }

            // console.log(`draw overlay for line ${j + lineInterval.from} and segment at ${sceneSegment.time.seconds}`);
            if (sceneSegment.context?.asr?.isBlockedBy === undefined) {
              // not blocked
              if (
                sceneSegment.getFirstLabelWithoutName('Speaker')?.value ===
                  undefined ||
                sceneSegment.getFirstLabelWithoutName('Speaker')?.value === ''
              ) {
                context.fillStyle = 'rgba(255,0,0,0.2)';
              } else if (
                this.silencePlaceholder !== undefined &&
                sceneSegment.getFirstLabelWithoutName('Speaker')?.value ===
                  this.silencePlaceholder
              ) {
                context.fillStyle = 'rgba(0,0,255,0.2)';
              } else if (
                sceneSegment.getFirstLabelWithoutName('Speaker')?.value !==
                  undefined &&
                sceneSegment.getFirstLabelWithoutName('Speaker')?.value !== ''
              ) {
                context.fillStyle = 'rgba(0,128,0,0.2)';
              } else {
                console.error(`Audioviewer shows black segment`);
              }
              context.clearRect(x, localY, w, h);
              context.fillRect(x, localY, w, h);
            } else {
              // something running
              let progressBarFillColor = '';
              let progressBarForeColor = '';
              if (
                sceneSegment.context?.asr?.isBlockedBy === ASRQueueItemType.ASR
              ) {
                // blocked by ASR
                context.fillStyle = 'rgba(255,191,0,0.5)';
                progressBarFillColor = 'rgba(221,167,14,0.8)';
                progressBarForeColor = 'black';
              } else if (
                sceneSegment.context?.asr?.isBlockedBy ===
                ASRQueueItemType.ASRMAUS
              ) {
                context.fillStyle = 'rgba(179,10,179,0.5)';
                progressBarFillColor = 'rgba(179,10,179,0.8)';
                progressBarForeColor = 'white';
              } else if (
                sceneSegment.context?.asr?.isBlockedBy === ASRQueueItemType.MAUS
              ) {
                context.fillStyle = 'rgba(26,229,160,0.5)';
                progressBarFillColor = 'rgba(17,176,122,0.8)';
                progressBarForeColor = 'white';
              }
              context.clearRect(x, localY, w, h);
              context.fillRect(x, localY, w, h);

              if (this.settings.showProgressBars) {
                let timeStampsWidth = 0;

                if (w === lineWidth) {
                  // time labels on both sides
                  timeStampsWidth = timestampWidth * 2;
                } else {
                  if (x === 0 || select.start + w === lineWidth) {
                    // time label on the left or on the right
                    timeStampsWidth = timestampWidth;
                  }
                }

                const progressWidth = w - timeStampsWidth - 20;
                if (
                  progressWidth > 10 &&
                  sceneSegment.context?.asr?.progressInfo !== undefined
                ) {
                  const progressStart = x + 10 + (x === 0 ? timestampWidth : 0);
                  const loadedPixels = Math.round(
                    progressWidth *
                      (sceneSegment.context?.asr?.progressInfo.progress / 100),
                  );

                  this.drawRoundedRect(
                    context,
                    progressStart,
                    localY + 3,
                    15,
                    progressWidth,
                    5,
                    'transparent',
                    progressBarFillColor,
                  );
                  this.drawRoundedRect(
                    context,
                    progressStart,
                    localY + 3,
                    15,
                    loadedPixels,
                    5,
                    progressBarFillColor,
                  );

                  if (progressWidth > 100) {
                    const progressString = `${sceneSegment.context?.asr?.progressInfo.statusLabel} ${sceneSegment.context?.asr?.progressInfo.progress}%`;
                    const textLength =
                      context.measureText(progressString).width;
                    const textPosition = Math.round(
                      progressStart + (progressWidth - textLength) / 2,
                    );
                    context.fillStyle =
                      progressStart + loadedPixels > textPosition &&
                      progressBarForeColor === 'white'
                        ? 'white'
                        : 'black';
                    context.fillText(progressString, textPosition, localY + 14);
                  }
                }
              }
            }
          }
        }
        context.fillStrokeShape(shape);
      }
    }
  };

  private drawRoundedRect(
    context: any,
    x: number,
    y: number,
    height: number,
    width: number,
    radius: number,
    fillColor: string,
    strokeColor?: string,
  ) {
    if (height > 0 && width > 0) {
      context.fillStyle = fillColor;
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
      context.fill();
    }
    if (strokeColor !== undefined) {
      context.strokeWidth = 1;
      context.strokeStyle = strokeColor;
      context.stroke();
    }
  }

  private createScrollBar = () => {
    if (
      this.canvasElements?.lastLine !== undefined &&
      this.innerWidth !== undefined &&
      this.size
    ) {
      const group = new Konva.Group({
        id: 'scrollBar',
        x: this.innerWidth + this.settings.margin.left,
        y: 0,
        width: this.settings.scrollbar.width,
        height: this.size.height,
      });

      const background = new Konva.Rect({
        stroke: this.settings.scrollbar.background.stroke,
        strokeWidth: this.settings.scrollbar.background.strokeWidth,
        fill: this.settings.scrollbar.background.color,
        width: this.settings.scrollbar.width,
        height: this.size.height,
      });
      group.add(background);

      const rest =
        this.settings.scrollbar.width - this.settings.scrollbar.selector.width;
      const selector = new Konva.Rect({
        stroke: this.settings.scrollbar.selector.stroke,
        strokeWidth: this.settings.scrollbar.selector.strokeWidth,
        fill: this.settings.scrollbar.selector.color,
        width: this.settings.scrollbar.selector.width,
        height:
          (background.height() /
            (this.canvasElements.lastLine.y() +
              this.canvasElements.lastLine.height())) *
          background.height(),
        x: rest > 0 ? rest / 2 : 0,
        draggable: true,
        dragBoundFunc: (pos) => {
          if (
            this.size?.height !== undefined &&
            this.innerWidth !== undefined
          ) {
            pos.x = this.innerWidth - (rest > 0 ? rest / 2 : 0);
            pos.y = Math.max(
              Math.min(pos.y, this.size.height - selector.height()),
              0,
            );
            return pos;
          }
          return { x: 0, y: 0 };
        },
      });
      group.add(selector);
      this.canvasElements.scrollbarSelector = selector;

      selector.on('dragmove', this.onScrollbarDragged);

      selector.on('mouseenter', () => {
        if (this.konvaContainer !== undefined) {
          this.renderer?.setStyle(this.konvaContainer, 'cursor', 'pointer');
        }
      });
      selector.on('mouseleave', () => {
        if (this.konvaContainer !== undefined) {
          this.renderer?.setStyle(this.konvaContainer, 'cursor', 'auto');
        }
      });

      return group;
    }

    return undefined;
  };

  private drawSelection = (lineNum: number, lineWidth: number) => {
    if (
      this.drawnSelection !== undefined &&
      this.drawnSelection.length > 0 &&
      this.stage !== undefined &&
      this.layers !== undefined &&
      this.innerWidth !== undefined
    ) {
      // draw gray selection
      const select = this.getRelativeSelectionByLine(
        lineNum,
        lineWidth,
        this.drawnSelection.start,
        this.drawnSelection.end,
        this.innerWidth,
      );

      const selections = this.layers.overlay.find('.selection');
      if (selections.length > lineNum && selections.length > 0) {
        if (lineNum > -1 && select) {
          const left = select.start;
          const right = select.end;
          let x = left > right ? right : left;

          let w = 0;

          if (left > -1 && right > -1) {
            w = Math.abs(right - left);
          }

          // draw selection rectangle
          if (left < 1 || left > lineWidth) {
            x = 1;
          }
          if (right < 1) {
            w = 0;
          }
          if (right < 1 || right > lineWidth) {
            w = right;
          }

          if (w > 0) {
            selections[lineNum].width(w);
            selections[lineNum].x(x);
          }
        }
      }
    }
  };

  private resetSelection() {
    if (this.layers?.overlay) {
      this.layers.overlay.find('.selection').forEach((child) => {
        child.width(0);
        child.x(0);
      });
    }
  }

  private drawWholeSelection() {
    // draw selection
    this.resetSelection();
    if (
      this.layers !== undefined &&
      this.audioChunk !== undefined &&
      this.canvasElements?.lastLine
    ) {
      if (
        this.drawnSelection !== undefined &&
        !this.drawnSelection.duration.equals(this.audioChunk.time.duration) &&
        this.drawnSelection.duration.samples !== 0 &&
        this.audioTCalculator !== undefined &&
        this.innerWidth
      ) {
        this.drawnSelection.checkSelection();
        const selStart = this.audioTCalculator.samplestoAbsX(
          this.drawnSelection.start,
        );
        const selEnd = this.audioTCalculator.samplestoAbsX(
          this.drawnSelection.end,
        );
        const lineNum1 =
          this.innerWidth < this.AudioPxWidth && this.settings.multiLine
            ? Math.floor(selStart / this.innerWidth)
            : 0;
        const lineNum2 =
          this.innerWidth < this.AudioPxWidth && this.settings.multiLine
            ? Math.floor(selEnd / this.innerWidth)
            : 0;
        const numOfLines = this.getNumberOfLines();

        for (let j = lineNum1; j <= lineNum2; j++) {
          const lineWidth =
            j < numOfLines - 1
              ? this.innerWidth
              : this.canvasElements.lastLine.width();
          this.drawSelection(j, lineWidth);
        }
      }
      this.layers.overlay.batchDraw();
    }
  }

  private getNumberOfLines() {
    if (this.innerWidth !== undefined) {
      return Math.ceil(this.AudioPxWidth / this.innerWidth);
    }
    return -1;
  }

  private changeMouseCursorSamples = (newValue: SampleUnit) => {
    if (
      this.canvasElements?.mouseCaret !== undefined &&
      this.layers !== undefined &&
      this.audioTCalculator !== undefined &&
      this.innerWidth !== undefined
    ) {
      const absX = this.audioTCalculator.samplestoAbsX(newValue);
      const lines = Math.floor(absX / this.innerWidth);
      const x = absX % this.innerWidth;
      const y = lines * (this.settings.lineheight + this.settings.margin.top);

      this.canvasElements.mouseCaret.position({
        x,
        y,
      });
      this.layers.playhead.batchDraw();
    }
  };

  /**
   * called if audio ended normally because end of segment reached
   */
  private afterAudioEnded = () => {
    if (this.audioChunk !== undefined && !this.audioChunk.replay) {
      // let cursor jump to start
      this.audioChunk.absolutePlayposition =
        this.audioChunk.selection.start.clone();
      this.drawnSelection =
        this.drawnSelection !== undefined
          ? this.drawnSelection?.clone()
          : undefined;
    }

    this.updatePlayCursor();
    if (this.layers !== undefined) {
      this.layers.playhead.batchDraw();
    }
  };

  private removeSegmentFromCanvas(
    segmentID: number,
    oldAnnotation?: OctraAnnotation<any, any>,
  ) {
    if (segmentID > -1) {
      const overlayGroup = this.layers?.overlay.findOne(
        `#segment_${segmentID}`,
      );
      const boundary = this.layers?.boundaries.findOne(
        `#boundary_${segmentID}`,
      );

      if (overlayGroup !== undefined) {
        overlayGroup.remove();
      }
      if (boundary !== undefined) {
        boundary.remove();
      }
    }
  }

  private redrawSegment(segmentID: number) {
    if (segmentID > -1) {
      const overlayGroup = this.layers?.overlay.findOne(
        `#segment_${segmentID}`,
      );
      const boundary = this.layers?.boundaries.findOne(
        `#boundary_${segmentID}`,
      );

      if (overlayGroup !== undefined) {
        overlayGroup.draw();
      }
      if (boundary !== undefined) {
        boundary.draw();
      }
    }
  }

  private createLineMouseCaret() {
    const group = new Konva.Group({
      name: 'mouseCaret',
      x: this.settings.margin.left,
      y: 0,
      width: 3,
      height: this.settings.lineheight,
    });

    const caret = new Konva.Line({
      points: [0, 0, 0, this.settings.lineheight],
      stroke: 'red',
      strokeWidth: 2,
      transformsEnabled: 'position',
    });

    group.add(caret);
    return group;
  }

  public refresh = () => {
    if (
      this.audioChunk !== undefined &&
      this.audioTCalculator !== undefined &&
      this.currentLevel?.items &&
      this.currentLevel.items.length > 0 &&
      this.layers !== undefined
    ) {
      if (!this.refreshRunning) {
        this.refreshRunning = true;
        this.updateAllSegments();
        this.layers.overlay.batchDraw();
        this.layers.boundaries.batchDraw();
        this.refreshRunning = false;
      }
    }
  };

  /**
   * use this function in order to update shortcuts.
   * @param shortcuts
   */
  public updateShortcuts(shortcuts: ShortcutGroup) {
    this.settings.shortcuts = shortcuts;
    if (this.shortcutsManager.shortcuts.length > 1) {
      this.shortcutsManager.clearShortcuts();
      this.shortcutsManager.registerShortcutGroup(shortcuts);
    }
  }

  private drawTextLabel(
    context: Konva.Context,
    text: string,
    lineNum1: number,
    lineNum2: number,
    segmentEnd: SampleUnit,
    beginTime: SampleUnit,
    lastI: number | undefined,
    numOfLines: number,
    segment: OctraAnnotationSegment,
    isLastSegment: boolean,
  ): number | undefined {
    const viewY =
      lineNum1 * (this.settings.lineheight + this.settings.margin.top);
    const viewHeight =
      (lineNum2 + 1) * (this.settings.lineheight + this.settings.margin.top) -
      viewY;

    if (
      text !== '' &&
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.canvasElements?.lastLine !== undefined &&
      this.innerWidth !== undefined &&
      segment?.time !== undefined &&
      this.audioTCalculator !== undefined
    ) {
      const y =
        lineNum1 * (this.settings.lineheight + this.settings.margin.top);
      for (let j = lineNum1; j <= lineNum2; j++) {
        const localY =
          (j + 1) * (this.settings.lineheight + this.settings.margin.top);

        const lineWidth =
          j < numOfLines - 1
            ? this.innerWidth
            : this.canvasElements.lastLine.width();
        const select = this.getRelativeSelectionByLine(
          j,
          lineWidth,
          beginTime,
          segment.time,
          this.innerWidth,
        );
        let w = 0;
        let x = select.start;

        if (select.start > -1 && select.end > -1) {
          w = Math.abs(select.end - select.start);
        }

        if (select.start < 1 || select.start > lineWidth) {
          x = 1;
        }
        if (select.end < 1) {
          w = 0;
        }
        if (select.end < 1 || select.end > lineWidth) {
          w = select.end;
        }

        if (j === numOfLines - 1 && isLastSegment) {
          w = lineWidth - select.start + 1;
        }

        if (lineNum1 === lineNum2) {
          let textLength = context.measureText(text).width;
          let newText = text;
          // segment in same line
          if (textLength > w - 4) {
            // crop text
            const overflow = 1 - 1 / (textLength / (w - 35));
            const charsToRemove = Math.ceil((text.length * overflow) / 2);
            const start = Math.ceil(text.length / 2 - charsToRemove);
            const end = start + charsToRemove * 2;
            newText = text.substring(0, start);
            newText += '...';
            newText += text.substring(end);
            textLength = context.measureText(newText).width;
          }
          const localX = (w - 4 - textLength) / 2 + x;
          context.fillText(
            newText,
            localX,
            localY - 5 - this.settings.margin.top,
          );
        } else {
          const totalWidth = this.audioTCalculator.samplestoAbsX(
            segmentEnd.sub(beginTime),
          );

          if (j === lineNum1) {
            // current line is start line
            const ratio = w / totalWidth;

            // crop text
            let newText = text.substring(
              0,
              Math.floor(text.length * ratio) - 2,
            );
            const textLength = context.measureText(newText).width;

            if (textLength > w) {
              // crop text
              const leftHalf = w / textLength;
              newText = newText.substring(
                0,
                Math.floor(newText.length * leftHalf) - 2,
              );
            }
            lastI = newText.length;
            newText += '...';

            const localX = (w - 4 - textLength) / 2 + x;
            context.fillText(
              newText,
              localX,
              localY - 5 - this.settings.margin.top,
            );
          } else if (j === lineNum2 && lastI !== undefined) {
            // crop text
            let newText = text.substring(lastI);
            const textLength = context.measureText(newText).width;

            if (textLength > w) {
              // crop text
              const leftHalf = w / textLength;
              newText = newText.substring(
                0,
                Math.floor(newText.length * leftHalf) - 3,
              );
              newText = '...' + newText + '...';
            } else if (text !== this.silencePlaceholder) {
              newText = '...' + newText;
            } else {
              newText = text;
            }

            const localX = (w - 4 - textLength) / 2 + x;
            context.fillText(
              newText,
              localX,
              localY - 5 - this.settings.margin.top,
            );
            lastI = 0;
          } else if (lastI !== undefined) {
            let w2 = 0;

            if (lineNum1 > -1) {
              const lastPart = this.getRelativeSelectionByLine(
                lineNum1,
                w,
                beginTime,
                segmentEnd,
                this.innerWidth,
              );

              if (lastPart.start > -1 && lastPart.end > -1) {
                w2 = Math.abs(lastPart.end - lastPart.start);
              }
              if (lastPart.end < 1) {
                w2 = 0;
              }
              if (lastPart.end < 1 || lastPart.end > lineWidth) {
                w2 = lastPart.end;
              }
            }

            const ratio = w / totalWidth;
            const endIndex = lastI + Math.floor(text.length * ratio);

            // placeholder
            let newText = text.substring(lastI, endIndex);
            const textLength = context.measureText(newText).width;

            if (textLength > w) {
              // crop text
              const leftHalf = w / textLength;
              newText = newText.substring(
                0,
                Math.floor(newText.length * leftHalf) - 3,
              );
            }
            lastI += newText.length;

            if (text !== this.silencePlaceholder) {
              newText = '...' + newText + '...';
            } else {
              newText = text;
            }

            const localX = (w - 4 - textLength) / 2 + x;
            context.fillText(
              newText,
              localX,
              localY - 5 - this.settings.margin.top,
            );
          }
        }
      }
      return lastI;
    }

    return undefined;
  }

  private initializeStageContainer() {
    if (this.stage) {
      const stageContainer = this.stage.container();
      stageContainer.tabIndex = 1;

      // focus it
      // also stage will be in focus on its click
      stageContainer.removeEventListener('keydown', this.onKeyDown);
      stageContainer.addEventListener('keydown', this.onKeyDown);
      stageContainer.removeEventListener('keyup', this.onKeyUp);
      stageContainer.addEventListener('keyup', this.onKeyUp);
      stageContainer.removeEventListener('mouseleave', this.onMouseLeave);
      stageContainer.addEventListener('mouseleave', this.onMouseLeave);
      stageContainer.removeEventListener('mouseenter', this.onMouseEnter);
      stageContainer.addEventListener('mouseenter', this.onMouseEnter);
    }
  }

  public redraw() {
    this.stage?.batchDraw();
  }

  public redrawOverlay() {
    this.layers?.overlay.batchDraw();
  }

  private updateSize(stageWidth: number, stageHeight: number) {
    this.size = { width: stageWidth, height: stageHeight };
    this.styles.height = stageHeight;
  }

  private initializeLayers() {
    if (this.stage) {
      this.layers = {
        background: new Konva.Layer({
          id: 'backgroundLayer',
          listening: false,
        }),
        overlay: new Konva.Layer({
          id: 'overlayLayer',
          listening: false,
        }),
        boundaries: new Konva.Layer({
          id: 'boundariesLayer',
        }),
        playhead: new Konva.Layer({
          id: 'playheadLayer',
          listening: false,
        }),
        scrollBars: new Konva.Layer({
          id: 'scrollBars',
        }),
      };

      this.stage.on('wheel', this.onWheel);
    }
  }

  private onWheel = (event: Konva.KonvaEventObject<any>) => {
    if (
      this.canvasElements?.scrollBar !== undefined &&
      this.canvasElements?.scrollbarSelector !== undefined &&
      this.size?.height !== undefined
    ) {
      event.evt.preventDefault();
      let newY = Math.max(
        0,
        Math.min(
          this.canvasElements.scrollBar.height(),
          this.canvasElements.scrollbarSelector.y() + event.evt.deltaY / 2,
        ),
      );
      newY = Math.max(
        Math.min(
          newY,
          this.size.height - this.canvasElements.scrollbarSelector.height(),
        ),
        0,
      );
      this.canvasElements.scrollbarSelector.y(newY);
      this.onScrollbarDragged();
    }
  };

  private scrollWithDeltaY(deltaY: number) {
    if (
      this.layers !== undefined &&
      this.stage !== undefined &&
      this.canvasElements !== undefined &&
      this.canvasElements.lastLine !== undefined
    ) {
      const newY =
        (this.canvasElements.lastLine.y() +
          this.canvasElements.lastLine.height()) *
        deltaY;

      if (newY !== this.layers.background.y()) {
        // move all layers but keep scrollbars fixed
        this.layers.background.y(newY);
        this.layers.overlay.y(newY);
        this.layers.boundaries.y(newY);
        this.layers.playhead.y(newY);
        this.updateViewPort();
        this.showOnlyLinesInViewport();
        this.updateAllSegments();
      }
    }
  }

  private onScrollbarDragged = () => {
    if (
      this.canvasElements.scrollbarSelector !== undefined &&
      this.canvasElements?.scrollBar
    ) {
      // delta in %
      const delta =
        this.canvasElements.scrollbarSelector.y() /
        this.canvasElements.scrollBar.height();

      this.scrollWithDeltaY(-delta);
    }
  };

  private removeEventListenersFromContainer(container: HTMLElement) {
    container.removeEventListener('mousemove', this.onMouseMove);
    container.removeEventListener('mousedown', this.mouseChange);
    container.removeEventListener('mouseup', this.mouseChange);
  }

  private mouseChange = async (event: any) => {
    if (this.innerWidth) {
      const absXPos = this.hoveredLine * this.innerWidth + event.layerX;

      if (
        absXPos !== undefined &&
        absXPos > 0 &&
        this.settings?.selection.enabled &&
        this.audioChunk &&
        this.layers !== undefined &&
        (!this.canvasElements.scrollBar ||
          event.layerX < this.canvasElements.scrollBar!.x())
      ) {
        if (event.type === 'mousedown') {
          this.audioChunk.selection.start =
            this.audioChunk.absolutePlayposition.clone();
          this.audioChunk.selection.end =
            this.audioChunk.absolutePlayposition.clone();
        }

        await this.setMouseClickPosition(absXPos, this.hoveredLine, event);

        if (this.layers !== undefined) {
          this.updatePlayCursor();
          this.layers.playhead.draw();
        }

        if (event.type !== 'mousedown') {
          this.selchange.emit(this.audioChunk.selection);
        }
        this.drawWholeSelection();
      }
      this._focused = true;
    }
  };

  public getLineNumber(x: number, y: number) {
    const numOfLines = this.getNumberOfLines();

    for (let i = 0; i < numOfLines; i++) {
      const locY = i * (this.settings.lineheight + this.settings.margin.top);
      const locMaxY = locY + this.settings.lineheight;

      if (y >= locY && y <= locMaxY) {
        return i;
      }
    }

    return -1;
  }

  private onMouseMove = (event: any) => {
    if (
      this.canvasElements?.mouseCaret &&
      this.layers &&
      this.stage &&
      this.innerWidth
    ) {
      const tempLine = this.getLineNumber(
        event.layerX,
        event.layerY + Math.abs(this.layers.background.y()),
      );
      this.hoveredLine = tempLine > -1 ? tempLine : this.hoveredLine;
      const maxLines = Math.ceil(this.AudioPxWidth / this.innerWidth);
      const restAbsX = this.hoveredLine * this.innerWidth;
      const lineWidth =
        this.hoveredLine === maxLines - 1 && maxLines > 1
          ? this.AudioPxWidth - restAbsX
          : this.innerWidth;
      const layerX = Math.min(event.layerX, lineWidth);
      const absXPos = Math.min(
        this.hoveredLine * this.innerWidth + layerX,
        this.AudioPxWidth,
      );

      if (!this.settings.cursor.fixed) {
        this.canvasElements.mouseCaret.position({
          x: layerX,
          y:
            this.hoveredLine *
            (this.settings.lineheight + this.settings.margin.top),
        });
        this.layers.playhead.batchDraw();
        if (this.drawnSelection && this.drawnSelection.duration.samples > 0) {
          this.drawWholeSelection();
        }
      }
      this.setMouseMovePosition(absXPos);
      this.mousecursorchange.emit({
        event,
        time: this.mouseCursor,
      });
      this.stage.container().focus();
      this._focused = true;
    }
  };

  private addEventListenersForContainer(container: HTMLElement) {
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('mousedown', this.mouseChange);
    container.addEventListener('mouseup', this.mouseChange);
  }

  focus() {
    this.stage?.container().focus();
    this._focused = true;
  }
}

export interface AnnotationChange {
  type: 'add' | 'remove' | 'change';
  affectedLevelID: number;
  level?: {
    old?: OctraAnnotationAnyLevel<OctraAnnotationSegment>;
    new?: OctraAnnotationAnyLevel<OctraAnnotationSegment>;
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
