import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import Konva from 'konva';
import {AudioChunk, AudioManager} from '../../../obj/audio/AudioManager';
import {AudioSelection, PlayBackStatus, SampleUnit} from '../../../obj/audio';
import {SubscriptionManager} from '../../../obj/SubscriptionManager';
import {Level, Segment} from '../../../obj/annotation';
import {AudioViewerService} from './audio-viewer.service';
import {AudioviewerConfig} from './audio-viewer.config';
import {Subject} from 'rxjs';
import {Position, Size} from '../../../obj/objects';
import {Timespan2Pipe} from '../../../pipe/timespan2.pipe';
import {KeyMapping} from '../../../obj/key-mapping';
import {BrowserInfo} from '../../../obj/browser-info';
import {PlayCursor} from '../../../obj/PlayCursor';
import {Context} from 'konva/types/Context';
import {ASRQueueItemType} from '../../../obj/annotation/asr';
import {isUnset} from '../../../../core/shared/Functions';
import Vector2d = Konva.Vector2d;
import Group = Konva.Group;
import Layer = Konva.Layer;

@Component({
  selector: 'octra-audio-viewer',
  templateUrl: './audio-viewer.component.html',
  styleUrls: ['./audio-viewer.component.css'],
  providers: [AudioViewerService]
})
export class AudioViewerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  get focused(): boolean {
    return this._focused;
  }

  constructor(public av: AudioViewerService) {
  }

  private _transcriptionLevel: Level;
  @Input() audioChunk: AudioChunk;

  get transcriptionLevel(): Level {
    return this._transcriptionLevel;
  }

  @Input() public name = '';

  @Input()
  public set height(value: number) {
    if (!isUnset(this.stage)) {
      this.stage.height(value);
      this.initializeView();
    }
  }

  @Input() breakMarker: any;

  @Input()
  public set isMultiLine(value: boolean) {
    console.log(`is multiline ${value}`);
    this.settings.multiLine = value;
    this.init();
  }

  public get mouseCursor(): {
    location: Vector2d,
    size: {
      height: number;
      width: number;
    }
  } {
    if (isUnset(this.canvasElements.mouseCaret)) {
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
        location: this.canvasElements.mouseCaret.position(),
        size: this.canvasElements.mouseCaret.size()
      };
    }
  }

  @Output() shortcuttriggered = new EventEmitter<any>();
  @Output() alerttriggered = new EventEmitter<{ type: string, message: string }>();
  @Output() selchange = new EventEmitter<AudioSelection>();
  @Output() playcursorchange = new EventEmitter<PlayCursor>();
  @Output() segmententer: EventEmitter<any> = new EventEmitter<any>();
  @Output() mousecursorchange = new EventEmitter<{
    event: MouseEvent,
    time: SampleUnit
  }>();

  @ViewChild('konvaContainer', {static: true}) konvaContainer: ElementRef;

  private stage: Konva.Stage;
  public updating = false;
  // EVENTS
  public onInitialized = new Subject<void>();
  public secondsPerLine = 5;
  public mouseStatus = 'auto';
  private hoveredLine = -1;
  private croppingData: {
    x: number,
    y: number,
    radius: number
  };

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
  };

  private subscrManager = new SubscriptionManager();
  private oldInnerWidth = 0;
  private _initialized = false;
  private _deactivateShortcuts = false;

  private animation: {
    playHead: Konva.Animation
  } = {
    playHead: null
  };

  private canvasElements: {
    playHead: Konva.Group,
    mouseCaret: Konva.Group,
    scrollBar: Konva.Group,
    scrollbarSelector: Konva.Rect,
    lastLine: Konva.Group
  } = {
    playHead: null,
    mouseCaret: null,
    scrollBar: null,
    scrollbarSelector: null,
    lastLine: null
  };
  private wheeling;
  private resizingTimer: any;

  private grid = {
    verticalLines: 3,
    horizontalLines: 2
  };
  private widthOnInit;
  private deactivateShortcuts = false;
  private _focused = false;

  @Input() set transcriptionLevel(value: Level) {
    this._transcriptionLevel = value;
  }

  public get settings(): AudioviewerConfig {
    return this.av.settings;
  }

  @Input()
  public set settings(value: AudioviewerConfig) {
    this.av.settings = value;
  }

  public get audioManager(): AudioManager {
    return this.audioChunk.audioManager;
  }

  public get width(): number {
    return this.konvaContainer.nativeElement.offsetWidth;
  }

  public get height(): number {
    return this.konvaContainer.nativeElement.clientHeight;
  }

  public get getPlayHeadX(): number {
    return 0;
  }

  get AudioPxWidth(): number {
    return this.av.AudioPxWidth;
  }

  private tempTextWidths: {
    segmentID: number,
    text: string,
    width: number
  }[] = [];

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('audioChunk') && changes.audioChunk.currentValue !== null) {
      this.afterChunkUpdated();
    }
    if (changes.hasOwnProperty('transcriptionLevel') && changes.transcriptionLevel.currentValue !== null) {
      this.afterLevelUpdated();
    }

    if (changes.hasOwnProperty('settings') && changes.settings.currentValue !== null) {
      this.afterSettingsUpdated();
    }

    if (changes.hasOwnProperty('breakMarker') && changes.transcriptionLevel.currentValue !== null) {
      this.av.breakMarker = this.breakMarker;
    }


    if (!isUnset(this.stage)) {
      this.stage.height(this.height);
    }
  }

  ngAfterViewInit(): void {
    this.init();
  }

  private init() {
    this.widthOnInit = this.width;
    this.styles.height = this.height;
    console.log(`height = ${this.height}`);

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
        hitGraphEnabled: false
      }),
      overlay: new Konva.Layer({
        id: 'overlayLayer',
        hitGraphEnabled: false
      }),
      boundaries: new Konva.Layer({
        id: 'boundariesLayer'
      }),
      playhead: new Konva.Layer({
        id: 'playheadLayer',
        hitGraphEnabled: false
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

    for (const attr in this.layers) {
      if (this.layers.hasOwnProperty(attr)) {
        this.stage.add(this.layers['' + attr]);
      }
    }
    const container = this.stage.container();
    container.tabIndex = 1;

    // focus it
    // also stage will be in focus on its click
    container.focus();
    container.removeEventListener('keydown', this.onKeyDown);
    container.addEventListener('keydown', this.onKeyDown);
    container.removeEventListener('mouseleave', this.onMouseLeave);
    container.addEventListener('mouseleave', this.onMouseLeave);
    container.removeEventListener('mouseenter', this.onMouseEnter);
    container.addEventListener('mouseenter', this.onMouseEnter);

    window.onresize = () => {
      this.onResize();
    };
  }

  private afterSettingsUpdated() {
    console.log(`settings were updated!`);
  }

  public getPixelPerSecond(secondsPerLine: number) {
    return (this.av.innerWidth / secondsPerLine);
  }

  ngOnDestroy(): void {
    this.subscrManager.destroy();
    this.stage.destroy();

    this.konvaContainer.nativeElement.removeEventListener('keydown', this.onKeyDown);
    this.konvaContainer.nativeElement.removeEventListener('mouseleave', this.onMouseLeave);
    this.konvaContainer.nativeElement.removeEventListener('mouseenter', this.onMouseEnter);
    this.konvaContainer.nativeElement.removeEventListener('mousemove', this.onMouseMove);
    this.konvaContainer.nativeElement.removeEventListener('mousedown', this.mouseChange);
    this.konvaContainer.nativeElement.removeEventListener('mouseup', this.mouseChange);
  }

  afterChunkUpdated() {
    if (!(this.audioChunk === null || this.audioChunk === undefined)) {
      this.subscrManager.removeByTag('audioChunkStatusChange');
      this.subscrManager.removeByTag('audioChunkChannelFinished');

      this.subscrManager.add(this.audioChunk.statuschange.subscribe(
        this.onAudioChunkStatusChanged
        , (error) => {
          console.error(error);
        }), 'audioChunkStatusChange');

      new Promise<void>((resolve, reject) => {
        if (isUnset(this.audioChunk.audioManager.channel)) {
          this.subscrManager.add(
            this.audioChunk.audioManager.onChannelDataChange.subscribe(() => {
                resolve();
              },
              (error) => {
                reject(error);
              },
              () => {
              })
            , 'audioChunkChannelFinished');
        } else {
          resolve();
        }
      }).then(() => {
        this.av.initialize(this.width - (this.settings.margin.left + this.settings.margin.right), this.audioChunk, this._transcriptionLevel);
        this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);

        this.av.initializeSettings().then((result) => {
          this.initializeView();
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  afterLevelUpdated() {
    if (!isUnset(this._transcriptionLevel)) {
      console.log(`LEVEL updated ${this._transcriptionLevel.segments.length}`);
      this.av.updateLevel(this._transcriptionLevel);
      this.subscrManager.removeByTag(`segmentchange`);
      this.subscrManager.add(this._transcriptionLevel.segments.onsegmentchange.subscribe(() => {
          // TODO replace this with costum function
          this.av.updateLevel(this._transcriptionLevel);
          this.createSegmentsForCanvas();
          this.layers.overlay.batchDraw();
          this.layers.boundaries.batchDraw();
        },
        (error) => {
          console.error(error);
        },
        () => {
          console.log(`segmentchange viewer complete`);
        }), 'segmentchange');
    }
  }

  onSecondsPerLineChanged(secondsPerLine: number) {
    this.secondsPerLine = secondsPerLine;
    this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
    this.av.initializeSettings().then((result) => {
      this.initializeView();
    }).catch((error) => {
      console.error(error);
    });
  }

  onResize() {
    clearTimeout(this.resizingTimer);
    this.resizingTimer = setTimeout(() => {
      const playpos = this.audioChunk.absolutePlayposition.clone();
      const drawnSelection = this.av.drawnSelection.clone();
      this.stage.width(this.width);
      this.av.initialize(this.width - (this.settings.margin.left + this.settings.margin.right), this.audioChunk, this._transcriptionLevel);
      this.settings.pixelPerSec = this.getPixelPerSecond(this.secondsPerLine);
      this.av.initializeSettings().then(() => {
        if (!this.audioChunk.isPlaying) {
          this.audioChunk.absolutePlayposition = playpos.clone();
        }
        this.av.drawnSelection = drawnSelection;
        this.updateLines();
        this.createSegmentsForCanvas();
        this.updatePlayCursor();
        this.stage.batchDraw();
      }).catch(() => {
      });
    }, 200);
  }

  public initializeView() {
    this.onInitialized.next();
    for (const attr in this.layers) {
      if (this.layers.hasOwnProperty(attr)) {
        this.layers['' + attr].removeChildren();
        this.audioManager.createSampleUnit(0)
      }
    }

    if (this.settings.cropping === 'circle') {
      this.settings.lineheight = this.av.innerWidth;
      const circleWidth = this.av.innerWidth - 5;
      this.croppingData = {
        x: circleWidth / 2 + 2 + this.settings.margin.left,
        y: circleWidth / 2 + 2 + this.settings.margin.top,
        radius: circleWidth / 2
      };
    }
    if (this.settings.multiLine) {
      const optionalScrollbarWidth = (this.settings.scrollbar.enabled) ? this.settings.scrollbar.width : 0;
      let lineWidth = this.av.innerWidth;
      const numOfLines = Math.ceil(this.av.AudioPxWidth / lineWidth);

      let y = 0;
      for (let i = 0; i < numOfLines - 1; i++) {
        const line = this.createLine(new Size(lineWidth, this.settings.lineheight), new Position(this.settings.margin.left, y), i);
        this.layers.background.add(line);
        y += this.settings.lineheight + this.settings.margin.top;
        this.canvasElements.lastLine = line;
      }
      // add last line
      lineWidth = this.av.AudioPxWidth % lineWidth;
      if (lineWidth > 0) {
        const line = this.createLine(new Size(lineWidth, this.settings.lineheight), new Position(this.settings.margin.left, y), numOfLines - 1);
        this.layers.background.add(line);
        this.canvasElements.lastLine = line;
      }

    } else {
      const line = this.createLine(
        new Size(this.av.innerWidth, this.settings.lineheight),
        new Position(this.settings.margin.left, 0), 0);
      this.layers.background.add(line);
      this.canvasElements.lastLine = line;
    }

    this.createSegmentsForCanvas();

    this.canvasElements.playHead = this.createLinePlayCursor();
    if (this.settings.selection.enabled) {
      this.layers.playhead.add(this.canvasElements.playHead);
    }

    this.canvasElements.mouseCaret = this.createLineMouseCaret();
    this.layers.playhead.add(this.canvasElements.mouseCaret);


    if (this.settings.cropping === 'circle') {
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
      this.layers.scrollBars.add(this.canvasElements.scrollBar);
    }

    this.stage.batchDraw();
  }

  private createCropContainer(id?: string): Group {
    return new Konva.Group({
      id,
      clipFunc: (ctx) => {
        ctx.arc(this.croppingData.x, this.croppingData.y, this.croppingData.radius, 0, Math.PI * 2, false);
      }
    });
  }

  private onPlaybackStarted() {
    console.log(`start playhead animation ${this.name}`);
    this.animation.playHead.start();
  }

  private onPlaybackPaused() {
    console.log(`stop playhead animation ${this.name}`);
    this.animation.playHead.stop();
  }

  public updateLines = () => {
    const lines = this.layers.background.find('.line');

    // check all lines but the last one
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const geometrics = line.getChildren();
      line.width(this.av.innerWidth);
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < geometrics.length; j++) {
        const elem = geometrics[j];
        if ((lines.length > 1 && i < lines.length - 1) || lines.length === 1) {
          if (elem.name() !== 'selection' && elem.id !== 'scrollBar') {
            elem.width(this.av.innerWidth);
          }
        } else {
          const width = this.av.AudioPxWidth % this.av.innerWidth;
          line.width(width);
          // last line
          if (elem.name() !== 'selection' && elem.id !== 'scrollBar') {
            elem.width(width);
          }
        }
      }
    }

    this.layers.scrollBars.find('#scrollBar')[0].x(this.av.innerWidth + this.settings.margin.left);
    this.drawWholeSelection();
  }

  private onAudioChunkStatusChanged = (status: PlayBackStatus) => {
    console.log(`status audioviewer to ${status}!`);
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
    this.animation.playHead.stop();
    this.updatePlayCursor();
    this.layers.playhead.draw();
  }

  private onPlaybackEnded() {
    this.animation.playHead.stop();
    this.updatePlayCursor();
    this.layers.playhead.draw();
  }

  onWheel = (event) => {
    if (!isUnset(this.audioChunk) && this.audioChunk.status !== PlayBackStatus.PREPARE
      && this.canvasElements.scrollBar !== null) {
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

  private createLineGrid(line: Konva.Group, size: Size, lineNum: number) {
    const frame = new Konva.Shape({
      opacity: 0.2,
      stroke: this.settings.grid.color,
      strokeWidth: 1,
      width: size.width,
      height: size.height,
      sceneFunc: (context, shape) => {
        if (line.y() + line.height() >= Math.abs(this.layers.background.y())
          && line.y() <= Math.abs(this.layers.background.y()) + this.stage.height()) {
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
      y: this.settings.margin.top,
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

    this.animation.playHead = new Konva.Animation(this.doPlayHeadAnimation, this.layers.playhead);

    return group;
  }

  private scrollWithDeltaY(deltaY: number) {
    const newY = (this.canvasElements.lastLine.y() + this.canvasElements.lastLine.height()) * deltaY;
    this.layers.background.y(newY);
    this.layers.playhead.y(newY);
    this.layers.overlay.y(newY);
    this.layers.boundaries.y(newY);

    this.stage.batchDraw();
  }

  public scrollToAbsY(absY: number) {
    const deltaY = absY / (this.canvasElements.lastLine.y() + this.canvasElements.lastLine.height());
    this.scrollWithDeltaY(-deltaY);
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


    if (this.settings.cropping === 'circle') {
      selectedGroup = this.createCropContainer();
      size = new Size(this.av.innerWidth, this.av.innerWidth);
    }

    this.createLineBackground(selectedGroup, size);
    this.createLineGrid(selectedGroup, size, lineNum);
    this.createLineSignal(selectedGroup, size, lineNum);
    this.createLineSelection(selectedGroup, size);
    this.createLineBorder(selectedGroup, size);

    if (this.settings.cropping === 'circle') {
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
        if (line.y() + line.height() >= Math.abs(this.layers.background.y())
          && line.y() <= Math.abs(this.layers.background.y()) + this.stage.height()) {
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

          if (!(midline === null || midline === undefined)
            && !(zoomY === null || zoomY === undefined)) {
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
            if ((midline === null || midline === undefined)) {
              throw Error('midline is null!');
            } else if ((zoomY === null || zoomY === undefined)) {
              throw Error('ZoomY is null!');
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

  private addSegmentBoundaryToCanvas = (segment: Segment) => {

  }

  private doPlayHeadAnimation = (frame) => {
    this.updatePlayCursor();
  }

  private updatePlayCursor = () => {
    if (this.settings.selection.enabled) {
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
    this.av.PlayCursor.changeAbsX(newValue, this.av.audioTCalculator, this.av.AudioPxWidth, this.audioChunk);
  }

  public selectSegment(segIndex: number, successcallback: (posY1: number, posY2: number) => void = () => {
                       },
                       errorcallback: () => void = () => {
                       }): boolean {
    if (segIndex > -1) {
      const segment = this._transcriptionLevel.segments.get(segIndex);
      const startTime = this._transcriptionLevel.segments.getStartTime(segIndex);
      // make shure, that segments boundaries are visible
      if (startTime.samples >= this.audioChunk.time.start.samples
        && segment.time.samples <= (this.audioChunk.time.end.samples + 1)) {
        const absX = this.av.audioTCalculator.samplestoAbsX(this._transcriptionLevel.segments.get(segIndex).time);
        let begin = new Segment(this.audioManager.createSampleUnit(0));
        if (segIndex > 0) {
          begin = this._transcriptionLevel.segments.get(segIndex - 1);
        }
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
            this.audioManager.stopPlayback();
          }
        }

        successcallback(posY1, posY2);

        return true;
      } else {
        console.log(`segment invisible error: start and endtime not between the audioChunk time`);
        errorcallback();
      }
      return false;
    } else {
      console.log(`segment invisible error: seg-index is -1`);
      errorcallback();
    }
    return false;
  }

  private createSegmentsForCanvas(startSegment: number = -1, endSegment: number = -1) {
    let drawnSegments = 0;
    let drawnBoundaries = 0;
    let y = 0;
    const maxLineWidth = this.av.innerWidth;
    let numOfLines = Math.ceil(this.av.AudioPxWidth / maxLineWidth);
    if (!this.settings.multiLine) {
      numOfLines = 1;
    }

    if (this._transcriptionLevel.segments.length > 0) {
      let root: Konva.Group | Konva.Layer = this.layers.overlay;

      if (this.settings.cropping === 'circle') {
        const cropGroup = new Konva.Group({
          clipFunc: (ctx) => {
            ctx.arc(this.croppingData.x, this.croppingData.y, this.croppingData.radius, 0, Math.PI * 2, false);
          }
        });

        this.layers.overlay.add(cropGroup);
        root = cropGroup;
      }

      const segments = this._transcriptionLevel.segments.getSegmentsOfRange(
        this.audioChunk.time.start, this.audioChunk.time.end
      )

      const boundariesToDraw: {
        x: number,
        y: number,
        num: number,
        id: number
      }[] = [];

      const startLoop = (startSegment > -1) ? startSegment : 0;
      const endLoop = (endSegment > -1) ? endSegment + 1 : segments.length;

      for (let i = startLoop; i < endLoop; i++) {
        const segment = segments[i];
        const start = segment.time.sub(this.audioChunk.time.start);
        const absX = this.av.audioTCalculator.samplestoAbsX(start, this.audioChunk.time.duration);
        let beginTime = this.audioManager.createSampleUnit(0);

        if (i > 0) {
          beginTime = segments[i - 1].time;
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
          let lastI = 0;
          this.removeSegmentFromCanvas(segment.id);
          const segmentHeight = (lineNum2 - lineNum1 + 1) * (this.settings.lineheight + this.settings.margin.top);

          const overlayGroup = new Konva.Group({
            id: `segment_${segment.id}`
          });

          const overlaySegment = new Konva.Shape({
            opacity: 0.2,
            x: this.settings.margin.left,
            y: 0,
            width: this.av.innerWidth,
            height: segmentHeight,
            transformsEnabled: 'position',
            sceneFunc: (context: any, shape) => {
              const absY = lineNum1 * (this.settings.lineheight + this.settings.margin.top);
              for (let j = lineNum1; j <= lineNum2; j++) {
                const localY = j * (this.settings.lineheight + this.settings.margin.top);

                if (absY + segmentHeight >= Math.abs(this.layers.background.y())
                  && absY <= Math.abs(this.layers.background.y()) + this.stage.height()) {

                  const h = this.settings.lineheight;
                  const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
                  let relX = 0;

                  relX = absX % this.av.innerWidth + this.settings.margin.left;
                  const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segments[i].time, this.av.innerWidth);
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

                  if (segment.isBlockedBy !== ASRQueueItemType.ASR) {
                    if (segment.transcript === '') {
                      context.fillStyle = 'red';
                    } else if (!isUnset(this.breakMarker) && segment.transcript === this.breakMarker.code) {
                      context.fillStyle = 'blue';
                    } else if (segment.transcript !== '') {
                      context.fillStyle = 'green';
                    }
                  } else {
                    // blocked by ASR
                    context.fillStyle = '#ffcf3f';
                  }
                  context.fillRect(x, localY, w, h);
                }
              }
              context.fillStrokeShape(shape);
            }
          });

          drawnSegments++;
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
                const absY = lineNum1 * (this.settings.lineheight + this.settings.margin.top);
                for (let j = lineNum1; j <= lineNum2; j++) {
                  const localY = j * (this.settings.lineheight + this.settings.margin.top);

                  if (absY + segmentHeight >= Math.abs(this.layers.background.y())
                    && absY <= Math.abs(this.layers.background.y()) + this.stage.height()) {

                    const h = this.settings.lineheight;
                    const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
                    let relX = 0;

                    relX = absX % this.av.innerWidth + this.settings.margin.left;
                    const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segments[i].time, this.av.innerWidth);
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
            });

            overlayGroup.add(textBackground);
            const segmentText = new Konva.Shape({
              fill: 'black',
              fontFamily: 'Arial',
              fontSize: 11,
              x: this.settings.margin.left,
              y: 0,
              transformsEnabled: 'position',
              sceneFunc: (context, shape) => {
                lastI = this.drawTextLabel(context, segment.transcript, lineNum1, lineNum2, segmentEnd,
                  beginTime, lastI, segmentHeight, numOfLines, absX, segments, i);
              }
            });
            overlayGroup.add(segmentText);
          }
          root.add(overlayGroup);
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

      // draw time labels
      if (this.settings.showTimePerLine) {
        const foundText = this.layers.overlay.findOne('#timeStamps');
        if (!isUnset(foundText)) {
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
          sceneFunc: (context: any, shape) => {
            for (let j = 0; j < numOfLines; j++) {
              // draw time label
              y = j * (this.settings.lineheight + this.settings.margin.top);

              if (y + this.settings.lineheight >= Math.abs(this.layers.background.y())
                && y <= Math.abs(this.layers.background.y()) + this.stage.height()) {
                const startSecond = j * this.secondsPerLine;
                let endSecond = 0;

                if (numOfLines > 1) {
                  endSecond = Math.ceil(Math.min(startSecond + this.secondsPerLine, this.audioChunk.time.duration.seconds));
                } else {
                  endSecond = Math.ceil(this.audioChunk.time.duration.seconds);
                }

                const pipe = new Timespan2Pipe();
                const length = this.layers.overlay.getContext().measureText(pipe.transform(endSecond * 1000)).width;
                context.fillStyle = 'dimgray';
                context.fillText(pipe.transform(startSecond * 1000), 5, y + 12);
                context.fillText(pipe.transform(endSecond * 1000), ((j < numOfLines - 1)
                  ? this.av.innerWidth : this.canvasElements.lastLine.width()) - length - 5, y + 12);
              }
            }
          }
        });
        this.layers.overlay.add(timeStampLabels);
      }

      // draw boundaries after all overlays were drawn
      if (this.settings.boundaries.enabled) {
        let boundaryRoot: Group | Layer = this.layers.boundaries;
        if (this.settings.cropping === 'circle') {
          boundaryRoot = this.layers.boundaries.findOne(`#boundary-root`);

          if (isUnset(boundaryRoot)) {
            boundaryRoot = this.createCropContainer('boundary-root');
            this.layers.boundaries.add(boundaryRoot);
          }
        }

        for (let i = 0; i < boundariesToDraw.length; i++) {
          const boundary = boundariesToDraw[i];
          const h = this.settings.lineheight;

          const foundBoundary = this.layers.boundaries.findOne(`#boundary_${boundary.id}`);
          if (!isUnset(foundBoundary)) {
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
            this.mouseStatus = 'move';
          });
          boundaryObj.on('mouseleave', () => {
            this.mouseStatus = 'auto';
          });

          boundaryRoot.add(boundaryObj);
          drawnBoundaries++;
        }
      }
    }
  }

  private mouseChange = (event) => {
    const absXPos = this.hoveredLine * this.av.innerWidth + event.layerX;

    if (!isUnset(absXPos) && absXPos > 0 && this.settings.selection.enabled) {
      if (event.type === 'mousedown') {
        this.audioChunk.selection.start = this.audioChunk.absolutePlayposition.clone();
        this.audioChunk.selection.end = this.audioChunk.absolutePlayposition.clone();
        this.av.drawnSelection = this.audioChunk.selection.clone();
      }

      if (!isUnset(absXPos)) {
        this.av.setMouseClickPosition(absXPos, this.hoveredLine, event).then(() => {
          this.updatePlayCursor();
          this.layers.playhead.draw();
        });
      } else {
        console.error(`absX is unset!`);
      }

      if (event.type !== 'mousedown') {
        this.selchange.emit(this.audioChunk.selection);
      }

      this.drawWholeSelection();
    }
    this._focused = true;
  }

  private createScrollBar = () => {
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
        pos.x = this.av.innerWidth - ((rest > 0) ? rest / 2 : 0);
        pos.y = Math.max(Math.min(
          pos.y, this.height - selector.height()
        ), 0);
        return pos;
      }
    });
    group.add(selector);
    this.canvasElements.scrollbarSelector = selector;

    selector.on('dragmove', this.onScrollbarDragged);

    selector.on('mouseenter', () => {
      this.mouseStatus = 'pointer';
    });
    selector.on('mouseleave', () => {
      this.mouseStatus = 'auto';
    });

    return group;
  }

  private onScrollbarDragged = () => {
    // delta in %
    const delta = (this.canvasElements.scrollbarSelector.y()) / this.canvasElements.scrollBar.height();

    this.scrollWithDeltaY(-delta);
  }

  private drawSelection = (lineNum: number, lineWidth: number): Konva.Rect | null => {
    if (!isUnset(this.av.drawnSelection) && this.av.drawnSelection.length > 0) {
      // draw gray selection
      const select = this.av.getRelativeSelectionByLine(
        lineNum, lineWidth, this.av.drawnSelection.start, this.av.drawnSelection.end, this.av.innerWidth
      );

      const selections = this.stage.find('.selection');

      if (selections.length > lineNum && selections.length > 0) {
        const y = lineNum * (this.settings.lineheight + this.settings.margin.top);
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
    } else {
      console.log(`no draw`);
    }
    return null;
  }

  private resetSelection() {
    const selections = this.stage.find('.selection');

    for (let i = 0; i < selections.length; i++) {
      selections[i].width(0);
      selections[i].x(0);
    }
  }

  private drawWholeSelection() {
    // draw selection
    this.resetSelection();
    if (!(this.av.drawnSelection.duration.equals(this.audioChunk.time.duration)) && this.av.drawnSelection.duration.samples !== 0) {
      this.av.drawnSelection.checkSelection();
      const selStart = this.av.audioTCalculator.samplestoAbsX(this.av.drawnSelection.start);
      const selEnd = this.av.audioTCalculator.samplestoAbsX(this.av.drawnSelection.end);
      const lineNum1 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(selStart / this.av.innerWidth) : 0;
      const lineNum2 = (this.av.innerWidth < this.AudioPxWidth) ? Math.floor(selEnd / this.av.innerWidth) : 0;
      const numOfLines = this.getNumberOfLines();

      // console.log('DRAW Selection ' + this.settings.height);
      for (let j = lineNum1; j <= lineNum2; j++) {
        const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
        const selectionRect = this.drawSelection(j, lineWidth);

        if (selectionRect !== null) {
          this.layers.overlay.add(selectionRect);
        }
      }
    } else {
      this.layers.background.batchDraw();
    }
  }

  private getNumberOfLines() {
    return Math.ceil(this.av.AudioPxWidth / this.av.innerWidth);
  }

  /**
   * playSelection() plays the selected signal fragment or the selection in this chunk
   */
  playSelection = (afterAudioEnded: () => void, onProcess: () => void = () => {
  }) => {
    this.audioChunk.startPlayback().then(() => {
      if (this.av.drawnSelection !== null && this.av.drawnSelection.duration.samples > 0) {
        this.audioChunk.selection = this.av.drawnSelection.clone();
        this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
      }
      afterAudioEnded();
    }).catch((error) => {
      console.error(error);
    });
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

  private onMouseMove = (event) => {
    if (!isUnset(this.canvasElements.mouseCaret)) {
      const tempLine = this.getLineNumber(event.layerX, event.layerY + Math.abs(this.layers.background.y()));
      this.hoveredLine = (tempLine > -1) ? tempLine : this.hoveredLine;
      const absXPos = this.hoveredLine * this.av.innerWidth + event.layerX;

      if (!this.settings.cursor.fixed) {
        this.canvasElements.mouseCaret.position({
          x: event.layerX,
          y: this.hoveredLine * (this.settings.lineheight + this.settings.margin.top)
        });
        this.layers.playhead.batchDraw();
      }

      this.av.setMouseMovePosition(absXPos);
      if (this.av.dragableBoundaryNumber > -1) {
        // something dragged
        this.createSegmentsForCanvas();
        this.stage.batchDraw();
      } else {
        this.drawWholeSelection();
      }

      this.mousecursorchange.emit({
        event: event,
        time: this.av.mouseCursor
      });
      this.stage.container().focus();
      this._focused = true;
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const comboKey = KeyMapping.getShortcutCombination(event);
    this.av.shiftPressed = comboKey === 'SHIFT';

    if (this.settings.shortcutsEnabled && !this.deactivateShortcuts) {
      const platform = BrowserInfo.platform;

      if (this._focused && this.isDisabledKey(comboKey)) {
        // key pressed is disabled by config
        event.preventDefault();
      }

      if (this.settings.shortcuts) {
        let keyActive = false;
        for (const shortc in this.settings.shortcuts) {
          if (this.settings.shortcuts.hasOwnProperty(shortc)) {
            const shortcut = this.settings.shortcuts['' + shortc + ''];
            const focuscheck = (!(shortcut === null || shortcut === undefined)) && (shortcut.focusonly === false
              || (shortcut.focusonly === this._focused));

            if (focuscheck && this.settings.shortcuts['' + shortc + ''].keys['' + platform + ''] === comboKey) {
              switch (shortc) {
                case('play_pause'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});
                  if (this.audioManager.state === PlayBackStatus.PLAYING) {
                    this.audioChunk.pausePlayback();
                  } else {
                    this.audioChunk.startPlayback();
                  }
                  keyActive = true;
                  break;
                case('stop'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.audioChunk.stopPlayback();
                  keyActive = true;
                  break;
                case('step_backward'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.audioChunk.stepBackward();
                  keyActive = true;
                  break;
                case('step_backwardtime'):
                  this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                  this.audioChunk.stepBackwardTime(0.5);
                  keyActive = true;
                  break;
                case('set_boundary'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused) {
                    let segments = this._transcriptionLevel.segments;
                    const result = this.av.addSegment();
                    segments = this.av.currentTranscriptionLevel.segments;
                    if (result !== null && result.msg !== null) {
                      if (result.type === 'remove' && result.seg_ID > -1) {
                        this.removeSegmentFromCanvas(result.seg_ID);
                      }
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
                      }

                      if (result.seg_samples > -1 && result.seg_ID > -1) {
                        const num = segments.getNumberByID(result.seg_ID);
                        const startSegment = Math.max(num - 1, 0);
                        const endSegment = (num < segments.length - 2) ? num + 1 : segments.length - 1;

                        this.createSegmentsForCanvas(startSegment, endSegment);
                        this.layers.overlay.draw();
                        this.layers.boundaries.draw();
                      }
                    }
                    keyActive = true;
                  }
                  break;
                case('set_break'):
                  if (this.settings.boundaries.enabled && this._focused) {
                    const xSamples = this.av.mouseCursor.clone();

                    if (xSamples !== null) {
                      const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(xSamples);
                      const segment = this._transcriptionLevel.segments.get(segmentI);

                      if (segmentI > -1) {
                        if (segment.transcript !== this.breakMarker.code) {
                          segment.transcript = this.breakMarker.code;
                          this.shortcuttriggered.emit({shortcut: comboKey, value: 'set_break', type: 'segment'});
                        } else {
                          segment.transcript = '';
                          this.shortcuttriggered.emit({shortcut: comboKey, value: 'remove_break', type: 'segment'});
                        }

                        // replace with costum function
                        // this.updateSegments();
                        this._transcriptionLevel.segments.onsegmentchange.emit();
                      }
                    }

                    keyActive = true;
                  }
                  break;
                case('play_selection'):
                  if (this._focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'audio'});

                    const xSamples = this.av.mouseCursor.clone();

                    const boundarySelect = this.av.getSegmentSelection(this.av.mouseCursor.samples);
                    if (boundarySelect) {
                      const segmentI = this._transcriptionLevel.segments.getSegmentBySamplePosition(
                        xSamples);
                      if (segmentI > -1) {
                        const segment = this._transcriptionLevel.segments.get(segmentI);
                        const startTime = this._transcriptionLevel.segments.getStartTime(segmentI);
                        // make shure, that segments boundaries are visible
                        if (startTime.samples >= this.audioChunk.time.start.samples &&
                          segment.time.samples <= (this.audioChunk.time.end.samples + 1)) {
                          const absX = this.av.audioTCalculator.samplestoAbsX(
                            this._transcriptionLevel.segments.get(segmentI).time
                          );
                          this.audioChunk.selection = boundarySelect.clone();
                          this.av.drawnSelection = boundarySelect.clone();
                          this.selchange.emit(this.audioChunk.selection);
                          this.drawWholeSelection();

                          let begin = new Segment(this.audioManager.createSampleUnit(0));
                          if (segmentI > 0) {
                            begin = this._transcriptionLevel.segments.get(segmentI - 1);
                          }
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

                            this.audioChunk.stopPlayback().then(() => {
                              // after stopping start audio playback
                              this.audioChunk.selection = boundarySelect.clone();
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
                          this.alerttriggered.emit({
                            type: 'error',
                            message: 'segment invisible'
                          });
                        }
                      }
                    }
                    keyActive = true;
                  }
                  break;
                case('delete_boundaries'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused) {
                    // TODO trigger event for logging?

                    let start = null;
                    let end = null;
                    if (this._transcriptionLevel.segments.length > 0) {
                      for (let i = 0; i < this._transcriptionLevel.segments.length; i++) {
                        const segment = this._transcriptionLevel.segments.get(i);

                        if (segment.time.samples >= this.av.drawnSelection.start.samples
                          && segment.time.samples <= this.av.drawnSelection.end.samples
                          && i < this._transcriptionLevel.segments.length - 1
                        ) {
                          this._transcriptionLevel.segments.removeByIndex(i, this.breakMarker.code);
                          this.removeSegmentFromCanvas(segment.id);
                          i--;
                          if (start === null) {
                            start = i;
                          }
                          end = i;
                        } else if (this.av.drawnSelection.end.samples < segment.time.samples) {
                          break;
                        }
                      }
                    }

                    if (start !== null && end !== null) {
                      this.av.drawnSelection.start = this.audioManager.createSampleUnit(0);
                      this.av.drawnSelection.end = this.av.drawnSelection.start.clone();
                      // this.updateSegments(start, end);
                    }
                    keyActive = true;
                  }
                  break;
                case('segment_enter'):
                  if (this.settings.boundaries.enabled && !this.settings.boundaries.readonly && this._focused) {
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'segment'});

                    const segInde = this._transcriptionLevel.segments.getSegmentBySamplePosition(
                      this.av.mouseCursor
                    );
                    this.selectSegment(segInde,
                      (posY1, posY2) => {
                        this._focused = false;
                        this.drawWholeSelection();
                        this.stage.draw();
                        this.segmententer.emit({
                          index: segInde,
                          pos: {Y1: posY1, Y2: posY2}
                        });
                      },
                      () => {
                        this.alerttriggered.emit({
                          type: 'error',
                          message: 'segment invisible'
                        });
                      });

                    keyActive = true;
                  }
                  break;
                case('cursor_left'):
                  if (this._focused) {
                    // move cursor to left
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});
                    this.av.moveCursor('left', this.settings.stepWidthRatio * this.audioManager.sampleRate);
                    this.changeMouseCursorSamples(this.av.mouseCursor);
                    this.mousecursorchange.emit({
                      event: null,
                      time: this.av.mouseCursor
                    });
                    keyActive = true;
                  }
                  break;
                case('cursor_right'):
                  if (this._focused) {
                    // move cursor to right
                    this.shortcuttriggered.emit({shortcut: comboKey, value: shortc, type: 'mouse'});

                    this.av.moveCursor('right', this.settings.stepWidthRatio * this.audioManager.sampleRate);
                    this.changeMouseCursorSamples(this.av.mouseCursor);
                    this.mousecursorchange.emit({
                      event: null,
                      time: this.av.mouseCursor
                    });
                    keyActive = true;
                  }
                  break;
                case('playonhover'):
                  if (this._focused && !this.settings.boundaries.readonly) {
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
          event.preventDefault();
        }
      }
    }
  }

  /**
   * change samples of playcursor
   */
  private changePlayCursorSamples = (newValue: SampleUnit, chunk?: AudioChunk) => {
    this.av.PlayCursor.changeSamples(newValue, this.av.audioTCalculator, chunk);
    this.playcursorchange.emit(this.av.PlayCursor);
  }

  private changeMouseCursorSamples = (newValue: SampleUnit) => {
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

  /**
   * called if audio ended normally because end of segment reached
   */
  private afterAudioEnded = () => {
    if (!this.audioChunk.replay) {
      // let cursor jump to start
      this.audioChunk.absolutePlayposition = this.audioChunk.selection.start.clone();
      this.av.drawnSelection = (this.av.drawnSelection !== null) ? this.av.drawnSelection.clone() : null;
    }

    this.updatePlayCursor();
    this.layers.playhead.batchDraw();
  }

  private onMouseEnter = () => {
    this.stage.container().focus();
    this._focused = true;
  }

  private onMouseLeave = () => {
    this._focused = false;
  }

  private removeSegmentFromCanvas(segmentID: number) {
    if (segmentID > -1) {
      const overlayGroup = this.layers.overlay.findOne(`#segment_${segmentID}`);
      const boundary = this.layers.boundaries.findOne(`#boundary_${segmentID}`);

      if (!isUnset(overlayGroup)) {
        overlayGroup.remove();
      }
      if (!isUnset(boundary)) {
        boundary.remove();
      }
    }
  }

  private createLineMouseCaret() {
    const group = new Konva.Group({
      name: 'mouseCaret',
      x: this.settings.margin.left,
      y: this.settings.margin.top,
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

  private drawTextLabel(context: Context, text: string, lineNum1: number, lineNum2: number, segmentEnd: SampleUnit, beginTime: SampleUnit,
                        lastI: number, segmentHeight: number, numOfLines: number, absX: number, segments: Segment[], i: number): number {
    if (text !== '') {
      const y = lineNum1 * (this.settings.lineheight + this.settings.margin.top);
      for (let j = lineNum1; j <= lineNum2; j++) {
        const localY = (j + 1) * (this.settings.lineheight + this.settings.margin.top);

        if (y + segmentHeight >= Math.abs(this.layers.background.y())
          && y <= Math.abs(this.layers.background.y()) + this.stage.height()) {

          const h = this.settings.lineheight;
          const lineWidth = (j < numOfLines - 1) ? this.av.innerWidth : this.canvasElements.lastLine.width();
          let relX = 0;

          relX = absX % this.av.innerWidth + this.settings.margin.left;
          const select = this.av.getRelativeSelectionByLine(j, lineWidth, beginTime, segments[i].time, this.av.innerWidth);
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
            } else if (j === lineNum2) {
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
            } else {
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
  }

  public enableShortcuts() {
    this._deactivateShortcuts = false;
  }

  public disableShortcuts() {
    this._deactivateShortcuts = true;
  }
}
