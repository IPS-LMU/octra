import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import Konva from 'konva';
import {PlayCursor} from '../../../obj/play-cursor';
import {AudioviewerConfig} from './audio-viewer.config';
import {AudioViewerService} from './audio-viewer.service';
import {ShortcutGroup, ShortcutManager, SubscriptionManager} from '@octra/utilities';
import {ASRQueueItemType, Level, Segment} from '@octra/annotation';
import {AudioChunk, AudioManager, AudioSelection, PlayBackStatus, SampleUnit} from '@octra/media';
import {Position, Size} from '../../../obj';
import {TimespanPipe} from '../../../pipe/timespan.pipe';
import {Subject, Subscription} from 'rxjs';
import Group = Konva.Group;
import Layer = Konva.Layer;
import Vector2d = Konva.Vector2d;
import Shape = Konva.Shape;

@Component({
  selector: 'octra-audio-viewer',
  templateUrl: './audio-viewer.component.html',
  styleUrls: ['./audio-viewer.component.css'],
  providers: [AudioViewerService]
})
export class AudioViewerComponent implements OnInit, OnChanges, OnDestroy {

  @Input() set transcriptionLevel(value: Level | undefined) {
    this._transcriptionLevel = value;
  }

  // Ways to improve performance
  // 1. Use differs on transcriptionLevel, perhaps IterableDiffers and segments

  constructor(public av: AudioViewerService, private renderer: Renderer2) {
    this.shortcutsManager = new ShortcutManager();
    this.subscrManager = new SubscriptionManager<Subscription>();

    this.subscrManager.add(this.av.boundaryDragging.subscribe((status) => {
      if (status === 'stopped') {
        this.renderer.setStyle(this.konvaContainer?.nativeElement, 'cursor', 'auto');
      }
    }))
  }

  @Input() set isMultiLine(value: boolean) {
    this.settings.multiLine = value;
    this.init();
  }

  public get mouseCursor(): {
    location: Vector2d | undefined,
    size: {
      height: number;
      width: number;
    } | undefined
  } {
    if (this.canvasElements.mouseCaret === undefined) {
      return {
        location: {
          x: 0, y: 0
        },
        size: {
          width: 0, height: 0
        }
      };
    } else {
      return {
        location: this.canvasElements?.mouseCaret?.position(),
        size: this.canvasElements?.mouseCaret?.size()
      };
    }
  }

  public get settings(): AudioviewerConfig {
    return this.av.settings;
  }

  @Input()
  public set settings(value: AudioviewerConfig) {
    this.av.settings = value;
  }

  public get audioManager(): AudioManager | undefined {
    return this.audioChunk?.audioManager;
  }

  public get width(): number | undefined {
    return this.konvaContainer?.nativeElement.offsetWidth;
  }

  public get height(): number | undefined {
    return this.konvaContainer?.nativeElement.clientHeight;
  }

  public get getPlayHeadX(): number {
    return 0;
  }

  get AudioPxWidth(): number {
    return this.av.AudioPxWidth;
  }

  get transcriptionLevel(): Level | undefined {
    return this._transcriptionLevel;
  }

  get focused(): boolean {
    return this._focused;
  }

  @Input() audioChunk: AudioChunk | undefined;
  @Input() public name = '';
  @Input() breakMarker: any;
  @Output() shortcutTrigger = new EventEmitter<AudioViewerShortcutEvent>();
  @Output() selchange = new EventEmitter<AudioSelection>();
  @Output() playcursorchange = new EventEmitter<PlayCursor>();
  @Output() segmententer: EventEmitter<any> = new EventEmitter<any>();
  @Output() mousecursorchange = new EventEmitter<{
    event: MouseEvent | undefined,
    time: SampleUnit | undefined
  }>();
  @Output() alert = new EventEmitter<{ type: string, message: string }>();

  @Output()
  public get boundaryDragging(): Subject<'started' | 'stopped'> {
    return this.av.boundaryDragging;
  }

  @ViewChild('konvaContainer', {static: true}) konvaContainer: ElementRef | undefined;
  private shortcutsManager: ShortcutManager;
  public updating = false;
  // EVENTS
  public onInitialized = new Subject<void>();
  public secondsPerLine = 5;
  private stage: Konva.Stage | undefined;
  private hoveredLine = -1;
  private refreshRunning = false;

  private croppingData: {
    x: number;
    y: number;
    radius: number;
  } | undefined;
  private styles = {
    playHead: {
      backgroundColor: '#56a09e',
      strokeColor: 'pruple',
      strokeWidth: 1,
      width: 10
    },
    caret: {
      strokeColor: 'red',
      strokeWidth: 1
    },
    height: 200,
    border: {
      width: 1,
      color: '#b5b5b5'
    },
    background: {
      color: '#e2e6ff'
    },
    grid: {
      strokeColor: 'gray',
      strokeWidth: 1
    },
    signal: {
      strokeColor: 'green',
      strokeWidth: 1
    }
  };
  private layers: {
    background: Konva.Layer,
    playhead: Konva.Layer,
    boundaries: Konva.Layer,
    overlay: Konva.Layer,
    scrollBars: Konva.Layer
  } | undefined;
  private subscrManager: SubscriptionManager<Subscription>;
  private animation: {
    playHead: Konva.Animation | undefined
  } = {
    playHead: undefined
  };
  private canvasElements: {
    playHead: Konva.Group | undefined,
    mouseCaret: Konva.Group | undefined,
    scrollBar: Konva.Group | undefined,
    scrollbarSelector: Konva.Rect | undefined,
    lastLine: Konva.Group | undefined
  } = {
    playHead: undefined,
    mouseCaret: undefined,
    scrollBar: undefined,
    scrollbarSelector: undefined,
    lastLine: undefined
  };

  private grid = {
    verticalLines: 3,
    horizontalLines: 2
  };
  private widthOnInit: number | undefined;
  private drawnSegmentIDs: number[] = [];

  private _transcriptionLevel: Level | undefined;

  private _focused = false;

  ngOnInit() {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['audioChunk'] && changes['audioChunk'].currentValue !== undefined) {
      this.afterChunkUpdated();
    }
    if (changes['transcriptionLevel'] && changes['transcriptionLevel'].currentValue !== undefined) {
      this.afterLevelUpdated();
    }

    if (changes['breakMarker'] && changes['breakMarker'].currentValue !== undefined) {
      this.av.breakMarker = this.breakMarker;
    }

