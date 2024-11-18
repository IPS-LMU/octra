import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AnnotationAnySegment,
  ASRContext,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { SubscriptionManager } from '@octra/utilities';
import { AudioChunk } from '@octra/web-media';
import Konva from 'konva';
import { Subject, Subscription, timer } from 'rxjs';
import { AudioviewerConfig } from './audio-viewer.config';
import { AnnotationChange, AudioViewerService } from './audio-viewer.service';
import Vector2d = Konva.Vector2d;

export interface CurrentLevelChangeEvent {
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
}

@Component({
  selector: 'octra-audio-viewer',
  templateUrl: './audio-viewer.component.html',
  styleUrls: ['./audio-viewer.component.css'],
  providers: [AudioViewerService],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class AudioViewerComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * annotation of type OctraAnnotation
   * @param value
   */
  @Input() set annotation(
    value: OctraAnnotation<ASRContext, OctraAnnotationSegment> | undefined
  ) {
    this.av.annotation = value ? value.clone() : undefined;
  }

  get annotation():
    | OctraAnnotation<ASRContext, OctraAnnotationSegment>
    | undefined {
    return this.av.annotation;
  }

  get focused() {
    return this.av.focused;
  }

  set secondsPerLine(value: number) {
    this.av.secondsPerLine = value;
  }

  @Output() get currentLevelChange(): EventEmitter<CurrentLevelChangeEvent> {
    return this.av.currentLevelChange;
  }

  /**
   * triggered when annotation changes.
   */
  @Output() get annotationChange(): EventEmitter<
    OctraAnnotation<ASRContext, OctraAnnotationSegment>
  > {
    return this.av.annotationChange;
  }

  /**
   * defines if intern changes should redraw the signal display.
   */
  @Input() set refreshOnInternChanges(value: boolean) {
    this.av.refreshOnInternChanges = value;
  }

  @Input() set currentLevelID(value: number | undefined) {
    this.av.currentLevelID = value;
  }

  constructor(
    public av: AudioViewerService,
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {
    this.subscrManager = new SubscriptionManager<Subscription>();

    this.subscrManager.add(
      this.av.boundaryDragging.subscribe((event) => {
        if (event.status === 'stopped') {
          this.renderer.setStyle(
            this.konvaContainer?.nativeElement,
            'cursor',
            'auto'
          );
        }
      })
    );
  }

  /**
   * defines if this signal display is split over lines
   * @param value
   */
  @Input() set isMultiLine(value: boolean) {
    this.settings.multiLine = value;
  }

  public get mouseCursor(): {
    location: Vector2d | undefined;
    size:
      | {
          height: number;
          width: number;
        }
      | undefined;
  } {
    return this.av.mouseCursorCanvasElement;
  }

  public get settings(): AudioviewerConfig {
    return this.av.settings;
  }

  /**
   * settings of the Audioviewer. You can overwrite the default values.
   * @param value
   */
  @Input()
  public set settings(value: AudioviewerConfig) {
    this.av.settings = value;
  }

  public get width(): number | undefined {
    return this.elementRef.nativeElement.clientWidth;
  }

  public get height(): number | undefined {
    return this.konvaContainer?.nativeElement.clientHeight;
  }

  get AudioPxWidth(): number {
    return this.av.AudioPxWidth;
  }

  /**
   * current audio chunk displayed by this signal display
   */
  @Input() audioChunk: AudioChunk | undefined;

  /**
   * name of this signal display
   */
  @Input() set name(value: string) {
    this.av.name = value;
  }

  get name() {
    return this.av.name;
  }

  /**
   * defines the placeholder for silenece. E.g. if it's <code><p></code> and a segment
   * contains this value, the segment is marked as silence.
   */
  @Input() silencePlaceholder?: string;

  /**
   * triggers when a key shortcut was pressed
   */
  @Output() get shortcut() {
    return this.av.shortcut;
  }

  /**
   * triggers when a part of the signal display was selected
   */
  @Output() get selchange() {
    return this.av.selchange;
  }

  /**
   * triggers whenever the playcursor changes.
   */
  @Output() get playcursorchange() {
    return this.av.playcursorchange;
  }

  /**
   * triggers when the user enters a selected segment
   */
  @Output() get segmententer() {
    return this.av.segmententer;
  }

  /**
   * triggers whenever the mousecursor position changes.
   */
  @Output() get mousecursorchange() {
    return this.av.mousecursorchange;
  }

  /**
   * triggers when some message should be sent to the user.
   */
  @Output() get alert() {
    return this.av.alert;
  }

  /**
   * triggers when the boundary was dragged.
   */
  @Output()
  public get boundaryDragging(): Subject<{
    status: 'started' | 'stopped' | 'dragging';
    id: number;
    shiftPressed?: boolean;
  }> {
    return this.av.boundaryDragging;
  }

  @ViewChild('konvaContainer', { static: true }) konvaContainer:
    | ElementRef
    | undefined;

  // EVENTS
  public get onInitialized() {
    return this.av.onInitialized;
  }

  private resizing = false;
  private lastResize = 0;
  private subscrManager: SubscriptionManager<Subscription>;

  ngOnInit() {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let doInitialization = false;

    const isMultiLine = changes['isMultiLine'];
    if (isMultiLine && !isMultiLine.firstChange) {
      doInitialization = true;
    }

    const audioChunk = changes['audioChunk'];
    if (audioChunk && audioChunk.currentValue !== undefined) {
      this.afterChunkUpdated(audioChunk.currentValue);
    }

    const annotation = changes['annotation'];
    if (annotation && annotation.currentValue !== undefined) {
      const t = Date.now();
      const parsedChanges = this.av.getChanges(
        annotation.previousValue,
        annotation.currentValue
      );
      if (annotation.previousValue && annotation.currentValue) {
        if (
          annotation.previousValue.selectedLevelIndex !==
          annotation.currentValue.selectedLevelIndex
        ) {
          this.av.updateAllSegments(true);
        } else {
          this.afterLevelUpdated(parsedChanges, annotation.previousValue);
        }
      } else {
        this.afterLevelUpdated(parsedChanges, annotation.previousValue);
      }
    }

    const silencePlaceholder = changes['silencePlaceholder'];
    if (silencePlaceholder) {
      this.av.silencePlaceholder = silencePlaceholder.currentValue;
    }

    if (doInitialization) {
      this.init();
    }
  }

  ngOnDestroy(): void {
    this.subscrManager.destroy();
    this.av.destroy();
  }

  afterChunkUpdated(audioChunk?: AudioChunk) {
    if (audioChunk) {
      this.subscrManager.removeByTag('audioChunkStatusChange');
      this.subscrManager.removeByTag('audioChunkChannelFinished');

      this.subscrManager.add(
        audioChunk.statuschange.subscribe({
          next: this.onAudioChunkStatusChanged,
          error: (error) => {
            console.error(error);
          },
        }),
        'audioChunkStatusChange'
      );

      let time = Date.now();
      new Promise<void>((resolve, reject) => {
        if (audioChunk && !audioChunk.audioManager.channel) {
          this.subscrManager.add(
            audioChunk.audioManager.onChannelDataChange.subscribe({
              next: () => {
                resolve();
              },
              error: (error: any) => {
                reject(error);
              },
            }),
            'audioChunkChannelFinished'
          );
        } else {
          resolve();
        }
      })
        .then(() => {
          console.log(`Channel data computation took ${Date.now() - time}ms`);
          time = Date.now();
          // channel data is ready
          if (
            this.width &&
            audioChunk &&
            this.av.annotation?.currentLevel &&
            this.av.annotation.currentLevel.items.length > 0
          ) {
            this.av.initialize(
              this.width,
              this.height,
              this.konvaContainer?.nativeElement,
              audioChunk
            );

            this.av
              .initializeSettings()
              .then(() => {
                this.av.initializeView();
                console.log(`Initializing view took ${Date.now() - time}ms`);
              })
              .catch((error) => {
                console.error(error);
              });
          } else {
            // ignore
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error(`AudioViewer: chunk is undefined.`);
    }
  }

  private afterLevelUpdated(
    changes: AnnotationChange[],
    oldAnnotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>
  ) {
    if (this.av.currentLevel && this.av.currentLevel.items.length > 0) {
      // subscribe to levelChanges for extern changes
      this.subscrManager.removeByTag('externLevelChanges');
      this.av.applyChanges(changes, oldAnnotation);
    }
  }

  public selectSegment(
    segIndex: number
  ): Promise<{ posY1: number; posY2: number }> {
    return this.av.selectSegment(segIndex);
  }

  public scrollToAbsY(absY: number) {
    this.av.scrollToAbsY(absY);
  }

  public enableShortcuts() {
    this.av.shortcutsManager.registerShortcutGroup(this.settings.shortcuts);
  }

  public disableShortcuts() {
    this.av.shortcutsManager.clearShortcuts();
  }

  onSecondsPerLineChanged(secondsPerLine: number) {
    this.av.onSecondsPerLineChanged(secondsPerLine);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    const wait = 100;
    this.lastResize = Date.now();
    this.subscrManager.removeByTag('resize');
    this.subscrManager.add(
      timer(wait).subscribe({
        next: () => {
          if (Date.now() - this.lastResize >= wait && !this.resizing) {
            this.resizing = true;
            const old = Date.now();
            this.av
              .onResize(this.width, this.height)
              .then(() => {
                this.lastResize = Date.now();
                this.resizing = false;
                console.log(
                  `resizing took ${Date.now() - old}ms for viewer ${this.name}`
                );
              })
              .catch((error) => {
                console.error(error);
                this.resizing = false;
              });
          }
        },
      }),
      'resize'
    );
  }

  public redraw() {
    this.av.redraw();
  }

  public init() {
    this.av.renderer = this.renderer;
  }

  private onAudioChunkStatusChanged = (status: PlayBackStatus) => {
    switch (status) {
      case PlayBackStatus.INITIALIZED:
        break;
      case PlayBackStatus.PREPARE:
        break;
      case PlayBackStatus.PLAYING:
        this.av.onPlaybackStarted();
        break;
      case PlayBackStatus.PAUSED:
        this.av.onPlaybackPaused();
        break;
      case PlayBackStatus.STOPPED:
        this.av.onPlaybackStopped();
        break;
      case PlayBackStatus.ENDED:
        this.av.onPlaybackEnded();
        break;
    }
  };
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
