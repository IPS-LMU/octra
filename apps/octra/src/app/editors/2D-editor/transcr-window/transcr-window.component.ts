import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { getProperties } from '@octra/utilities';
import { TranscrEditorComponent } from '../../../core/component';

import { AsyncPipe, NgClass, NgStyle } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import {
  addSegment,
  ASRContext,
  ASRQueueItemType,
  getSegmentBySamplePosition,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
} from '@octra/annotation';
import { OctraGuidelines } from '@octra/assets';
import { AudioSelection, SampleUnit } from '@octra/media';
import {
  AudioViewerComponent,
  AudioViewerShortcutEvent,
  OctraComponentsModule,
} from '@octra/ngx-components';
import {
  AudioChunk,
  AudioManager,
  AudioResource,
  Shortcut,
  ShortcutGroup,
} from '@octra/web-media';
import { HotkeysEvent } from 'hotkeys-js';
import { timer } from 'rxjs';
import { AudioNavigationComponent } from '../../../core/component/audio-navigation';
import { AudioNavigationComponent as AudioNavigationComponent_1 } from '../../../core/component/audio-navigation/audio-navigation.component';
import { DefaultComponent } from '../../../core/component/default.component';
import { NavbarService } from '../../../core/component/navbar/navbar.service';
import { TranscrEditorComponent as TranscrEditorComponent_1 } from '../../../core/component/transcr-editor/transcr-editor.component';
import {
  AlertService,
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../../core/shared/service';
import { AppStorageService } from '../../../core/shared/service/appstorage.service';
import { ShortcutService } from '../../../core/shared/service/shortcut.service';
import { ApplicationStoreService } from '../../../core/store/application/application-store.service';
import { ASRProcessStatus } from '../../../core/store/asr';
import { AsrStoreService } from '../../../core/store/asr/asr-store-service.service';
import { AnnotationStoreService } from '../../../core/store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgStyle,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    AudioNavigationComponent_1,
    OctraComponentsModule,
    TranscrEditorComponent_1,
    NgClass,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class TranscrWindowComponent
  extends DefaultComponent
  implements OnInit, AfterContentInit, AfterViewInit, OnChanges
{
  @ViewChild('magnifier', { static: true }) magnifier!: AudioViewerComponent;
  @ViewChild('editor', { static: true }) editor!: TranscrEditorComponent;
  @ViewChild('audionav', { static: true }) audionav!: AudioNavigationComponent;
  @ViewChild('window', { static: true }) window!: ElementRef;
  @ViewChild('main', { static: true }) main!: ElementRef;
  @Output() act: EventEmitter<string> = new EventEmitter<string>();
  @Input() easyMode: boolean | undefined | null = false;
  @Input() audiochunk!: AudioChunk;
  @Input() segmentIndex!: number;

  private showWindow = false;
  private tempSegments!: OctraAnnotationSegment[];
  private oldRaw = '';
  protected showOverviewButton = false;

  private get currentLevel() {
    return this.annotationStoreService.currentLevel;
  }

  private guidelines!: OctraGuidelines;
  private breakMarkerCode?: string;
  private idCounter = 1;

  @Output()
  get shortcuttriggered(): EventEmitter<AudioViewerShortcutEvent> {
    return this.magnifier.shortcut;
  }

  @Output()
  get marker_insert(): EventEmitter<string> {
    return this.editor.markerInsert;
  }

  @Output()
  get marker_click(): EventEmitter<string> {
    return this.editor.markerClick;
  }

  get app_settings(): any {
    return this.settingsService.appSettings;
  }

  get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get audioManager(): AudioManager {
    return this.audiochunk.audioManager;
  }

  get ressource(): AudioResource {
    return this.audiochunk.audioManager.resource;
  }

  public get hasSegmentBoundaries() {
    return this.editor.rawText.match(/{[0-9]+}/) !== null;
  }

  private _validationEnabled = false;

  get validationEnabled(): boolean {
    return this._validationEnabled;
  }

  private _loading = false;

  get loading(): boolean {
    return this._loading;
  }

  public get mainSize(): {
    width: number;
    height: number;
  } {
    if (this.main !== undefined) {
      return {
        width: this.main.nativeElement.clientWidth,
        height: this.main.nativeElement.clientHeight,
      };
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  }

  onAudioPlayPause = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent.shortcut,
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    if (this.audiochunk.isPlaying) {
      this.audiochunk.pausePlayback().catch((error) => {
        console.error(error);
      });
    } else {
      this.audiochunk.startPlayback(false).catch((error) => {
        console.error(error);
      });
    }
  };

  onStopAudio = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent.shortcut,
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.audiochunk.stopPlayback().catch((error) => {
      console.error(error);
    });
  };

  onStepBackward = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent.shortcut,
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.audiochunk.stepBackward().catch((error) => {
      console.error(error);
    });
  };

  onStepBackwardTime = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent.shortcut,
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.audiochunk.stepBackwardTime(0.5).catch((error) => {
      console.error(error);
    });
  };

  onJumpRight = async (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    if (
      this.hasSegmentBoundaries ||
      (!this.isNextSegmentLastAndBreak(this.segmentIndex) &&
        this.segmentIndex <
          this.annotationStoreService.currentLevel!.items.length - 1)
    ) {
      await this.doDirectionAction('right');
    } else {
      this.save();
      this.close();
      this.act.emit('overview');
    }
  };

  onJumpLeft = async (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    await this.doDirectionAction('left');
  };

  onClose = async (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    await this.doDirectionAction('down');
  };

  private audioShortcuts: ShortcutGroup = {
    name: '',
    enabled: true,
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'TAB',
          pc: 'TAB',
        },
        title: 'play pause',
        focusonly: false,
        callback: this.onAudioPlayPause,
      },
      {
        name: 'stop',
        keys: {
          mac: 'ESC',
          pc: 'ESC',
        },
        title: 'stop playback',
        focusonly: false,
        callback: this.onStopAudio,
      },
      {
        name: 'step_backward',
        keys: {
          mac: 'SHIFT + BACKSPACE',
          pc: 'SHIFT + BACKSPACE',
        },
        title: 'step backward',
        focusonly: false,
        callback: this.onStepBackward,
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + TAB',
          pc: 'SHIFT + TAB',
        },
        title: 'step backward time',
        focusonly: false,
        callback: this.onStepBackwardTime,
      },
    ],
  };

  public transcript = '';

  constructor(
    private shortcutsService: ShortcutService,
    public annotationStoreService: AnnotationStoreService,
    public audio: AudioService,
    public uiService: UserInteractionsService,
    public asrStoreService: AsrStoreService,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
    public appStoreService: ApplicationStoreService,
    public cd: ChangeDetectorRef,
    private langService: TranslocoService,
    private alertService: AlertService,
    private navbarService: NavbarService
  ) {
    super();

    this.subscribe(this.asrStoreService.queue$, {
      next: (queue) => {
        const item = this.audiochunk
          ? queue?.items.find(
              (a) =>
                a.time.sampleStart === this.audiochunk.time.start.samples &&
                a.time.sampleLength === this.audiochunk.time.duration.samples
            )
          : undefined;

        if (item) {
          if (
            item.status === ASRProcessStatus.FINISHED &&
            item.result !== undefined
          ) {
            this.transcript = item.result;
          } else {
            console.log(`Can't set transcript, ${item.status}, ${item.result}`);
          }

          this.magnifier.redraw();

          this.cd.markForCheck();
          this.cd.detectChanges();
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  public doDirectionAction = async (direction: string) => {
    if (!this._loading) {
      this._loading = true;
      this.cd.markForCheck();
      this.cd.detectChanges();

      const doFunc = async () => {
        try {
          this._validationEnabled = false;
          this.editor.updateRawText();
          this.save();
          this.setValidationEnabledToDefault();
        } catch (e) {
          console.error(e);
        }

        if (this.audioManager.isPlaying) {
          try {
            await this.audiochunk.stopPlayback();
          } catch (e) {
            console.error(e);
          }
        }

        if (direction !== 'down') {
          try {
            await this.goToSegment(direction);
            const currentLevel = this.annotationStoreService.currentLevel;
            const segment = currentLevel!.items[
              this.segmentIndex
            ] as OctraAnnotationSegment;

            if (!segment?.context?.asr?.isBlockedBy) {
              await this.audiochunk.startPlayback();
            }
          } catch (e) {
            // ignore
            console.error(e);
          } finally {
            this._loading = false;
            this.cd.markForCheck();
            this.cd.detectChanges();
          }
        } else {
          this.close();
        }
      };

      this.subscribe(timer(0), {
        next: doFunc,
      });
    }
  };

  ngOnInit() {
    if (this.currentLevel) {
      this.tempSegments = [
        ...(this.currentLevel.clone().items as OctraAnnotationSegment[]),
      ];
      this.idCounter =
        this.annotationStoreService.transcript?.idCounters.item ?? 1;
    }

    this.subscribe(this.annotationStoreService.guidelines$, {
      next: (guidelines) => {
        this.guidelines = guidelines!.selected!.json;
        this.breakMarkerCode = guidelines?.selected?.json.markers.find(
          (a) => a.type === 'break'
        )?.code;
      },
    });

    this.updateOverviewButtonVisibility();
    this._loading = false;
    this.setValidationEnabledToDefault();

    this.editor.settings.markers =
      this.annotationStoreService.guidelines?.markers ?? [];
    this.editor.settings.responsive = true;
    this.editor.settings.specialMarkers.boundary = true;
    this.magnifier.name = 'transcr-window viewer';
    this.magnifier.settings.margin.top = 5;
    this.magnifier.settings.margin.bottom = 0;
    this.magnifier.settings.lineheight = 200;
    this.magnifier.settings.justifySignalHeight = true;
    this.magnifier.settings.boundaries.enabled = false;
    this.magnifier.settings.boundaries.readonly = true;
    this.magnifier.settings.selection.enabled = true;
    this.magnifier.settings.frame.color = '#222222';
    this.magnifier.settings.roundValues = false;
    this.magnifier.settings.showTimePerLine = true;
    this.magnifier.settings.showProgressBars = true;
    this.magnifier.settings.multiLine = false;
    this.magnifier.av.drawnSelection = undefined;

    this.subscriptionManager.removeByTag('editor');
    if (
      this.segmentIndex > -1 &&
      this.annotationStoreService.currentLevel!.items &&
      this.segmentIndex < this.annotationStoreService.currentLevel!.items.length
    ) {
      this.transcript =
        (
          this.annotationStoreService.currentLevel!.items[
            this.segmentIndex
          ] as OctraAnnotationSegment
        ).getFirstLabelWithoutName('Speaker')?.value ?? '';
    }

    /*
    const shortcutGroup =
      this.shortcutsService.getShortcutGroup('2D-Editor viewer');
    shortcutGroup!.enabled = false;
     */

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  setValidationEnabledToDefault() {
    this._validationEnabled =
      this.appStorage.useMode !== 'url' &&
      (this.appStorage.useMode === 'demo' ||
        this.settingsService?.projectsettings?.octra?.validationEnabled ===
          true);
  }

  ngOnChanges(obj: SimpleChanges) {
    if (getProperties(obj).findIndex(([key]) => key === 'audiochunk') > -1) {
      const previous: AudioChunk = obj['audiochunk'].previousValue;
      const current: AudioChunk = obj['audiochunk'].currentValue;

      if (
        (previous === undefined && current !== undefined) ||
        (current.time.start.samples !== previous.time.start.samples &&
          current.time.end.samples !== previous.time.end.samples)
      ) {
        // audiochunk changed
        this.listenToAudioChunkStatusChanges();

        this.setValidationEnabledToDefault();
      }
    }
  }

  ngAfterViewInit() {
    this.shortcutsService.disableGroup('2D-Editor audio');
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'play_pause',
      this.onAudioPlayPause
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'stop',
      this.onStopAudio
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'step_backward',
      this.onStepBackward
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'step_backwardtime',
      this.onStepBackwardTime
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'jump_left',
      this.onJumpLeft
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'jump_right',
      this.onJumpRight
    );
    this.shortcutsService.overwriteCallback(
      'transcription window',
      'close_save',
      this.onClose
    );
    this.shortcutsService.enableGroup('transcription window');

    this.magnifier.av.zoomY = 6;
    this.audiochunk.startpos = this.audiochunk.time.start.clone();
    this.magnifier.av.drawnSelection = new AudioSelection(
      this.audioManager.createSampleUnit(0),
      this.audioManager.createSampleUnit(0)
    );

    this.subscribe(timer(500), () => {
      const segment = this.annotationStoreService.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;

      if (!segment!.context?.asr?.isBlockedBy) {
        this.audiochunk.startPlayback().catch((error) => {
          console.error(error);
        });
      }
    });
    this.editor.focus(true, true);
  }

  ngAfterContentInit() {
    this.act.emit('open');
  }

  close() {
    this.showWindow = false;

    this.shortcutsService.enableGroup('2D-Editor audio');
    this.shortcutsService.disableGroup('transcription window');

    const startSample =
      this.segmentIndex > 0
        ? (
            this.currentLevel?.items[
              this.segmentIndex - 1
            ] as OctraAnnotationSegment
          ).time.samples
        : 0;

    this.uiService.addElementFromEvent(
      'segment',
      {
        value: 'exited',
      },
      Date.now(),
      this.magnifier.av.PlayCursor!.timePos,
      undefined,
      undefined,
      {
        start: startSample,
        length:
          (
            this.currentLevel?.items[
              this.segmentIndex
            ] as OctraAnnotationSegment
          ).time.samples - startSample,
      },
      'transcription window'
    );

    this.audiochunk.stopPlayback();
    this.act.emit('close');
    this.subscriptionManager.destroy();
  }

  public open() {
    this.showWindow = true;
  }

  openOverview() {
    this.act.emit('overview');
  }

  save() {
    this.saveTranscript();

    if (
      this.segmentIndex > -1 &&
      this.currentLevel?.items &&
      this.segmentIndex < this.currentLevel.items.length
    ) {
      if (
        this.editor.html.indexOf(
          '<img src="assets/img/components/transcr-editor/boundary.png"'
        ) < 0
      ) {
        // no boundaries inserted
        const segment =
          this.annotationStoreService.currentLevel?.items[
            this.segmentIndex
          ].clone();
        this.editor.updateRawText();

        if (this.currentLevel) {
          if (this.currentLevel.type === 'SEGMENT') {
            const seg = segment as OctraAnnotationSegment<ASRContext>;
            seg.changeFirstLabelWithoutName('Speaker', this.editor.rawText);
            this.annotationStoreService.changeCurrentLevelItems([seg]);
          }
        }
      } else {
        this.annotationStoreService.changeCurrentLevelItems(this.tempSegments);
      }
    }
  }

  onButtonClick(event: { type: string; timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: 0,
      };

      if (this.segmentIndex > -1) {
        const annoSegment = this.currentLevel!.items[
          this.segmentIndex
        ] as OctraAnnotationSegment;
        segment.start = 0;

        if (this.segmentIndex > 0) {
          segment.start = (
            this.currentLevel!.items[
              this.segmentIndex - 1
            ] as OctraAnnotationSegment
          ).time.samples;
        }

        segment.length = annoSegment!.time.samples - segment.start;

        segment.start = Math.round(segment.start);
        segment.length = Math.round(segment.length);
      }

      let selection = undefined;
      if (
        this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
        this.magnifier.av.drawnSelection!.end.samples <=
          segment.start + segment.length
      ) {
        selection = {
          start: this.magnifier.av.drawnSelection!.start.samples,
          length: this.magnifier.av.drawnSelection!.duration.samples,
        };
      }

      this.uiService.addElementFromEvent(
        'mouseclick',
        { value: event.type },
        event.timestamp,
        this.audioManager.playPosition,
        this.editor.textSelection,
        selection,
        segment,
        'audio_buttons'
      );
    }
  }

  /**
   * selects the next segment on the left or on the right side
   */
  goToSegment(direction: string) {
    return new Promise<void>((resolve) => {
      this.editor.isTyping = false;

      if (
        this.segmentIndex > -1 &&
        this.currentLevel?.items &&
        this.segmentIndex < this.currentLevel.items.length
      ) {
        const segmentsLength = this.currentLevel.items.length;

        let segment: OctraAnnotationSegment | undefined = undefined;

        let startIndex = 0;
        let limitFunc: (i: number) => boolean = (i) => true;
        let counterFunc: (i: number) => number = (i) => i;
        let appliedDirection = '';

        if (direction === 'right' && this.segmentIndex < segmentsLength - 1) {
          startIndex = this.segmentIndex + 1;
          limitFunc = (j) => j < segmentsLength;
          counterFunc = (j) => j + 1;
          appliedDirection = 'right';
        } else if (direction === 'left' && this.segmentIndex > 0) {
          startIndex = this.segmentIndex - 1;
          limitFunc = (j) => j >= 0;
          counterFunc = (j) => j - 1;
          appliedDirection = 'left';
        }

        if (appliedDirection !== '') {
          for (let i = startIndex; limitFunc(i); i = counterFunc(i)) {
            const tempSegment = this.currentLevel.items[
              i
            ] as OctraAnnotationSegment;
            const breakMarker = this.guidelines.markers.find(
              (a) => a.type === 'break'
            );
            if (
              (!breakMarker ||
                tempSegment!.getFirstLabelWithoutName('Speaker')?.value !==
                  breakMarker.code) &&
              tempSegment!.context?.asr?.isBlockedBy !==
                ASRQueueItemType.ASRMAUS &&
              tempSegment!.context?.asr?.isBlockedBy !== ASRQueueItemType.MAUS
            ) {
              segment = tempSegment;
              this.segmentIndex = i;
              this.updateOverviewButtonVisibility();
              break;
            }
          }

          const start =
            this.segmentIndex > 0
              ? (
                  this.currentLevel.items[
                    this.segmentIndex - 1
                  ] as OctraAnnotationSegment
                ).time.samples
              : 0;
          const valueString =
            appliedDirection === 'right' ? 'entered next' : 'entered previous';
          this.uiService.addElementFromEvent(
            'segment',
            { value: valueString },
            Date.now(),
            this.audioManager.playPosition,
            this.editor.textSelection,
            undefined,
            {
              start,
              length:
                (
                  this.currentLevel.items[
                    this.segmentIndex
                  ] as OctraAnnotationSegment
                ).time.samples - start,
            },
            'transcription window'
          );
        }

        let begin;
        if (this.segmentIndex > 0) {
          begin = (this.currentLevel.items[
            this.segmentIndex - 1
          ] as OctraAnnotationSegment)!.time.clone();
        } else {
          begin = new SampleUnit(0, this.audioManager.sampleRate);
        }

        if (segment !== undefined) {
          this.transcript =
            (
              this.currentLevel.items[
                this.segmentIndex
              ] as OctraAnnotationSegment
            ).getFirstLabelWithoutName('Speaker')?.value ?? '';
          // noinspection JSObjectNullOrUndefined
          this.audiochunk = this.audioManager.createNewAudioChunk(
            new AudioSelection(begin, segment.time.clone())
          )!;

          this.subscribe(timer(0), {
            next: () => {
              // resolve only after the audio viewer is ready
              this.subscriptionManager.removeByTag('oninitialized');
              this.subscribe(
                this.magnifier.onInitialized,
                {
                  next: () => {
                    this.subscriptionManager.removeByTag('oninitialized');
                    resolve();
                  },
                },
                'oninitialized'
              );
            },
          });

          this.cd.markForCheck();
          this.cd.detectChanges();
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  triggerUIAction($event: AudioViewerShortcutEvent) {
    let segment: any;

    if (this.segmentIndex > -1) {
      const annoSegment = this.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;

      if (this.segmentIndex > 0) {
        segment = {
          start: (
            this.currentLevel!.items[
              this.segmentIndex - 1
            ] as OctraAnnotationSegment
          ).time.samples,
        };
      } else {
        segment = {
          start: 0,
        };
      }

      segment = {
        start: Math.round(segment.start),
        length: Math.round(
          annoSegment!.time.samples - Math.round(segment.start)
        ),
      };
    }

    let selection = undefined;
    if (
      segment &&
      this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
      this.magnifier.av.drawnSelection!.end.samples <=
        segment.start + segment.length
    ) {
      selection =
        this.magnifier.av.drawnSelection!.duration.samples > 0
          ? {
              start: this.magnifier.av.drawnSelection!.start.samples,
              length: this.magnifier.av.drawnSelection!.duration.samples,
            }
          : {
              start: this.magnifier.audioChunk!.selection!.start.samples,
              length: this.magnifier.audioChunk!.selection!.end.samples,
            };
    }

    this.uiService.addElementFromEvent(
      'shortcut',
      $event,
      $event.timestamp,
      this.audioManager.playPosition,
      this.editor.textSelection,
      selection,
      segment,
      'magnifier'
    );
  }

  onMarkerInsert(markerCode: string) {
    const segment = {
      start: -1,
      length: -1,
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = (
          this.currentLevel!.items[
            this.segmentIndex - 1
          ] as OctraAnnotationSegment
        ).time.samples;
      }

      segment.length = annoSegment!.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = undefined;
    if (
      this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
      this.magnifier.av.drawnSelection!.end.samples <=
        segment.start + segment.length
    ) {
      selection = {
        start: this.magnifier.av.drawnSelection!.start.samples,
        length: this.magnifier.av.drawnSelection!.duration.samples,
      };
    }

    this.uiService.addElementFromEvent(
      'shortcut',
      { value: markerCode },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.textSelection,
      selection,
      segment,
      'markers'
    );
  }

  onMarkerClick(markerCode: string) {
    const segment = {
      start: -1,
      length: -1,
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = (
          this.currentLevel!.items[
            this.segmentIndex - 1
          ] as OctraAnnotationSegment
        ).time.samples;
      }

      segment.length = annoSegment!.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = undefined;
    if (
      this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
      this.magnifier.av.drawnSelection!.end.samples <=
        segment.start + segment.length
    ) {
      selection = {
        start: this.magnifier.av.drawnSelection!.start.samples,
        length: this.magnifier.av.drawnSelection!.duration.samples,
      };
    }

    this.uiService.addElementFromEvent(
      'mouseclick',
      { value: markerCode },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.textSelection,
      selection,
      segment,
      'texteditor_toolbar'
    );
  }

  onSpeedChange(event: {
    old_value: number;
    new_value: number;
    timestamp: number;
  }) {
    this.appStorage.audioSpeed = event.new_value;
  }

  listenToAudioChunkStatusChanges() {
    this.subscriptionManager.removeByTag('audiochunkStatus');
    this.subscribe(
      this.audiochunk.statuschange,
      {
        next: (status) => {
          this.cd.markForCheck();
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error(
            `couldn't update view for audio chunk in transcription window.`
          );
          console.error(error);
        },
      },
      'audiochunkStatus'
    );
  }

  afterSpeedChange(event: { new_value: number; timestamp: number }) {
    const segment = {
      start: -1,
      length: -1,
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;
      segment.start = 0;

      if (this.segmentIndex > 0) {
        segment.start = (
          this.currentLevel!.items[
            this.segmentIndex - 1
          ] as OctraAnnotationSegment
        ).time.samples;
      }

      segment.length = annoSegment!.time.samples - segment.start;
      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = undefined;
    if (
      this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
      this.magnifier.av.drawnSelection!.end.samples <=
        segment.start + segment.length
    ) {
      selection = {
        start: this.magnifier.av.drawnSelection!.start.samples,
        length: this.magnifier.av.drawnSelection!.duration.samples,
      };
    }

    this.uiService.addElementFromEvent(
      'slider',
      event,
      event.timestamp,
      this.audioManager.playPosition,
      this.editor.textSelection,
      selection,
      segment,
      'audio_speed'
    );
  }

  onVolumeChange(event: {
    old_value: number;
    new_value: number;
    timestamp: number;
  }) {
    this.audiochunk.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number; timestamp: number }) {
    const segment = {
      start: -1,
      length: -1,
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.currentLevel!.items[
        this.segmentIndex
      ] as OctraAnnotationSegment;
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = (
          this.currentLevel!.items[
            this.segmentIndex - 1
          ] as OctraAnnotationSegment
        ).time.samples;
      }

      segment.length = annoSegment!.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = undefined;
    if (
      this.magnifier.av.drawnSelection!.start.samples >= segment.start &&
      this.magnifier.av.drawnSelection!.end.samples <=
        segment.start + segment.length
    ) {
      selection = {
        start: this.magnifier.av.drawnSelection!.start.samples,
        length: this.magnifier.av.drawnSelection!.duration.samples,
      };
    }

    this.uiService.addElementFromEvent(
      'slider_changed',
      event,
      event.timestamp,
      this.audioManager.playPosition,
      this.editor.textSelection,
      selection,
      segment,
      'audio_volume'
    );
  }

  onBoundaryClicked(sample: SampleUnit) {
    const i: number = getSegmentBySamplePosition(
      this.currentLevel!.items as OctraAnnotationSegment[],
      sample
    );

    if (i > -1) {
      this.audiochunk.startpos =
        i > 0
          ? this.tempSegments[i - 1].time.clone()
          : this.audioManager.createSampleUnit(0);
      this.audiochunk.selection.end = this.tempSegments[i]!.time.clone();
      this.magnifier.av.drawnSelection = this.audiochunk.selection;

      this.audiochunk.startPlayback().catch((error) => {
        console.error(error);
      });
    }
  }

  onBoundaryInserted() {
    this.uiService.addElementFromEvent(
      'segment',
      { value: 'boundaries:add' },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.textSelection,
      undefined,
      undefined,
      'texteditor'
    );
  }

  afterTyping(status: string) {
    if (status === 'started') {
      this.oldRaw = this.editor.rawText;
    }

    if (status === 'stopped') {
      if (
        this.editor.html.indexOf(
          '<img src="assets/img/components/transcr-editor/boundary.png"'
        ) > -1
      ) {
        this.showOverviewButton = false;
      } else {
        this.updateOverviewButtonVisibility();
      }
    }
  }

  saveTranscript() {
    const segStart = getSegmentBySamplePosition(
      this.currentLevel?.items as OctraAnnotationSegment[],
      this.audiochunk.time.start.add(
        new SampleUnit(20, this.audioManager.sampleRate)
      )
    );

    this.tempSegments = [
      ...(this.currentLevel?.items as OctraAnnotationSegment[]),
    ];
    const html = this.editor.getRawText();
    // split text at the position of every boundary marker
    const segTexts: string[] = html.split(/\s?{[0-9]+}\s?/g);

    const samplesArray: number[] = [];
    html.replace(/\s?{([0-9]+)}\s?/g, (match, g1, g2) => {
      samplesArray.push(Number(g1));
      return '';
    });

    // remove invalid boundaries
    if (segTexts.length > 1) {
      let start = 0;
      for (let i = 0; i < samplesArray.length; i++) {
        if (!(samplesArray[i] > start)) {
          // remove boundary
          samplesArray.splice(i, 1);

          // concat
          segTexts[i + 1] = segTexts[i] + segTexts[i + 1];
          segTexts.splice(i, 1);

          --i;
        } else {
          start = samplesArray[i];
        }
      }
    }

    for (let i = 0; i < segTexts.length - 1; i++) {
      const result = addSegment(
        this.idCounter,
        this.tempSegments,
        this.audioManager.createSampleUnit(samplesArray[i]),
        'OCTRA_1',
        segTexts[i]
      );
      this.tempSegments = result.entries;
      this.idCounter = result.itemIDCounter;
    }

    // shift rest of text to next segment
    if (this.tempSegments[segStart + segTexts.length - 1]) {
      this.tempSegments[segStart + segTexts.length - 1] = (this.tempSegments[
        segStart + segTexts.length - 1
      ] as OctraAnnotationSegment)!.clone();
      this.tempSegments[
        segStart + segTexts.length - 1
      ].changeFirstLabelWithoutName('Speaker', segTexts[segTexts.length - 1]);
    }
  }

  public highlight() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');

    const samplesArray: number[] = [];
    html.replace(
      new RegExp(
        /\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s?/,
        'g'
      ),
      (match, g1, g2) => {
        samplesArray.push(Number(g1));
        return '';
      }
    );

    let start = 0;
    for (let i = 0; i < samplesArray.length; i++) {
      const boundary = this.editor.wysiwyg?.querySelector(
        'img[data-samples]:eq(' + i + ')'
      ) as HTMLDivElement;
      if (!(samplesArray[i] > start)) {
        // mark boundary red
        if (boundary) {
          boundary.style.backgroundColor = 'red';
        }
      } else {
        if (boundary) {
          boundary.style.backgroundColor = 'transparent';
        }
        start = samplesArray[i];
      }
    }
  }

  /**
   * checks if next segment is the last one and contains only a break.
   */
  public isNextSegmentLastAndBreak(segmentIndex: number) {
    const nextSegment = this.currentLevel!.items[
      segmentIndex + 1
    ] as OctraAnnotationSegment;
    return (
      segmentIndex === this.currentLevel!.items.length - 2 &&
      (nextSegment!.getFirstLabelWithoutName('Speaker')?.value ===
        this.breakMarkerCode ||
        nextSegment!.context?.asr?.isBlockedBy === ASRQueueItemType.ASRMAUS ||
        nextSegment!.context?.asr?.isBlockedBy === ASRQueueItemType.MAUS)
    );
  }

  public onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  onSelectionChange(
    selectionEvent:
      | {
          start?: number;
          end?: number;
        }
      | undefined
  ) {}

  onFontChange(fontName: string) {
    this.appStoreService.changeApplicationOption('editorFont', fontName);
  }

  startASRForThisSegment() {
    if (
      this.asrStoreService.asrOptions?.selectedASRLanguage &&
      this.asrStoreService.asrOptions?.selectedServiceProvider
    ) {
      if (this.audiochunk!.time.duration.seconds > 600) {
        // trigger alert, too big audio duration
        this.alertService
          .showAlert(
            'danger',
            this.langService.translate('asr.file too big').toString()
          )
          .catch((error) => {
            console.error(error);
          });
      } else {
        if (
          this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
        ) {
          const time = this.audiochunk!.time.start.add(
            this.audiochunk!.time.duration
          );
          const segNumber =
            this.annotationStoreService.transcript!.getCurrentSegmentIndexBySamplePosition(
              time
            );

          if (segNumber > -1) {
            const segment = this.annotationStoreService.currentLevel!.items[
              segNumber
            ] as OctraAnnotationSegment;

            if (segment !== undefined) {
              this.asrStoreService.addToQueue(
                {
                  sampleStart: this.audiochunk!.time.start.samples,
                  sampleLength: this.audiochunk!.time.duration.samples,
                },
                ASRQueueItemType.ASR
              );
              this.asrStoreService.startProcessing();
            } else {
              console.error(`could not find segment for doing ASR.`);
            }
          } else {
            console.error(
              `could not start ASR because segment number was not found.`
            );
          }
        }
      }
    }
  }

  startASRForAllSegmentsNext() {
    const segNumber =
      this.annotationStoreService.transcript!.getCurrentSegmentIndexBySamplePosition(
        this.audiochunk!.time.start.add(this.audiochunk!.time.duration)
      );

    if (
      segNumber > -1 &&
      this.annotationStoreService.transcript?.currentLevel &&
      this.annotationStoreService.transcript?.currentLevel instanceof
        OctraAnnotationSegmentLevel
    ) {
      for (
        let i = segNumber;
        i < this.annotationStoreService.transcript.currentLevel.items.length;
        i++
      ) {
        const segment =
          this.annotationStoreService.transcript.currentLevel.items[i];

        if (segment !== undefined) {
          const sampleStart =
            i > 0
              ? this.annotationStoreService.transcript.currentLevel.items[
                  i - 1
                ]!.time.samples
              : 0;
          const sampleLength = segment.time.samples - sampleStart;

          if (
            sampleLength /
              this.audiochunk?.audioManager!.resource!.info!.sampleRate! >
            600
          ) {
            this.alertService
              .showAlert(
                'danger',
                this.langService.translate('asr.file too big')
              )
              .catch((error) => {
                console.error(error);
              });
            this.asrStoreService.stopItemProcessing({
              sampleStart,
              sampleLength,
            });
          } else {
            if (
              segment.getFirstLabelWithoutName('Speaker')?.value !==
                undefined &&
              segment.getFirstLabelWithoutName('Speaker')!.value.trim() ===
                '' &&
              this.annotationStoreService.breakMarker?.code !== undefined &&
              segment
                .getFirstLabelWithoutName('Speaker')!
                .value.indexOf(this.annotationStoreService.breakMarker.code) < 0
            ) {
              // segment is empty and contains not a break
              this.asrStoreService.addToQueue(
                {
                  sampleStart,
                  sampleLength,
                },
                ASRQueueItemType.ASR
              );
            }
          }
        } else {
          console.error(
            `could not find segment in startASRForAllSegmentsNext()`
          );
        }
      }
      this.asrStoreService.startProcessing();
    } else {
      console.error(
        `could not start ASR for all next because segment number was not found.`
      );
    }
  }

  stopASRForAll() {
    this.asrStoreService.stopProcessing();
  }

  stopASRForThisSegment() {
    this.asrStoreService.stopItemProcessing({
      sampleStart: this.audiochunk!.time.start.samples,
      sampleLength: this.audiochunk!.time.duration.samples,
    });
  }

  openSettings() {
    this.navbarService.openSettings.emit();
  }

  private updateOverviewButtonVisibility() {
    this.showOverviewButton =
      this.segmentIndex ===
        this.annotationStoreService.currentLevel!.items.length - 1 ||
      this.isNextSegmentLastAndBreak(this.segmentIndex);
  }
}