    if (this.stage !== undefined && this.height !== undefined) {
      this.stage.height(this.height);
    }
  }

  public getPixelPerSecond(secondsPerLine: number) {
    if (this.av.innerWidth !== undefined) {
      if (secondsPerLine !== undefined) {
        return (this.av.innerWidth / secondsPerLine);
      } else {
        console.error(`secondsPerLine is undefined or undefined!`);
      }
      return (this.av.innerWidth / 5);
    }
    return 0;
  }

  ngOnDestroy(): void {
    this.subscrManager.destroy();
    this.stage?.destroy();

    this.konvaContainer?.nativeElement.removeEventListener('keydown', this.onKeyDown);
    this.konvaContainer?.nativeElement.removeEventListener('keyup', this.onKeyUp);
    this.konvaContainer?.nativeElement.removeEventListener('mouseleave', this.onMouseLeave);
    this.konvaContainer?.nativeElement.removeEventListener('mouseenter', this.onMouseEnter);
    this.konvaContainer?.nativeElement.removeEventListener('mousemove', this.onMouseMove);
    this.konvaContainer?.nativeElement.removeEventListener('mousedown', this.mouseChange);
    this.konvaContainer?.nativeElement.removeEventListener('mouseup', this.mouseChange);
  }

  afterChunkUpdated() {
    if (!(this.audioChunk === undefined || this.audioChunk === undefined)) {
      this.subscrManager.removeByTag('audioChunkStatusChange');
      this.subscrManager.removeByTag('audioChunkChannelFinished');

      this.subscrManager.add(this.audioChunk.statuschange.subscribe(
        this.onAudioChunkStatusChanged
        , (error) => {
          console.error(error);
        }), 'audioChunkStatusChange');

      new Promise<void>((resolve, reject) => {
        if (this.audioChunk !== undefined && this.audioChunk.audioManager.channel === undefined) {
          this.subscrManager.add(
            this.audioChunk.audioManager.onChannelDataChange.subscribe(() => {
                resolve();
              },
              (error) => {
                reject(error);
              })
            , 'audioChunkChannelFinished');
        } else {
          resolve();
        }
      }).then(() => {
        if (this.width !== undefined && this.audioChunk !== undefined && this._transcriptionLevel !== undefined) {
          const innerWidth = this.width - (this.settings.margin.left + this.settings.margin.right);
          this.av.initialize(innerWidth, this.audioChunk, this._transcriptionLevel);
          this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);

          this.av.initializeSettings().then(() => {
            this.initializeView();
          }).catch((error) => {
            console.error(error);
          });
        } else {
          console.error(`width is undefined`);
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  afterLevelUpdated() {
    if (this._transcriptionLevel !== undefined) {
      this.refreshLevel();
    }
  }

  onSecondsPerLineChanged(secondsPerLine: number) {
    this.secondsPerLine = secondsPerLine;
    this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
    this.av.initializeSettings().then(() => {
      this.initializeView();
    }).catch((error) => {
      console.error(error);
    });
  }

  onResize() {
    return new Promise<void>((resolve, reject) => {
      if (this.audioChunk !== undefined && this.stage !== undefined && this.width !== undefined && this.height !== undefined && this._transcriptionLevel !== undefined) {
        const playpos = this.audioChunk?.absolutePlayposition.clone();
        const drawnSelection = this.av.drawnSelection?.clone();
        this.stage.width(this.width);
        this.stage.height(this.height);
        this.av.initialize(this.width - (this.settings.margin.left + this.settings.margin.right), this.audioChunk, this._transcriptionLevel);
        this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
        this.av.initializeSettings().then(() => {
          if (this.audioChunk !== undefined) {
            if (!this.audioChunk.isPlaying) {
              this.audioChunk.absolutePlayposition = playpos.clone();
            }
            this.av.drawnSelection = drawnSelection;
            this.updateLines();
            this.createSegmentsForCanvas();
            this.updatePlayCursor();
          }
          if (this.stage !== undefined) {
            this.stage.batchDraw();
          }
          resolve();
        }).catch(reject);
      }
    });
  }

  public initializeView() {
    if (this._transcriptionLevel !== undefined && this.stage !== undefined && this.height !== undefined && this.layers !== undefined) {
      this.stage.height(this.height);

      this.onInitialized.next();
      for (const [, value] of Object.entries(this.layers)) {
        value.removeChildren();
      }

      if (this.settings.cropping === 'circle' && this.av.innerWidth !== undefined) {
        this.settings.lineheight = this.av.innerWidth;
        const circleWidth = this.av.innerWidth - 5;
        this.croppingData = {
          x: circleWidth / 2 + 2 + this.settings.margin.left,
          y: circleWidth / 2 + 2 + this.settings.margin.top,
          radius: circleWidth / 2
        };
      }

      const addSingleLineOnly = () => {
        if (this.av.innerWidth !== undefined) {
          const line = this.createLine(
            new Size(this.av.innerWidth, this.settings.lineheight),
            new Position(this.settings.margin.left, 0), 0);
          this.layers?.background.add(line);
          this.canvasElements.lastLine = line;
        }
      };

      if (this.settings.multiLine) {
        let lineWidth = this.av.innerWidth;

        if (lineWidth !== undefined) {
          const numOfLines = Math.ceil(this.av.AudioPxWidth / lineWidth);

          let y = 0;
          if (numOfLines > 1) {
            let drawnWidth = 0;
            for (let i = 0; i < numOfLines - 1; i++) {
              const line = this.createLine(new Size(lineWidth, this.settings.lineheight), new Position(this.settings.margin.left, y), i);
              this.layers.background.add(line);
              y += this.settings.lineheight + this.settings.margin.top;
              this.canvasElements.lastLine = line;
              drawnWidth += lineWidth;
            }
            // add last line
            lineWidth = this.av.AudioPxWidth - drawnWidth;
            if (lineWidth > 0) {
              const line = this.createLine(
                new Size(lineWidth, this.settings.lineheight), new Position(this.settings.margin.left, y),
                numOfLines - 1);
              this.layers.background.add(line);
              this.canvasElements.lastLine = line;
            }
          }
        } else {
          addSingleLineOnly();
        }
      } else {
        addSingleLineOnly();
      }

      this.createSegmentsForCanvas();

      this.canvasElements.playHead = this.createLinePlayCursor();
      if (this.settings.selection.enabled) {
        this.layers.playhead.add(this.canvasElements.playHead);
      }

      this.canvasElements.mouseCaret = this.createLineMouseCaret();
      this.layers.playhead.add(this.canvasElements.mouseCaret);

      if (this.settings.cropping === 'circle' && this.croppingData !== undefined) {
        const cropGroup = this.createCropContainer();
        this.layers.playhead.removeChildren();
        this.canvasElements.mouseCaret.position({
          x: this.croppingData.radius + 2,
          y: 2
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
    } else {
      console.error(`transcriptionLevel is undefined`);
    }
  }

  public updateLines = () => {
    const lines: Group[] | undefined = this.layers?.background?.find('.line');

    if (this.av.innerWidth !== undefined) {
      if (lines !== undefined) {
        // check all lines but the last one
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          line.width(this.av.innerWidth);
          const geometrics = line.getChildren();
          for (let j = 0; j < geometrics.length; j++) {
            const elem = geometrics[j];
            if ((lines.length > 1 && i < lines.length - 1) || lines.length === 1) {
              if (elem.name() !== 'selection' && elem.id() !== 'scrollBar') {
                elem.width(this.av.innerWidth);
              }
            } else {
              const width = this.av.AudioPxWidth % this.av.innerWidth;
              line.width(width);
              // last line
              if (elem.name() !== 'selection' && elem.id() !== 'scrollBar') {
                elem.width(width);
              }
            }
          }
        }
      }

      const scrollbars = this.layers?.scrollBars.find('#scrollBar');
      if (scrollbars !== undefined && scrollbars.length > 0) {
        scrollbars[0].x(this.av.innerWidth + this.settings.margin.left);
      }

      this.drawWholeSelection();
    }
  }

  onWheel = (event: Konva.KonvaEventObject<any>) => {
    if (this.audioChunk !== undefined && this.audioChunk.status !== PlayBackStatus.PREPARE && this.canvasElements !== undefined
      && this.canvasElements.scrollBar !== undefined && this.canvasElements.scrollbarSelector !== undefined && this.height !== undefined) {
      event.evt.preventDefault();
      let newY = Math.max(0,
        Math.min(this.canvasElements.scrollBar.height(), this.canvasElements.scrollbarSelector.y() + (event.evt.deltaY / 2)));
      newY = Math.max(Math.min(
        newY, this.height - this.canvasElements.scrollbarSelector.height()
      ), 0);
      this.canvasElements.scrollbarSelector.y(newY);
      this.onScrollbarDragged();
    }
  }

  public scrollToAbsY(absY: number) {
    if (this.canvasElements !== undefined && this.canvasElements.lastLine !== undefined) {
      const deltaY = absY / (this.canvasElements.lastLine.y() + this.canvasElements.lastLine.height());
      this.scrollWithDeltaY(-deltaY);
    }
  }

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

  public selectSegment(segIndex: number): Promise<{ posY1: number, posY2: number }> {
    return new Promise<{ posY1: number, posY2: number }>((resolve, reject) => {
      if (segIndex > -1 && this._transcriptionLevel !== undefined && this.audioChunk !== undefined && this.audioManager !== undefined) {
        const segment = this._transcriptionLevel.segments.get(segIndex);
        const startTime = this._transcriptionLevel.segments.getStartTime(segIndex);

        // make shure, that segments boundaries are visible
        if (segment?.time?.samples !== undefined && this._transcriptionLevel?.segments !== undefined && this.av.audioTCalculator !== undefined &&
          (startTime as any).samples >= this.audioChunk.time.start.samples && segment.time.samples <= (this.audioChunk.time.end.samples + 1) &&
          this.av.innerWidth !== undefined) {
          const absX = this.av.audioTCalculator.samplestoAbsX(segment.time);
          let begin = this._transcriptionLevel.createSegment(this.audioManager.createSampleUnit(0));
          if (segIndex > 0) {
            begin = this._transcriptionLevel.segments.get(segIndex - 1) as any;
          }

          if (begin.time !== undefined) {
            const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time);
            const posY1 = (this.av.innerWidth < this.AudioPxWidth)
              ? Math.floor((beginX / this.av.innerWidth) + 1) * (this.settings.lineheight + this.settings.margin.bottom)
              - this.settings.margin.bottom
              : 0;

            let posY2 = 0;

            if (this.av.innerWidth < this.AudioPxWidth) {
              posY2 = Math.floor((absX / this.av.innerWidth) + 1) * (this.settings.lineheight +
                this.settings.margin.bottom) - this.settings.margin.bottom;
            }

            const boundarySelect = this.av.getSegmentSelection(segment.time.samples - 1);
            if (boundarySelect) {
              this.audioChunk.selection = boundarySelect;
              this.av.drawnSelection = boundarySelect.clone();
              this.settings.selection.color = 'gray';
              this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
              this.changePlayCursorSamples(this.audioChunk.selection.start);
              this.updatePlayCursor();

              if (this.audioManager.isPlaying) {
                this.audioManager.stopPlayback().catch((error) => {
                  console.error(error);
                });
              }
            }

            resolve({posY1, posY2});
          }
        } else {
          reject();
        }
      } else {
        reject();
      }
    });
  }

  /**
   * playSelection() plays the selected signal fragment or the selection in this chunk
   */
  playSelection = (afterAudioEnded: () => void) => {
    this.audioChunk?.startPlayback().then(() => {
      if (this.audioChunk !== undefined) {
        if (this.av.drawnSelection !== undefined && this.av.drawnSelection.duration.samples > 0) {
          this.audioChunk.selection = this.av.drawnSelection.clone();
          this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
        }
        afterAudioEnded();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  public enableShortcuts() {
    this.shortcutsManager.registerShortcutGroup(this.settings.shortcuts);
  }

  public disableShortcuts() {
    this.shortcutsManager.clearShortcuts();
  }

  public init() {
    if (this.width !== undefined && this.height !== undefined && this.konvaContainer !== undefined) {
      this.widthOnInit = this.width;
      this.styles.height = this.height;
      this.drawnSegmentIDs = [];
      this.subscrManager.removeByTag('resize');

      if (!this.settings.multiLine) {
        this.settings.lineheight = this.height - this.settings.margin.top - this.settings.margin.bottom;
      }

      this.stage = new Konva.Stage({
        container: this.konvaContainer.nativeElement,   // id of container <div>,
        width: this.width,
        height: this.height
      });

      this.layers = {
        background: new Konva.Layer({
          id: 'backgroundLayer',
          listening: false
        }),
        overlay: new Konva.Layer({
          id: 'overlayLayer',
          listening: false
        }),
        boundaries: new Konva.Layer({
          id: 'boundariesLayer'
        }),
        playhead: new Konva.Layer({
          id: 'playheadLayer',
          listening: false
        }),
        scrollBars: new Konva.Layer({
          id: 'scrollBars'
        })
      };

      this.stage.on('wheel', this.onWheel);

      this.konvaContainer.nativeElement.removeEventListener('mousemove', this.onMouseMove);
      this.konvaContainer.nativeElement.addEventListener('mousemove', this.onMouseMove);

      this.konvaContainer.nativeElement.removeEventListener('mousedown', this.mouseChange);
      this.konvaContainer.nativeElement.addEventListener('mousedown', this.mouseChange);
      this.konvaContainer.nativeElement.removeEventListener('mouseup', this.mouseChange);
      this.konvaContainer.nativeElement.addEventListener('mouseup', this.mouseChange);

      for (const [, layer] of Object.entries(this.layers)) {
        this.stage.add(layer);
      }
      const container = this.stage.container();
      container.tabIndex = 1;

      // focus it
      // also stage will be in focus on its click
      container.focus();
      container.removeEventListener('keydown', this.onKeyDown);
      container.addEventListener('keydown', this.onKeyDown);
      container.removeEventListener('keyup', this.onKeyUp);
      container.addEventListener('keyup', this.onKeyUp);
      container.removeEventListener('mouseleave', this.onMouseLeave);
      container.addEventListener('mouseleave', this.onMouseLeave);
      container.removeEventListener('mouseenter', this.onMouseEnter);
      container.addEventListener('mouseenter', this.onMouseEnter);

      let resizing = false;
      window.onresize = () => {
        if (!resizing) {
          resizing = true;
          this.onResize().then(() => {
            resizing = false;
          }).catch((error) => {
            console.error(error);
          });
        }
      }

      this.shortcutsManager.clearShortcuts();
      this.shortcutsManager.registerShortcutGroup(this.settings.shortcuts);
    } else {
      console.error(`can't init audio viewer`);
    }
  }

  public redraw() {
    this.stage?.batchDraw();
  }

  public redrawOverlay() {
    this.layers?.overlay.batchDraw();
  }

  private createCropContainer(id?: string): Group {
    return new Konva.Group({
      id,
      clipFunc: (ctx) => {
        if (this.croppingData !== undefined) {
          ctx.arc(this.croppingData.x, this.croppingData.y, this.croppingData.radius, 0, Math.PI * 2, false);
        }
      }
    });
  }

  private onPlaybackStarted() {
    if (this.animation.playHead !== undefined) {
      this.animation.playHead.start();
    }
  }

  private onPlaybackPaused() {
    if (this.animation.playHead !== undefined) {
      this.animation.playHead.stop();
    }
  }

  private onAudioChunkStatusChanged = (status: PlayBackStatus) => {
    switch (status) {
      case PlayBackStatus.INITIALIZED:
        break;
      case PlayBackStatus.PREPARE:
        break;
      case PlayBackStatus.STARTED:
        this.onPlaybackStarted();
        break;
      case PlayBackStatus.PLAYING:
        break;
      case PlayBackStatus.PAUSED:
        this.onPlaybackPaused();
        break;
      case PlayBackStatus.STOPPED:
        this.onPlaybackStopped();
        break;
      case PlayBackStatus.ENDED:
        this.onPlaybackEnded();
        break;
    }
  }

  private onPlaybackStopped() {
    this.animation.playHead?.stop();
    this.updatePlayCursor();
    this.layers?.playhead.draw();
  }

  private onPlaybackEnded() {
    this.animation.playHead?.stop();
    this.updatePlayCursor();
    this.layers?.playhead.draw();
  }

  private createLineBackground(line: Konva.Group, size: Size) {
    const container = new Konva.Rect({
      fill: this.settings.backgroundcolor,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position'
    });
    line.add(container);
  }

  private createLineBorder(line: Konva.Group, size: Size) {
    const frame = new Konva.Rect({
      stroke: this.settings.frame.color,
      strokeWidth: 1,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position'
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
      transformsEnabled: 'position'
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
      sceneFunc: (context, shape) => {
        if (this.layers !== undefined && this.stage !== undefined && this.audioManager !== undefined &&
          line.y() + line.height() >= Math.abs(this.layers.background.y()) &&
          line.y() <= Math.abs(this.layers.background.y()) + this.stage.height() && this.av.audioTCalculator !== undefined) {
          const position = {
            x: 0,
            y: 0
          };
          const pxPerSecond = Math.round(this.av.audioTCalculator.samplestoAbsX(
            new SampleUnit(this.audioManager.sampleRate, this.audioManager.sampleRate)
          ));

          if (pxPerSecond >= 5) {
            const timeLineHeight = (this.settings.timeline.enabled) ? this.settings.timeline.height : 0;
            const vZoom = Math.round((this.settings.lineheight - timeLineHeight) / this.grid.horizontalLines);

            if (pxPerSecond > 0 && vZoom > 0) {
              // --- get the appropriate context
              context.beginPath();

              // set horizontal lines
              for (let y = Math.round(vZoom / 2); y < this.settings.lineheight - timeLineHeight; y = y + vZoom) {
                context.moveTo(position.x, y + position.y);
                context.lineTo(position.x + shape.width() - (this.settings.margin.left + this.settings.margin.right), y + position.y);
              }
              // set vertical lines
              for (let x = pxPerSecond; x < shape.width() - (this.settings.margin.left + this.settings.margin.right); x = x + pxPerSecond) {
                context.moveTo(position.x + x, position.y);
                context.lineTo(position.x + x, position.y + this.settings.lineheight - timeLineHeight);
              }

              context.stroke();
              context.fillStrokeShape(shape);
            }
          }
        }
      },
      transformsEnabled: 'position'
    });
    frame.perfectDrawEnabled(false);
    line.add(frame);
  }

  private createLinePlayCursor() {
    const group = new Konva.Group({
      name: 'playhead',
      x: this.settings.margin.left - this.settings.playcursor.width / 2,
      y: 0,
      transformsEnabled: 'position'
    });

    const frame = new Konva.Rect({
      fill: this.settings.playcursor.color,
      width: this.settings.playcursor.width,
      height: this.settings.lineheight,
      opacity: 0.25,
      transformsEnabled: 'position'
    });

    const caret = new Konva.Line({
      points: [this.settings.playcursor.width / 2, 0, this.settings.playcursor.width / 2, this.settings.lineheight],
      stroke: 'black',
      strokeWidth: 2,
      transformsEnabled: 'position'
    });

    group.add(frame);
    group.add(caret);

    if (this.layers !== undefined) {
      this.animation.playHead = new Konva.Animation(this.doPlayHeadAnimation, this.layers.playhead);
    }

    return group;
  }

  private scrollWithDeltaY(deltaY: number) {
    if (this.layers !== undefined && this.stage !== undefined && this.canvasElements !== undefined
      && this.canvasElements.lastLine !== undefined) {
      const newY = (this.canvasElements.lastLine.y() + this.canvasElements.lastLine.height()) * deltaY;
      this.layers.background.y(newY);
      this.layers.playhead.y(newY);
      this.layers.overlay.y(newY);
      this.layers.boundaries.y(newY);

      this.stage.batchDraw();
    }
  }

  private createLine(size: Size, position: Position, lineNum: number): Konva.Group {
    const result = new Konva.Group({
      name: 'line',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      transformsEnabled: 'position'
    });

    let selectedGroup = result;

    if (this.settings.cropping === 'circle' && this.av.innerWidth !== undefined) {
      selectedGroup = this.createCropContainer();
      size = new Size(this.av.innerWidth, this.av.innerWidth);
    }

    this.createLineBackground(selectedGroup, size);
    this.createLineGrid(selectedGroup, size);
    this.createLineSignal(selectedGroup, size, lineNum);
    this.createLineSelection(selectedGroup, size);
    this.createLineBorder(selectedGroup, size);

    if (this.settings.cropping === 'circle' && this.croppingData !== undefined) {
      const shadowCircle = new Konva.Circle({
        stroke: 'black',
        strokeWidth: 1,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius,
        shadowColor: 'black',
        shadowEnabled: true,
        shadowBlur: 5,
        shadowOffset: {x: 2.5, y: 0},
        shadowOpacity: 1
      });
      result.add(shadowCircle);
      result.add(selectedGroup);
      const borderedCircle = new Konva.Circle({
        stroke: 'black',
        strokeWidth: 2,
        x: this.croppingData.x,
        y: this.croppingData.y,
        radius: this.croppingData.radius
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
        if (this.layers !== undefined && this.stage !== undefined && line.y() + line.height() >= Math.abs(this.layers.background.y())
          && line.y() <= Math.abs(this.layers.background.y()) + this.stage.height() && this.av.innerWidth) {
          const timeLineHeight = (this.settings.timeline.enabled) ? this.settings.timeline.height : 0;
          const midline = Math.round((this.settings.lineheight - timeLineHeight) / 2);
          const absXPos = lineNum * this.av.innerWidth;

          const zoomX = this.av.zoomX;
          const zoomY = this.av.zoomY;

          const position = {
            x: 0,
            y: 0
          };
          context.beginPath();
          context.moveTo(position.x, position.y + midline - this.av.minmaxarray[absXPos]);

          if (!(midline === undefined || midline === undefined)
            && !(zoomY === undefined || zoomY === undefined)) {
            for (let x = 0; (x + absXPos) < absXPos + shape.width(); x++) {
              const xDraw = (!this.settings.roundValues) ? position.x + (x * zoomX) : Math.round(position.x + (x * zoomX));
              const yDraw = (!this.settings.roundValues)
                ? (position.y + midline - (this.av.minmaxarray[x + absXPos] * zoomY))
                : Math.round(position.y + midline - (this.av.minmaxarray[x + absXPos] * zoomY));

              if (!isNaN(yDraw) && !isNaN(xDraw)) {
                context.lineTo(xDraw, yDraw);
              } else {
                context.lineTo(x, midline);
              }

            }
          } else {
            if ((midline === undefined || midline === undefined)) {
              throw Error('midline is undefined!');
            } else if ((zoomY === undefined || zoomY === undefined)) {
              throw Error('ZoomY is undefined!');
            }
          }
          context.fillStrokeShape(shape);
        }
      },
      transformsEnabled: 'position'
    });
    frame.perfectDrawEnabled(false);
    line.add(frame);
  }

  private doPlayHeadAnimation = () => {
    this.updatePlayCursor();
  }

  private updatePlayCursor = () => {
    if (this.settings.selection.enabled && this.audioChunk !== undefined && this.canvasElements?.playHead !== undefined
      && this.av.audioTCalculator !== undefined && this.audioChunk.relativePlayposition !== undefined
      && this.av.PlayCursor !== undefined) {
      // TODO check this!
      let currentAbsX = this.av.audioTCalculator.samplestoAbsX(this.audioChunk.relativePlayposition);
      const endAbsX = this.av.audioTCalculator.samplestoAbsX(
        (this.audioChunk.time.end.sub(this.audioChunk.time.start)));
      currentAbsX = Math.min(currentAbsX, endAbsX - 1);
      this.changePlayCursorAbsX(currentAbsX);

      // get line of PlayCursor
      const cursorPosition = this.av.getPlayCursorPositionOfLineByAbsX(this.av.PlayCursor.absX);
      this.canvasElements.playHead.position(cursorPosition);
    }
  }

  private changePlayCursorAbsX = (newValue: number) => {
    if (this.audioChunk !== undefined && this.av.PlayCursor !== undefined && this.av.audioTCalculator !== undefined) {
      this.av.PlayCursor.changeAbsX(newValue, this.av.audioTCalculator, this.av.AudioPxWidth, this.audioChunk);
    }
  }

  private createSegmentsForCanvas() {
    let drawnBoundaries = 0;
    let y = 0;

    if (this.av.innerWidth !== undefined) {
      const maxLineWidth = this.av.innerWidth;
      let numOfLines = Math.ceil(this.av.AudioPxWidth / maxLineWidth);
      if (!this.settings.multiLine) {
        numOfLines = 1;
      }

      if (this.audioManager !== undefined && this._transcriptionLevel !== undefined && this.layers !== undefined && this.layers.overlay !== undefined &&
        this._transcriptionLevel.segments.length > 0 && this.audioChunk !== undefined) {
        let root: Konva.Group | Konva.Layer = this.layers.overlay;

        if (this.settings.cropping === 'circle') {
          const cropGroup = new Konva.Group({
            clipFunc: (ctx) => {
              if (this.croppingData !== undefined) {
                ctx.arc(this.croppingData.x, this.croppingData.y, this.croppingData.radius, 0, Math.PI * 2, false);
              }
            }
          });

          this.layers.overlay.add(cropGroup);
          root = cropGroup;
        }

        const segments = this._transcriptionLevel.segments.getSegmentsOfRange(
          this.audioChunk.time.start, this.audioChunk.time.end
        );

        const boundariesToDraw: {
          x: number,
          y: number,
          num: number,
          id: number
        }[] = [];

        if (this.av.audioTCalculator !== undefined) {
          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (segment !== undefined && segment?.time !== undefined) {
              const start = segment.time.sub(this.audioChunk.time.start);
              const absX = this.av.audioTCalculator.samplestoAbsX(start, this.audioChunk.time.duration);
              let beginTime = this.audioManager.createSampleUnit(0);
              const previousSegment = segments[i - 1];

              if (i > 0 && previousSegment.time !== undefined) {
                beginTime = previousSegment.time;
              }
              const beginX = this.av.audioTCalculator.samplestoAbsX(beginTime);
              const lineNum1 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(beginX / this.av.innerWidth) : 0;
              const lineNum2 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(absX / this.av.innerWidth) : 0;

              const segmentEnd = segment.time.clone();
              const audioChunkStart = this.audioChunk.time.start.clone();
              const audioChunkEnd = this.audioChunk.time.end.clone();

              if (
                (
                  (segmentEnd.samples >= audioChunkStart.samples && segmentEnd.samples <= audioChunkEnd.samples) ||
                  (beginTime.samples >= audioChunkStart.samples && beginTime.samples <= audioChunkEnd.samples) ||
                  (beginTime.samples < audioChunkStart.samples && segmentEnd.samples > audioChunkEnd.samples)
                )
              ) {
                let lastI: number | undefined = 0;
                this.removeSegmentFromCanvas(segment.id);
                const segmentHeight = (lineNum2 - lineNum1 + 1) * (this.settings.lineheight + this.settings.margin.top);

                const overlayGroup = new Konva.Group({
                  id: `segment_${segment.id}`
                });

                const overlaySegment = new Konva.Shape({
                  x: this.settings.margin.left,
                  y: 0,
                  fontFamily: 'Arial',
                  fontSize: 9,
                  width: this.av.innerWidth,
                  height: segmentHeight,
                  transformsEnabled: 'position',
                  sceneFunc: (context: any, shape: Shape) => {
                    this.overlaySceneFunction({
                      from: lineNum1,
                      to: lineNum2
                    }, segments, i, absX, beginTime, segmentHeight, numOfLines, context, shape)
                  }
                });

                overlayGroup.add(overlaySegment);

                if (this.settings.showTranscripts) {
                  const textBackground = new Konva.Shape({
                    opacity: 0.75,
                    x: this.settings.margin.left,
                    y: 0,
                    width: this.av.innerWidth,
                    height: segmentHeight,
                    transformsEnabled: 'position',
                    sceneFunc: (context: any, shape) => {
                      this.transcriptSceneFunction({
                        from: lineNum1,
                        to: lineNum2
                      }, segments, i, absX, beginTime, segmentHeight, numOfLines, context, shape);
                    }
                  });

                  overlayGroup.add(textBackground);
                  const segmentText = new Konva.Shape({
                    fill: 'black',
                    fontFamily: 'Arial',
                    fontSize: 11,
                    x: this.settings.margin.left,
                    y: 0,
                    transformsEnabled: 'position',
                    sceneFunc: (context) => {
                      if (this._transcriptionLevel !== undefined) {
                        const sceneSegment = this._transcriptionLevel.segments.getByID(segment.id);
                        if (sceneSegment !== undefined) {
                          lastI = this.drawTextLabel(context, sceneSegment.transcript, lineNum1, lineNum2, segmentEnd,
                            beginTime, lastI, segmentHeight, numOfLines, absX, segments, i);
                        }
                      }
                    }
                  });
                  overlayGroup.add(segmentText);
                }
                root.add(overlayGroup);
                this.drawnSegmentIDs.push(segment.id);
              }

              y = lineNum2 * (this.settings.lineheight + this.settings.margin.top);

              // draw boundary
              if (segment.time.samples !== this.audioManager.ressource.info.duration.samples
                && segment.time.samples <= this.audioManager.ressource.info.duration.samples
              ) {
                let relX = 0;
                if (this.settings.multiLine) {
                  relX = absX % this.av.innerWidth + this.settings.margin.left;
                } else {
                  relX = absX + this.settings.margin.left;
                }

                boundariesToDraw.push({
                  x: relX,
                  y,
                  num: i,
                  id: segment.id
                });
              }
            }
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
            width: this.av.innerWidth,
            height: this.height,
            x: this.settings.margin.left,
            y: this.settings.margin.top,
            fontSize: 10,
            fontFamily: 'Arial',
            transformsEnabled: 'position',
            sceneFunc: (context: any) => {
              this.timeLabelSceneFunction(y, numOfLines, context);
            }
          });
          this.layers.overlay.add(timeStampLabels);
        }

        // draw boundaries after all overlays were drawn
        if (this.settings.boundaries.enabled) {
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

            const foundBoundary = this.layers.boundaries.findOne(`#boundary_${boundary.id}`);
            if (foundBoundary !== undefined) {
              foundBoundary.remove();
            }

            const boundaryObj = new Konva.Line({
              id: `boundary_${boundary.id}`,
              strokeWidth: this.settings.boundaries.width,
              stroke: this.settings.boundaries.color,
              points: [boundary.x, boundary.y, boundary.x, boundary.y + h],
              transformsEnabled: 'position'
            });

            boundaryObj.on('mousedown', () => {
              if (!this.settings.boundaries.readonly) {
                this.av.dragableBoundaryNumber = boundary.num;
              }
            });
            boundaryObj.on('mouseenter', () => {
              if (this.konvaContainer !== undefined) {
                this.renderer.setStyle(this.konvaContainer.nativeElement, 'cursor', 'move');
              }
            });
            boundaryObj.on('mouseleave', () => {
              if (this.konvaContainer !== undefined) {
                this.renderer.setStyle(this.konvaContainer.nativeElement, 'cursor', 'auto');
              }
            });

            boundaryRoot.add(boundaryObj);
            drawnBoundaries++;
          }
          this.removeNonExistingSegments();
        }
      }
    }
  }

  private timeLabelSceneFunction = (y: number, numOfLines: number, context: any) => {
    if (this.canvasElements?.lastLine !== undefined && this.layers !== undefined && this.stage !== undefined && this.audioChunk !== undefined
      && this.av.innerWidth !== undefined) {
      for (let j = 0; j < numOfLines; j++) {
        // draw time label
        y = j * (this.settings.lineheight + this.settings.margin.top);

        if (y + this.settings.lineheight >= Math.abs(this.layers.background.y())
          && y <= Math.abs(this.layers.background.y()) + this.stage.height()) {
          let startTime = this.audioChunk.time.start.unix + j * (this.secondsPerLine * 1000);
          let endTime = 0;

          if (numOfLines > 1) {
            endTime = Math.min(startTime + this.secondsPerLine * 1000, this.audioChunk.time.duration.unix);
            endTime = Math.ceil(endTime / 1000) * 1000;
            startTime = Math.floor(startTime / 1000) * 1000;
          } else {
            endTime = this.audioChunk.time.start.unix + this.audioChunk.time.duration.unix;
          }

          const pipe = new TimespanPipe();
          const maxDuration = this.audioChunk.time.duration.unix;
          const startTimeString = pipe.transform(startTime,
            {
              showHour: true,
              showMilliSeconds: !this.settings.multiLine,
              maxDuration
            }
          );
          const endTimeString = pipe.transform(endTime,
            {
              showHour: true,
              showMilliSeconds: !this.settings.multiLine,
              maxDuration
            }
          );
          const length = this.layers.overlay.getContext().measureText(startTimeString).width;
          context.fillStyle = 'dimgray';
          context.fillText(startTimeString, 3, y + 8);
          context.fillText(endTimeString, ((j < numOfLines - 1)
            ? this.av.innerWidth : this.canvasElements.lastLine.width()) - length - 3, y + 8);
        }
      }
    }
  }

  private transcriptSceneFunction = (lineInterval: {
    from: number,
    to: number
  }, segments: Segment[], i: number, absX: number, beginTime: SampleUnit, segmentHeight: number, numOfLines: number, context: any, shape: Shape) => {
    if (this.layers !== undefined && this.stage !== undefined && this.canvasElements?.lastLine !== undefined && this.av.innerWidth !== undefined) {
      const absY = lineInterval.from * (this.settings.lineheight + this.settings.margin.top);
      for (let j = lineInterval.from; j <= lineInterval.to; j++) {
        const localY = j * (this.settings.lineheight + this.settings.margin.top);
        const segment = segments[i];

        if (absY + segmentHeight >= Math.abs(this.layers.background.y())
          && absY <= Math.abs(this.layers.background.y()) + this.stage.height() && segment?.time !== undefined) {

          const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
          const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segment?.time, this.av.innerWidth);

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

          if (j === numOfLines - 1 && i === segments.length - 1) {
            w = lineWidth - select.start + 1;
          }

          context.fillStyle = 'white';
          context.fillRect(x, localY + this.settings.lineheight - 20, w, 20);
        }
      }
      context.fillStrokeShape(shape);
    }
  }
  private overlaySceneFunction = (lineInterval: {
    from: number,
    to: number
  }, segments: Segment[], i: number, absX: number, beginTime: SampleUnit, segmentHeight: number, numOfLines: number, context: any, shape: Shape) => {
    if (this._transcriptionLevel !== undefined && this.layers !== undefined && this.stage !== undefined && this.audioChunk
      && this.canvasElements?.lastLine) {
      const segment = segments[i];
      const absY = lineInterval.from * (this.settings.lineheight + this.settings.margin.top);
      const sceneSegment = this._transcriptionLevel.segments.getByID(segment.id);
      if (sceneSegment === undefined || segment?.time === undefined) {
        console.error(`scenceSegment is undefined!`);
      } else {
        for (let j = lineInterval.from; j <= lineInterval.to; j++) {
          const localY = j * (this.settings.lineheight + this.settings.margin.top);

          if (absY + segmentHeight >= Math.abs(this.layers.background.y())
            && absY <= Math.abs(this.layers.background.y()) + this.stage.height() && this.av.innerWidth !== undefined) {

            const startSecond = j * this.secondsPerLine;
            let endSecond = 0;

            if (numOfLines > 1) {
              endSecond = Math.ceil(Math.min(startSecond + this.secondsPerLine, this.audioChunk.time.duration.seconds));
            } else {
              endSecond = Math.ceil(this.audioChunk.time.duration.seconds);
            }

            const pipe = new TimespanPipe();
            const maxDuration = this.audioChunk.time.duration.unix;

            const timeString = pipe.transform(endSecond * 1000, {
              showHour: true,
              showMilliSeconds: !this.settings.multiLine,
              maxDuration
            });
            const timestampWidth = this.layers.overlay.getContext().measureText(timeString).width;

            const h = this.settings.lineheight;
            const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
            const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segment.time, this.av.innerWidth);
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
            if (select.end < 1 || select.end > lineWidth) {
              w = select.end;
            }

            if (j === numOfLines - 1 && i === segments.length - 1) {
              w = lineWidth - select.start;
            }

            if (sceneSegment.isBlockedBy === undefined) {
              if (sceneSegment.transcript === '') {
                context.fillStyle = 'rgba(255,0,0,0.2)';
              } else if (this.breakMarker !== undefined && segment.transcript === this.breakMarker.code) {
                context.fillStyle = 'rgba(0,0,255,0.2)';
              } else if (sceneSegment.transcript !== '') {
                context.fillStyle = 'rgba(0,128,0,0.2)';
              }
              context.fillRect(x, localY, w, h);
            } else {
              let progressBarFillColor = '';
              let progressBarForeColor = '';
              if (sceneSegment.isBlockedBy === ASRQueueItemType.ASR) {
                // blocked by ASR
                context.fillStyle = 'rgba(255,191,0,0.5)';
                progressBarFillColor = 'rgba(221,167,14,0.8)';
                progressBarForeColor = 'black';
              } else if (sceneSegment.isBlockedBy === ASRQueueItemType.ASRMAUS) {
                context.fillStyle = 'rgba(179,10,179,0.5)';
                progressBarFillColor = 'rgba(179,10,179,0.8)';
                progressBarForeColor = 'white';
              } else if (sceneSegment.isBlockedBy === ASRQueueItemType.MAUS) {
                context.fillStyle = 'rgba(26,229,160,0.5)';
                progressBarFillColor = 'rgba(17,176,122,0.8)';
                progressBarForeColor = 'white';
              }
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

                if (progressWidth > 10 && sceneSegment.progressInfo !== undefined) {
                  const progressStart = x + 10 + ((x === 0) ? timestampWidth : 0);
                  const textPosition = Math.round(progressStart + progressWidth / 2);
                  const loadedPixels = Math.round(progressWidth * sceneSegment.progressInfo.progress);

                  this.drawRoundedRect(context, progressStart, localY + 3, 15, progressWidth, 5, 'transparent', progressBarFillColor);
                  this.drawRoundedRect(context, progressStart, localY + 3, 15, loadedPixels, 5, progressBarFillColor);

                  if (progressWidth > 100) {
                    const progressString = `${sceneSegment.progressInfo.statusLabel} ${sceneSegment.progressInfo.progress * 100}%`;
                    context.fillStyle = (progressStart + loadedPixels > textPosition && progressBarForeColor === 'white') ? 'white' : 'black';
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
  }

  private removeNonExistingSegments() {
    if (this._transcriptionLevel !== undefined) {
      const existingSegments: number[] = [];
      for (const existingSegment of this._transcriptionLevel.segments.segments) {
        existingSegments.push(existingSegment.id);
      }

      const segmentsToRemove: number[] = this.drawnSegmentIDs
        .filter((a) => {
          return existingSegments.findIndex((b) => {
            return b === a;
          }) < 0;
        });

      for (const idToRemove of segmentsToRemove) {
        this.removeSegmentFromCanvas(idToRemove);
      }
    }
  }

  private mouseChange = (event: any) => {
    if (this.av.innerWidth !== undefined) {
      const absXPos = this.hoveredLine * this.av.innerWidth + event.layerX;

      if (absXPos !== undefined && absXPos > 0 && this.settings.selection.enabled && this.audioChunk !== undefined
        && this.layers !== undefined) {
        if (event.type === 'mousedown') {
          this.audioChunk.selection.start = this.audioChunk.absolutePlayposition.clone();
          this.audioChunk.selection.end = this.audioChunk.absolutePlayposition.clone();
          this.av.drawnSelection = this.audioChunk.selection.clone();
        }

        this.av.setMouseClickPosition(absXPos, this.hoveredLine, event).then(() => {
          if (this.layers !== undefined) {
            this.updatePlayCursor();
            this.layers.playhead.draw();
          }
        });

        if (event.type !== 'mousedown') {
          this.selchange.emit(this.audioChunk.selection);
        }

        this.drawWholeSelection();
      }
      this._focused = true;
    }
  }

  private drawRoundedRect(context: any, x: number, y: number, height: number, width: number, radius: number,
                          fillColor: string, strokeColor?: string) {
    if (height > 0 && width > 0) {
      context.fillStyle = fillColor;
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
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
    if (this.canvasElements?.lastLine !== undefined && this.av.innerWidth !== undefined) {

      const group = new Konva.Group({
        id: 'scrollBar',
        x: this.av.innerWidth + this.settings.margin.left,
        y: 0,
        width: this.settings.scrollbar.width,
        height: this.height
      });

      const background = new Konva.Rect({
        stroke: this.settings.scrollbar.background.stroke,
        strokeWidth: this.settings.scrollbar.background.strokeWidth,
        fill: this.settings.scrollbar.background.color,
        width: this.settings.scrollbar.width,
        height: this.height
      });
      group.add(background);

      const rest = this.settings.scrollbar.width - this.settings.scrollbar.selector.width;
      const selector = new Konva.Rect({
        stroke: this.settings.scrollbar.selector.stroke,
        strokeWidth: this.settings.scrollbar.selector.strokeWidth,
        fill: this.settings.scrollbar.selector.color,
        width: this.settings.scrollbar.selector.width,
        height: background.height() / (this.canvasElements.lastLine.y() + this.canvasElements.lastLine.height()) * background.height(),
        x: (rest > 0) ? rest / 2 : 0,
        draggable: true,
        dragBoundFunc: (pos) => {
          if (this.height !== undefined && this.av.innerWidth !== undefined) {
            pos.x = this.av.innerWidth - ((rest > 0) ? rest / 2 : 0);
            pos.y = Math.max(Math.min(
              pos.y, this.height - selector.height()
            ), 0);
            return pos;
          }
          return {x: 0, y: 0};
        }
      });
      group.add(selector);
      this.canvasElements.scrollbarSelector = selector;

      selector.on('dragmove', this.onScrollbarDragged);

      selector.on('mouseenter', () => {
        if (this.konvaContainer !== undefined) {
          this.renderer.setStyle(this.konvaContainer.nativeElement, 'cursor', 'pointer');
        }
      });
      selector.on('mouseleave', () => {
        if (this.konvaContainer !== undefined) {
          this.renderer.setStyle(this.konvaContainer.nativeElement, 'cursor', 'auto');
        }
      });

      return group;
    }

    return undefined;
  }

  private onScrollbarDragged = () => {
    if (this.canvasElements.scrollbarSelector !== undefined && this.canvasElements?.scrollBar) {
      // delta in %
      const delta = (this.canvasElements.scrollbarSelector.y()) / this.canvasElements.scrollBar.height();

      this.scrollWithDeltaY(-delta);
    }
  }

  private drawSelection = (lineNum: number, lineWidth: number): Konva.Rect | undefined => {
    if (this.av.drawnSelection !== undefined && this.av.drawnSelection.length > 0 && this.stage !== undefined && this.layers !== undefined
      && this.av.innerWidth !== undefined) {
      // draw gray selection
      const select = this.av.getRelativeSelectionByLine(
        lineNum, lineWidth, this.av.drawnSelection.start, this.av.drawnSelection.end, this.av.innerWidth
      );

      const selections = this.stage.find('.selection');

      if (selections.length > lineNum && selections.length > 0) {

        if (lineNum > -1 && select) {
          const left = select.start;
          const right = select.end;
          let x = (left > right) ? right : left;

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

        this.layers.background.batchDraw();
      }
    }
    return undefined;
  }

  private resetSelection() {
    if (this.stage !== undefined) {
      this.stage.find('.selection').forEach((child) => {
        child.width(0);
        child.x(0);
      });
    }
  }

  private drawWholeSelection() {
    // draw selection
    this.resetSelection();
    if (this.layers !== undefined && this.audioChunk !== undefined && this.canvasElements?.lastLine) {
      if (this.av.drawnSelection !== undefined && !(this.av.drawnSelection.duration.equals(this.audioChunk.time.duration))
        && this.av.drawnSelection.duration.samples !== 0 && this.av.audioTCalculator !== undefined && this.av.innerWidth) {
        this.av.drawnSelection.checkSelection();
        const selStart = this.av.audioTCalculator.samplestoAbsX(this.av.drawnSelection.start);
        const selEnd = this.av.audioTCalculator.samplestoAbsX(this.av.drawnSelection.end);
        const lineNum1 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(selStart / this.av.innerWidth) : 0;
        const lineNum2 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(selEnd / this.av.innerWidth) : 0;
        const numOfLines = this.getNumberOfLines();


        for (let j = lineNum1; j <= lineNum2; j++) {
          const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
          const selectionRect = this.drawSelection(j, lineWidth);

          if (selectionRect !== undefined) {
            this.layers.overlay.add(selectionRect);
          }
        }
      } else {
        this.layers.background.batchDraw();
      }
    }
  }

  private getNumberOfLines() {
    if (this.av.innerWidth !== undefined) {
      return Math.ceil(this.av.AudioPxWidth / this.av.innerWidth);
    }
    return -1;
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

  private onMouseMove = (event: any) => {
    if (this.canvasElements.mouseCaret !== undefined && this.layers !== undefined && this.stage !== undefined
      && this.av.innerWidth !== undefined) {
      const tempLine = this.getLineNumber(event.layerX, event.layerY + Math.abs(this.layers.background.y()));
      this.hoveredLine = (tempLine > -1) ? tempLine : this.hoveredLine;
      const maxLines = Math.ceil(this.AudioPxWidth / this.av.innerWidth);
      const restAbsX = this.hoveredLine * this.av.innerWidth;
      const lineWidth = (this.hoveredLine === maxLines - 1 && maxLines > 1)
        ? this.av.AudioPxWidth - restAbsX : this.av.innerWidth;
      const layerX = Math.min(event.layerX, lineWidth);
      const absXPos = Math.min(this.hoveredLine * this.av.innerWidth + layerX, this.av.AudioPxWidth);

      if (!this.settings.cursor.fixed) {
        this.canvasElements.mouseCaret.position({
          x: layerX,
          y: this.hoveredLine * (this.settings.lineheight + this.settings.margin.top)
        });
        this.layers.playhead.batchDraw();
      }

      this.av.setMouseMovePosition(absXPos);
      if (this.av.dragableBoundaryNumber < 0) {
        this.drawWholeSelection();
      }

      this.mousecursorchange.emit({
        event,
        time: this.av.mouseCursor
      });
      this.stage.container().focus();
      this._focused = true;
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const shortcutInfo = this.shortcutsManager.checkKeyEvent(event, Date.now());

    if (shortcutInfo !== undefined) {
      const comboKey = shortcutInfo.shortcut;

      this.av.shiftPressed = comboKey === 'SHIFT';

      if (this.settings.shortcutsEnabled) {

        if (this._focused && this.isDisabledKey(comboKey)) {
          // key pressed is disabled by config
          event.preventDefault();
        } else {
          const shortcutName = shortcutInfo.shortcutName;
          const focuscheck = (shortcutInfo.onFocusOnly === false
            || (shortcutInfo.onFocusOnly === this._focused));

          if (focuscheck) {
            switch (shortcutName) {
              case('undo'):
                if (this.settings.boundaries.enabled && this._focused && !this.settings.boundaries.readonly) {
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    type: 'application',
                    timePosition: this.av?.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp
                  });
                }
                break;
              case('redo'):
                if (this.settings.boundaries.enabled && this._focused && !this.settings.boundaries.readonly) {
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    type: 'application',
                    timePosition: this.av?.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp
                  });
                }
                break;
              case('set_boundary'):
                if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused
                  && this.audioManager !== undefined && this.av.currentTranscriptionLevel !== undefined) {
                  const result = this.av.addSegment();
                  if (result !== undefined && result.msg !== undefined) {
                    if (result.msg.text && result.msg.text !== '') {
                      this.alert.emit({
                        type: result.msg.type,
                        message: result.msg.text
                      });
                    } else if (result.type !== undefined) {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: result.type,
                        type: 'boundary',
                        timePosition: this.audioManager.createSampleUnit(result.seg_samples),
                        timestamp: shortcutInfo.timestamp
                      });
                    }
                  }
                }
                break;
              case('set_break'):
                if (this.settings.boundaries.enabled && this._focused && this.av.mouseCursor !== undefined) {
                  const xSamples = this.av.mouseCursor.clone();

                  if (xSamples !== undefined && this._transcriptionLevel !== undefined) {
                    const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(xSamples);
                    const segment = this._transcriptionLevel.segments.get(segmentI);

                    if (segmentI > -1 && segment !== undefined && segment.isBlockedBy === undefined) {
                      if (segment.transcript !== this.breakMarker.code) {
                        segment.transcript = this.breakMarker.code;
                        this.shortcutTrigger.emit({
                          shortcut: comboKey,
                          shortcutName,
                          value: 'set_break',
                          type: 'segment',
                          timePosition: xSamples.clone(),
                          timestamp: shortcutInfo.timestamp
                        });
                      } else {
                        segment.transcript = '';
                        this.shortcutTrigger.emit({
                          shortcut: comboKey,
                          shortcutName,
                          value: 'remove_break',
                          type: 'segment',
                          timePosition: xSamples.clone(),
                          timestamp: shortcutInfo.timestamp
                        });
                      }

                      // replace with costum function
                      this._transcriptionLevel.segments.onsegmentchange.emit();
                    }
                  }
                }
                break;
              case('play_selection'):
                if (this._focused && this._transcriptionLevel !== undefined && this.audioChunk !== undefined && this.audioManager !== undefined
                  && this.av.mouseCursor !== undefined) {
                  const xSamples = this.av.mouseCursor.clone();

                  const boundarySelect = this.av.getSegmentSelection(this.av.mouseCursor.samples);
                  if (boundarySelect) {
                    const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(
                      xSamples);
                    if (segmentI > -1) {
                      const segment = this._transcriptionLevel.segments.get(segmentI);
                      const startTime = this._transcriptionLevel.segments.getStartTime(segmentI);
                      // make shure, that segments boundaries are visible
                      if (segment?.time !== undefined && (startTime as any).samples >= this.audioChunk.time.start.samples &&
                        segment.time.samples <= (this.audioChunk.time.end.samples + 1) &&
                        this.av.audioTCalculator !== undefined) {
                        const absX = this.av.audioTCalculator.samplestoAbsX(
                          segment.time
                        );
                        this.audioChunk.selection = boundarySelect.clone();
                        this.av.drawnSelection = boundarySelect.clone();
                        this.selchange.emit(this.audioChunk.selection);
                        this.drawWholeSelection();

                        let begin = this._transcriptionLevel.createSegment(this.audioManager.createSampleUnit(0));
                        if (segmentI > 0) {
                          begin = this._transcriptionLevel.segments.get(segmentI - 1) as any;
                        }

                        if (begin?.time !== undefined && this.av.innerWidth !== undefined) {
                          const beginX = this.av.audioTCalculator.samplestoAbsX(begin.time);

                          const posY1 = (this.av.innerWidth < this.AudioPxWidth)
                            ? Math.floor((beginX / this.av.innerWidth) + 1) *
                            (this.settings.lineheight + this.settings.margin.bottom) - this.settings.margin.bottom
                            : 0;

                          const posY2 = (this.av.innerWidth < this.AudioPxWidth)
                            ? Math.floor((absX / this.av.innerWidth) + 1) *
                            (this.settings.lineheight + this.settings.margin.bottom) - this.settings.margin.bottom
                            : 0;

                          if (xSamples.samples >= this.audioChunk.selection.start.samples
                            && xSamples.samples <= this.audioChunk.selection.end.samples) {
                            this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
                            this.changePlayCursorSamples(this.audioChunk.selection.start);
                            this.updatePlayCursor();

                            this.shortcutTrigger.emit({
                              shortcut: comboKey,
                              shortcutName,
                              value: shortcutName,
                              type: 'audio',
                              timePosition: xSamples.clone(),
                              selection: boundarySelect.clone(),
                              timestamp: shortcutInfo.timestamp
                            });

                            this.audioChunk.stopPlayback().then(() => {
                              if (this.audioChunk !== undefined) {
                                // after stopping start audio playback
                                this.audioChunk.selection = boundarySelect.clone();
                                this.playSelection(this.afterAudioEnded);
                              }
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
                          this.alert.emit({
                            type: 'error',
                            message: 'segment invisible'
                          });
                        }
                      }
                    }
                  }
                }
                break;
              case('delete_boundaries'):
                if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused
                  && this._transcriptionLevel !== undefined && this.audioManager !== undefined) {
                  let start = undefined;
                  let end = undefined;
                  if (this._transcriptionLevel.segments.length > 0) {

                    this.shortcutTrigger.emit({
                      shortcut: comboKey,
                      shortcutName,
                      value: shortcutName,
                      type: 'audio',
                      timePosition: this.av.mouseCursor?.clone(),
                      selection: this.av.drawnSelection?.clone(),
                      timestamp: shortcutInfo.timestamp
                    });

                    for (let i = 0; i < this._transcriptionLevel.segments.length; i++) {
                      const segment = this._transcriptionLevel.segments.get(i);

                      if (segment?.time !== undefined) {
                        if (this.av.drawnSelection !== undefined &&
                          segment.time.samples >= this.av.drawnSelection.start.samples
                          && segment.time.samples <= this.av.drawnSelection.end.samples
                          && i < this._transcriptionLevel.segments.length - 1
                        ) {
                          this._transcriptionLevel.segments.removeByIndex(i, this.breakMarker.code, false);
                          i--;
                          if (start === undefined) {
                            start = i;
                          }
                          end = i;
                        } else if (this.av.drawnSelection !== undefined && this.av.drawnSelection.end.samples < segment.time.samples) {
                          break;
                        }
                      }
                    }
                  }

                  if (start !== undefined && end !== undefined && this.av.drawnSelection !== undefined) {
                    this.av.drawnSelection.start = this.audioManager.createSampleUnit(0);
                    this.av.drawnSelection.end = this.av.drawnSelection.start.clone();
                    this._transcriptionLevel.segments.onsegmentchange.emit();
                  }
                }
                break;
              case('segment_enter'):
                if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused
                  && this._transcriptionLevel !== undefined && this.stage !== undefined && this.av.mouseCursor !== undefined) {
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'segment',
                    timePosition: this.av.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp
                  });

                  const segInde = this._transcriptionLevel.segments.getSegmentBySamplePosition(
                    this.av.mouseCursor
                  );
                  this.selectSegment(segInde).then(({posY1, posY2}) => {
                    this._focused = false;
                    this.drawWholeSelection();
                    this.stage?.draw();
                    this.segmententer.emit({
                      index: segInde,
                      pos: {Y1: posY1, Y2: posY2}
                    });
                  }).catch(() => {
                    this.alert.emit({
                      type: 'error',
                      message: 'segment invisible'
                    });
                  });
                }
                break;
              case('cursor_left'):
                if (this._focused && this.audioManager !== undefined && this.av.mouseCursor !== undefined) {
                  // move cursor to left
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'mouse',
                    timePosition: this.av.mouseCursor?.clone(),
                    timestamp: shortcutInfo.timestamp
                  });
                  this.av.moveCursor('left', this.settings.stepWidthRatio * this.audioManager.sampleRate);
                  this.changeMouseCursorSamples(this.av.mouseCursor);
                  this.mousecursorchange.emit({
                    event: undefined,
                    time: this.av.mouseCursor
                  });
                }
                break;
              case('cursor_right'):
                if (this._focused && this.audioManager !== undefined && this.av.mouseCursor !== undefined) {
                  // move cursor to right
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'mouse',
                    timePosition: this.av.mouseCursor.clone(),
                    timestamp: shortcutInfo.timestamp
                  });

                  this.av.moveCursor('right', this.settings.stepWidthRatio * this.audioManager.sampleRate);
                  this.changeMouseCursorSamples(this.av.mouseCursor);
                  this.mousecursorchange.emit({
                    event: undefined,
                    time: this.av.mouseCursor
                  });
                }
                break;
              case('playonhover'):
                if (this._focused && !this.settings.boundaries.readonly && this.av.mouseCursor !== undefined) {
                  // move cursor to right
                  this.shortcutTrigger.emit({
                    shortcut: comboKey,
                    shortcutName,
                    value: shortcutName,
                    type: 'option',
                    timePosition: this.av.mouseCursor.clone(),
                    timestamp: shortcutInfo.timestamp
                  });
                }
                break;

              case('do_asr'):
                if (this.settings.boundaries.enabled && this.focused && this.settings.asr.enabled && this._transcriptionLevel !== undefined
                  && this.av.mouseCursor !== undefined) {
                  const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(this.av.mouseCursor);
                  const segment = this._transcriptionLevel.segments.get(segmentI);

                  if (segmentI > -1) {
                    if (segment?.isBlockedBy === undefined) {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_asr',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    } else {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_asr',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    }
                    this._transcriptionLevel.segments.onsegmentchange.emit();
                  }
                }
                break;
              case('do_asr_maus'):
                if (this.settings.boundaries.enabled && this.settings.asr.enabled && this._transcriptionLevel &&
                  this.av.mouseCursor !== undefined) {
                  const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(this.av.mouseCursor);
                  const segment = this._transcriptionLevel.segments.get(segmentI);

                  if (segmentI > -1) {
                    if (segment?.isBlockedBy === undefined) {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_asr_maus',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    } else {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_asr_maus',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    }
                    this._transcriptionLevel.segments.onsegmentchange.emit();
                  }
                }
                break;

              case('do_maus'):
                if (this.settings.boundaries.enabled && this.settings.asr.enabled && this._transcriptionLevel !== undefined
                  && this.av.mouseCursor !== undefined) {
                  const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(this.av.mouseCursor);
                  const segment = this._transcriptionLevel.segments.get(segmentI);

                  if (segmentI > -1) {
                    if (segment?.isBlockedBy === undefined) {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'do_maus',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    } else {
                      this.shortcutTrigger.emit({
                        shortcut: comboKey,
                        shortcutName,
                        value: 'cancel_maus',
                        type: 'segment',
                        timePosition: this.av.mouseCursor.clone(),
                        timestamp: shortcutInfo.timestamp
                      });
                    }
                    this._transcriptionLevel.segments.onsegmentchange.emit();
                  }
                }
                break;
            }
          }
        }
      }
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    this.shortcutsManager.checkKeyEvent(event, Date.now());
  }

  /**
   * change samples of playcursor
   */
  private changePlayCursorSamples = (newValue: SampleUnit, chunk?: AudioChunk) => {
    if (this.av.PlayCursor !== undefined && this.av.audioTCalculator !== undefined) {
      this.av.PlayCursor.changeSamples(newValue, this.av.audioTCalculator, chunk);
      this.playcursorchange.emit(this.av.PlayCursor);
    }
  }

  private changeMouseCursorSamples = (newValue: SampleUnit) => {
    if (this.canvasElements?.mouseCaret !== undefined && this.layers !== undefined
      && this.av.audioTCalculator !== undefined && this.av.innerWidth !== undefined) {
      const absX = this.av.audioTCalculator.samplestoAbsX(newValue);
      const lines = Math.floor(absX / this.av.innerWidth);
      const x = absX % this.av.innerWidth;
      const y = lines * (this.settings.lineheight + this.settings.margin.top);

      this.canvasElements.mouseCaret.position({
        x,
        y
      });
      this.layers.playhead.batchDraw();
    }
  }

  /**
   * called if audio ended normally because end of segment reached
   */
  private afterAudioEnded = () => {
    if (this.audioChunk !== undefined && !this.audioChunk.replay) {
      // let cursor jump to start
      this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
      this.av.drawnSelection = (this.av.drawnSelection !== undefined) ? this.av.drawnSelection?.clone() : undefined;
    }

    this.updatePlayCursor();
    if (this.layers !== undefined) {
      this.layers.playhead.batchDraw();
    }
  }

  private onMouseEnter = () => {
    this.stage?.container().focus();
    this._focused = true;
  }

  private onMouseLeave = () => {
    this._focused = false;
  }

  private removeSegmentFromCanvas(segmentID: number) {
    if (segmentID > -1) {
      const overlayGroup = this.layers?.overlay.findOne(`#segment_${segmentID}`);
      const boundary = this.layers?.boundaries.findOne(`#boundary_${segmentID}`);

      if (overlayGroup !== undefined) {
        overlayGroup.remove();
      }
      if (boundary !== undefined) {
        boundary.remove();
      }

      this.drawnSegmentIDs = this.drawnSegmentIDs.filter((a) => {
        return a !== segmentID;
      });
    }
  }

  private createLineMouseCaret() {
    const group = new Konva.Group({
      name: 'mouseCaret',
      x: this.settings.margin.left,
      y: 0,
      width: 3,
      height: this.settings.lineheight
    });

    const caret = new Konva.Line({
      points: [0, 0, 0, this.settings.lineheight],
      stroke: 'red',
      strokeWidth: 2,
      transformsEnabled: 'position'
    });

    group.add(caret);
    return group;
  }

  public refreshLevel() {
    if (this.audioChunk !== undefined && this.av.audioTCalculator !== undefined && this._transcriptionLevel !== undefined
      && this.layers !== undefined && !this.refreshRunning) {
      this.refreshRunning = true;
      this.av.updateLevel(this._transcriptionLevel);
      this.createSegmentsForCanvas();
      this.layers.overlay.batchDraw();
      this.layers.boundaries.batchDraw();
      this.refreshRunning = false;
    } else {
      // console.error(new Error('can\'t refresh level'));
    }
  }

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

  private drawTextLabel(context: Konva.Context, text: string, lineNum1: number, lineNum2: number, segmentEnd: SampleUnit, beginTime: SampleUnit,
                        lastI: number | undefined, segmentHeight: number, numOfLines: number, absX: number, segments: Segment[], i: number): number | undefined {
    const segment = segments[i];

    if (text !== '' && this.layers !== undefined && this.stage !== undefined && this.canvasElements?.lastLine !== undefined
      && this.av.innerWidth !== undefined && segment?.time !== undefined && this.av.audioTCalculator !== undefined) {
      const y = lineNum1 * (this.settings.lineheight + this.settings.margin.top);
      for (let j = lineNum1; j <= lineNum2; j++) {
        const localY = (j + 1) * (this.settings.lineheight + this.settings.margin.top);

        if (y + segmentHeight >= Math.abs(this.layers.background.y())
          && y <= Math.abs(this.layers.background.y()) + this.stage.height()) {

          const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
          const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segment.time, this.av.innerWidth);
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

          if (j === numOfLines - 1 && i === segments.length - 1) {
            w = lineWidth - select.start + 1;
          }

          if (lineNum1 === lineNum2) {
            let textLength = context.measureText(text).width;
            let newText = text;
            // segment in same line
            if (textLength > w - 4) {
              // crop text
              const overflow = 1 - 1 / (textLength / (w - 35));
              const charsToRemove = Math.ceil(text.length * overflow / 2);
              const start = Math.ceil(text.length / 2 - charsToRemove);
              const end = start + charsToRemove * 2;
              newText = text.substring(0, start);
              newText += '...';
              newText += text.substring(end);
              textLength = context.measureText(newText).width;
            }
            const localX = (w - 4 - textLength) / 2 + x;
            context.fillText(newText, localX, localY - 5 - this.settings.margin.top);
          } else {
            const totalWidth = this.av.audioTCalculator.samplestoAbsX(segmentEnd.sub(beginTime));

            if (j === lineNum1) {
              // current line is start line
              const ratio = w / totalWidth;

              // crop text
              let newText = text.substring(0, Math.floor(text.length * ratio) - 2);
              const textLength = context.measureText(newText).width;

              if (textLength > w) {
                // crop text
                const leftHalf = w / textLength;
                newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 2);
              }
              lastI = newText.length;
              newText += '...';

              const localX = (w - 4 - textLength) / 2 + x;
              context.fillText(newText, localX, localY - 5 - this.settings.margin.top);
            } else if (j === lineNum2 && lastI !== undefined) {
              // crop text
              let newText = text.substring(lastI);
              const textLength = context.measureText(newText).width;

              if (textLength > w) {
                // crop text
                const leftHalf = w / textLength;
                newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
                newText = '...' + newText + '...';
              } else if (text !== this.breakMarker.code) {
                newText = '...' + newText;
              } else {
                newText = text;
              }

              const localX = (w - 4 - textLength) / 2 + x;
              context.fillText(newText, localX, localY - 5 - this.settings.margin.top);
              lastI = 0;
            } else if (lastI !== undefined) {
              let w2 = 0;

              if (lineNum1 > -1) {
                const lastPart = this.av.getRelativeSelectionByLine(lineNum1, w, beginTime,
                  segmentEnd, this.av.innerWidth);

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
                newText = newText.substring(0, Math.floor(newText.length * leftHalf) - 3);
              }
              lastI += newText.length;

              if (text !== this.breakMarker.code) {
                newText = '...' + newText + '...';
              } else {
                newText = text;
              }

              const localX = (w - 4 - textLength) / 2 + x;
              context.fillText(newText, localX, localY - 5 - this.settings.margin.top);
            }
          }
        }
      }
      return lastI;
    }

    return undefined;
  }
}

export interface AudioViewerShortcutEvent {
  shortcut: string;
  shortcutName: string;
  value?: string;
  type: string;
  timePosition?: SampleUnit;
  selection?: AudioSelection;
  timestamp: number;
}
