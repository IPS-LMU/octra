import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { contains, hasProperty } from '@octra/utilities';
import { TranscrEditorComponent } from '../../core/component';

import {
  AlertService,
  AlertType,
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { OCTRAEditor, OctraEditorRequirements } from '../octra-editor';
import { TranscrWindowComponent } from './transcr-window';
import {
  AudioViewerComponent,
  AudioviewerConfig,
  AudioViewerShortcutEvent,
  CurrentLevelChangeEvent,
} from '@octra/ngx-components';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import {
  ASRContext,
  ASRQueueItemType,
  getSegmentBySamplePosition,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { interval, Subscription, timer } from 'rxjs';
import { AudioNavigationComponent } from '../../core/component/audio-navigation';
import { ASRProcessStatus, ASRTimeInterval } from '../../core/store/asr';
import { AsrStoreService } from '../../core/store/asr/asr-store-service.service';
import {
  AudioChunk,
  AudioManager,
  Shortcut,
  ShortcutGroup,
} from '@octra/web-media';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { ShortcutService } from '../../core/shared/service/shortcut.service';
import { HotkeysEvent } from 'hotkeys-js';

@Component({
  selector: 'octra-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.scss'],
})
export class TwoDEditorComponent
  extends OCTRAEditor
  implements OnInit, AfterViewInit, OctraEditorRequirements
{
  public static editorname = '2D-Editor';
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', { static: true }) viewer!: AudioViewerComponent;
  @ViewChild('window', { static: false }) window!: TranscrWindowComponent;
  @ViewChild('loupe', { static: false }) loupe!: AudioViewerComponent;
  @ViewChild('audionav', { static: true }) audionav!: AudioNavigationComponent;
  @Output() public openModal = new EventEmitter();

  public showWindow = false;
  public loupeHidden = true;
  public selectedIndex!: number;
  public miniloupe = {
    size: {
      width: 160,
      height: 160,
    },
    location: {
      x: 0,
      y: 0,
    },
  };

  public audioManager!: AudioManager;
  public audioChunkLines!: any;
  public audioChunkWindow!: AudioChunk;
  public audioChunkLoupe!: AudioChunk;
  public miniLoupeSettings!: AudioviewerConfig;
  private mousestate = 'initiliazied';
  private intervalID = undefined;
  private factor = 8;
  private scrolltimer?: Subscription;
  private shortcuts!: ShortcutGroup;
  private authWindow?: Window;

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
    if (this.audioChunkLines.isPlaying) {
      this.audioChunkLines.pausePlayback().catch((error: any) => {
        console.error(error);
      });
    } else {
      this.audioChunkLines.startPlayback(false).catch((error: any) => {
        console.error(error);
      });
    }
  };

  onAudioStop = (
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
    this.audioChunkLines.stopPlayback().catch((error: any) => {
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
    this.audioChunkLines.stepBackward().catch((error: any) => {
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
    this.audioChunkLines.stepBackwardTime(0.5).catch((error: any) => {
      console.error(error);
    });
  };

  onZoomInOut = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent
  ) => {
    if (this.shortcutsEnabled) {
      if (this.appStorage.showLoupe) {
        if (hotkeyEvent.key === '.' || hotkeyEvent.key === ',') {
          if (hotkeyEvent.key === '.') {
            this.factor = Math.min(20, this.factor + 1);
          } else if (hotkeyEvent.key === ',') {
            if (this.factor > 3) {
              this.factor = Math.max(1, this.factor - 1);
            }
          }

          this.changeArea(
            this.loupe,
            this.viewer,
            this.audioManager,
            this.audioChunkLoupe,
            this.viewer.av.mouseCursor!,
            this.factor
          ).then((newLoupeChunk) => {
            if (newLoupeChunk !== undefined) {
              this.audioChunkLoupe = newLoupeChunk;
              this.cd.detectChanges();
            }
          });
        }
      }
    }
  };

  private audioShortcuts: ShortcutGroup = {
    name: '2D-Editor',
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
        callback: this.onAudioStop,
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

  private windowShortcuts: ShortcutGroup = {
    name: 'transcription window',
    enabled: false,
    items: [
      ...this.audioShortcuts.items.map((a) => ({ ...a, callback: undefined })),
      {
        name: 'jump_left',
        keys: {
          mac: 'ALT + LEFT',
          pc: 'ALT + LEFT',
        },
        focusonly: false,
        title: 'jump_last_segment',
      },
      {
        name: 'jump_right',
        keys: {
          mac: 'ALT + RIGHT',
          pc: 'ALT + RIGHT',
        },
        focusonly: false,
        title: 'jump_next_segment',
      },
      {
        name: 'close_save',
        keys: {
          mac: 'ALT + DOWN',
          pc: 'ALT + DOWN',
        },
        focusonly: false,
        title: 'close_save',
      },
    ],
  };

  private miniLoupeShortcuts: ShortcutGroup = {
    name: 'mini loupe',
    enabled: true,
    items: [
      {
        name: 'zoom in',
        title: 'zoom in',
        keys: {
          mac: '.',
          pc: '.',
        },
        focusonly: false,
        callback: this.onZoomInOut,
      },
      {
        name: 'zoom out',
        title: 'zoom out',
        keys: {
          mac: ',',
          pc: ',',
        },
        focusonly: false,
        callback: this.onZoomInOut,
      },
    ],
  };

  public get editor(): TranscrEditorComponent | undefined {
    if (!this.window) {
      return undefined;
    }
    return this.window.editor;
  }

  public get getHeight(): number {
    return window.innerHeight - 350;
  }

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(
    public annotationStoreService: AnnotationStoreService,
    public audio: AudioService,
    public uiService: UserInteractionsService,
    public alertService: AlertService,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
    private cd: ChangeDetectorRef,
    private langService: TranslocoService,
    private asrStoreService: AsrStoreService,
    private shortcutService: ShortcutService
  ) {
    super();
    this.initialized = new EventEmitter<void>();
    this.miniLoupeSettings = new AudioviewerConfig();
  }

  ngOnInit() {
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audioManager.mainchunk.clone();
    this.audioChunkWindow = this.audioManager.mainchunk.clone();

    this.shortcutService.registerShortcutGroup({
      name: '2D-Editor viewer',
      enabled: true,
      items: this.viewer.settings.shortcuts.items,
    });
    this.shortcutService.registerShortcutGroup({
      name: '2D-Editor audio',
      enabled: true,
      items: this.audioShortcuts.items,
    });
    this.shortcutService.registerShortcutGroup(this.miniLoupeShortcuts);
    this.shortcutService.registerShortcutGroup(this.windowShortcuts);

    this.viewer.settings.multiLine = true;
    this.viewer.settings.lineheight = 70;
    this.viewer.settings.margin.top = 5;
    this.viewer.settings.margin.right = 0;
    this.viewer.settings.justifySignalHeight = true;
    this.viewer.settings.scrollbar.enabled = true;
    this.viewer.settings.roundValues = false;
    this.viewer.settings.stepWidthRatio =
      this.viewer.settings.pixelPerSec /
      this.audioManager.resource.info.sampleRate;
    this.viewer.settings.showTimePerLine = true;
    this.viewer.settings.showTranscripts = true;
    this.viewer.settings.showProgressBars = true;
    this.viewer.name = 'multiline viewer';

    this.viewer.secondsPerLine = this.appStorage.secondsPerLine;

    this.miniLoupeSettings.roundValues = false;
    this.miniLoupeSettings.shortcutsEnabled = false;
    this.miniLoupeSettings.selection.enabled = false;
    this.miniLoupeSettings.boundaries.readonly = true;
    this.miniLoupeSettings.asr.enabled = false;
    this.miniLoupeSettings.cropping = 'circle';
    this.miniLoupeSettings.cursor.fixed = true;

    this.audioChunkLoupe = this.audioManager.mainchunk.clone();

    this.subscrManager.add(
      this.asrStoreService.asrEnabled$.subscribe({
        next: (enabled) => {
          this.viewer.settings.asr.enabled = enabled === true;
          if (!this.viewer.settings.asr.enabled) {
            this.shortcutService.unregisterItemFromGroup(
              '2D-Editor viewer',
              'do_maus'
            );
            this.shortcutService.unregisterItemFromGroup(
              '2D-Editor viewer',
              'do_asr'
            );
            this.shortcutService.unregisterItemFromGroup(
              '2D-Editor viewer',
              'do_asr_maus'
            );
          }
        },
      })
    );
    this.subscrManager.add(
      this.viewer.alert.subscribe((result: any) => {
        this.alertService
          .showAlert(result.type as AlertType, result.message)
          .catch((error) => {
            console.error(error);
          });
      })
    );

    this.subscrManager.add(
      this.audioChunkLines.statuschange.subscribe((state: PlayBackStatus) => {
        if (state === PlayBackStatus.PLAYING) {
          if (this.appStorage.followPlayCursor) {
            if (this.scrolltimer !== undefined) {
              this.scrolltimer.unsubscribe();
            }

            this.scrolltimer = interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator!.samplestoAbsX(
                this.audioChunkLines.relativePlayposition!
              );

              const lines = Math.floor(absx / this.viewer.av.innerWidth!);
              const y =
                lines *
                (this.viewer.settings.lineheight +
                  this.viewer.settings.margin.bottom);

              this.viewer.scrollToAbsY(y);
            });
          }
        } else {
          if (this.scrolltimer !== undefined) {
            this.scrolltimer.unsubscribe();
          }
        }
      })
    );

    this.subscrManager.add(
      this.appStorage.settingschange.subscribe((event) => {
        switch (event.key) {
          case 'secondsPerLine':
            this.viewer.onSecondsPerLineChanged(event.value);
            break;
        }
      })
    );

    this.subscrManager.add(
      this.asrStoreService.queue$.subscribe({
        next: (queue) => {
          const checkUndoRedo = () => {
            if (queue) {
              if (queue.statistics.running === 0) {
                this.appStorage.enableUndoRedo();
              } else {
                this.appStorage.disableUndoRedo();
              }
            }
          };

          if (queue) {
            // this.viewer.redraw();
          }
        },
      })
    );

    this.subscrManager.add(
      this.asrStoreService.itemChange$.subscribe((item) => {
        if (item.status !== ASRProcessStatus.IDLE) {
          const segmentIndex =
            this.annotationStoreService.transcript?.getCurrentSegmentIndexBySamplePosition(
              this.audio.audioManager.createSampleUnit(
                item.time.sampleStart + item.time.sampleLength
              )
            ) ?? -1;

          if (segmentIndex > -1) {
            if (item.status === ASRProcessStatus.FINISHED) {
              this.uiService.addElementFromEvent(
                item.type.toLowerCase(),
                {
                  value: 'finished',
                },
                Date.now(),
                undefined,
                undefined,
                undefined,
                {
                  start: item.time.sampleStart,
                  length: item.time.sampleLength,
                },
                'automation'
              );
            } else if (item.status === ASRProcessStatus.STARTED) {
              // item started
              this.uiService.addElementFromEvent(
                item.type.toLowerCase(),
                {
                  value: 'started',
                },
                Date.now(),
                undefined,
                undefined,
                undefined,
                {
                  start: item.time.sampleStart,
                  length: item.time.sampleLength,
                },
                'automation'
              );
            }
          }
        }
      })
    );
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });

    clearInterval(this.intervalID);
    if (this.scrolltimer !== undefined) {
      this.scrolltimer.unsubscribe();
    }

    this.subscrManager.add(
      this.annotationStoreService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    this.shortcutService.destroy();
  }

  ngAfterViewInit() {
    if (this.appStorage.showLoupe) {
      this.loupe.av.zoomY = this.factor;
    }
    const subscr = this.viewer.onInitialized.subscribe(() => {
      subscr.unsubscribe();
      this.initialized.emit();
    });
  }

  onSegmentEntered(selected: any) {
    const currentLevel = this.annotationStoreService.currentLevel;

    if (
      currentLevel &&
      currentLevel.items &&
      selected.index > -1 &&
      selected.index < currentLevel.items.length
    ) {
      const segment = currentLevel.items[selected.index];

      if (segment !== undefined && segment instanceof OctraAnnotationSegment) {
        if (
          segment.context?.asr?.isBlockedBy !== ASRQueueItemType.ASRMAUS &&
          segment.context?.asr?.isBlockedBy !== ASRQueueItemType.MAUS
        ) {
          const start: SampleUnit =
            selected.index > 0
              ? (
                  currentLevel.items[
                    selected.index - 1
                  ] as OctraAnnotationSegment
                ).time.clone()
              : this.audioManager.createSampleUnit(0);
          this.selectedIndex = selected.index;
          this.audioChunkWindow = new AudioChunk(
            new AudioSelection(start, segment.time.clone()),
            this.audioManager
          );
          this.shortcutsEnabled = false;

          this.viewer.disableShortcuts();
          this.showWindow = true;

          this.uiService.addElementFromEvent(
            'segment',
            {
              value: 'entered',
            },
            Date.now(),
            this.audioManager.playPosition,
            undefined,
            undefined,
            {
              start: start.samples,
              length:
                (currentLevel.items[selected.index] as OctraAnnotationSegment)
                  .time.samples - start.samples,
            },
            TwoDEditorComponent.editorname
          );
          this.cd.markForCheck();
          this.cd.detectChanges();
        } else {
          // tslint:disable-next-line:max-line-length
          this.alertService
            .showAlert(
              'danger',
              "You can't open this segment while processing segmentation. If you need to open it, cancel segmentation first."
            )
            .catch((error) => {
              console.error(error);
            });
        }
      } else {
        console.error(`couldn't find segment with index ${selected.index}`);
      }
    }
  }

  onWindowAction(state: string) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.enableShortcuts();
      this.shortcutsEnabled = true;
      this.selectedIndex = this.window.segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);
    } else if (state === 'overview') {
      this.shortcutsEnabled = false;
      this.openModal.emit('overview');
    }
  }

  onMouseOver($event: {
    event: MouseEvent | undefined;
    time: SampleUnit | undefined;
  }) {
    this.subscrManager.removeByTag('mouseTimer');
    this.mousestate = 'moving';

    this.doPlayOnHover(
      this.audioManager,
      this.appStorage.playonhover,
      this.audioChunkLines,
      this.viewer.av.mouseCursor!
    );

    if (this.appStorage.showLoupe) {
      if (
        this.viewer.audioChunk!.time.duration.seconds !==
        this.viewer.av.mouseCursor!.seconds
      ) {
        this.loupeHidden = false;
        this.subscrManager.add(
          timer(20).subscribe(() => {
            this.changeLoupePosition($event.event!, $event.time!);
            this.mousestate = 'ended';
          }),
          'mouseTimer'
        );
      } else {
        this.loupeHidden = true;
      }
    }
  }

  public changeLoupePosition(mouseEvent: MouseEvent, cursorTime: SampleUnit) {
    const fullY = mouseEvent.offsetY + 20 + this.miniloupe.size.height;
    const x = mouseEvent.offsetX - (this.miniloupe.size.width - 10) / 2 - 2;

    if (fullY < this.viewer.height!) {
      // loupe is fully visible
      this.miniloupe.location.y = mouseEvent.offsetY + 20;
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y =
        mouseEvent.offsetY - 20 - this.miniloupe.size.height;
    }
    this.miniloupe.location.x = x;

    this.loupeHidden = false;
    this.changeArea(
      this.loupe,
      this.viewer,
      this.audioManager,
      this.audioChunkLoupe,
      cursorTime,
      this.factor
    ).then((newLoupeChunk) => {
      if (newLoupeChunk !== undefined) {
        this.audioChunkLoupe = newLoupeChunk;
      }
      this.cd.detectChanges();
    });
  }

  onShortCutViewerTriggered($event: AudioViewerShortcutEvent) {
    this.triggerUIAction($event);
    if ($event.shortcutName === 'undo' || $event.shortcutName === 'redo') {
      if (this.appStorage.undoRedoDisabled) {
        this.alertService.showAlert(
          'danger',
          this.langService.translate('alerts.undo deactivated')
        );
      }
      if ($event.shortcutName === 'undo') {
        this.appStorage.undo();
      } else if ($event.shortcutName === 'redo') {
        this.appStorage.redo();
      }
    }
  }

  private triggerUIAction($event: AudioViewerShortcutEvent) {
    if (
      ($event.value === 'do_asr' ||
        $event.value === 'cancel_asr' ||
        $event.value === 'do_asr_maus' ||
        $event.value === 'cancel_asr_maus' ||
        $event.value === 'do_maus' ||
        $event.value === 'cancel_maus') &&
      $event.type === 'segment'
    ) {
      const timePosition: SampleUnit =
        $event.timePosition !== undefined
          ? $event.timePosition!
          : this.viewer.av.mouseCursor!;

      const currentLevel = this.annotationStoreService.currentLevel;

      const segmentNumber = getSegmentBySamplePosition(
        currentLevel!.items as OctraAnnotationSegment[],
        timePosition
      );

      if (segmentNumber > -1) {
        if (this.appStorage.snapshot.asr.settings?.selectedLanguage) {
          const segment = currentLevel!.items[
            segmentNumber
          ].clone() as OctraAnnotationSegment;

          if (segment !== undefined) {
            const sampleStart =
              segmentNumber > 0
                ? (
                    currentLevel!.items[
                      segmentNumber - 1
                    ] as OctraAnnotationSegment
                  ).time.samples
                : 0;

            this.uiService.addElementFromEvent(
              'shortcut',
              $event,
              $event.timestamp,
              this.audioManager.playPosition,
              undefined,
              undefined,
              {
                start: sampleStart,
                length: segment.time.samples - sampleStart,
              },
              'multi-lines-viewer'
            );

            const selection: ASRTimeInterval = {
              sampleStart,
              sampleLength: segment.time.samples - sampleStart,
            };

            if (segment.context?.asr?.isBlockedBy === undefined) {
              if (
                $event.value === 'do_asr' ||
                $event.value === 'do_asr_maus' ||
                $event.value === 'do_maus'
              ) {
                this.viewer.selectSegment(segmentNumber);

                if ($event.value === 'do_asr') {
                  this.asrStoreService.addToQueue(
                    selection,
                    ASRQueueItemType.ASR
                  );
                } else if ($event.value === 'do_asr_maus') {
                  this.asrStoreService.addToQueue(
                    selection,
                    ASRQueueItemType.ASRMAUS
                  );
                } else if ($event.value === 'do_maus') {
                  if (
                    (segment.getFirstLabelWithoutName('Speaker') &&
                      segment
                        .getFirstLabelWithoutName('Speaker')!
                        .value.trim() === '') ||
                    segment
                      .getFirstLabelWithoutName('Speaker')!
                      .value.split(' ').length < 2
                  ) {
                    this.alertService
                      .showAlert(
                        'danger',
                        this.langService.translate('asr.maus empty text'),
                        false
                      )
                      .catch((error) => {
                        console.error(error);
                      });
                  } else {
                    this.asrStoreService.addToQueue(
                      selection,
                      ASRQueueItemType.MAUS,
                      segment.getFirstLabelWithoutName('Speaker')?.value
                    );
                  }
                }
              }
              this.asrStoreService.startProcessing();
            } else {
              this.asrStoreService.stopItemProcessing({
                sampleStart: selection.sampleStart,
                sampleLength: selection.sampleLength,
              });
            }
          }
        } else {
          // open transcr window
          this.openSegment(segmentNumber);
          this.alertService
            .showAlert(
              'warning',
              this.langService.translate('asr.no asr selected').toString()
            )
            .catch((error) => {
              console.error(error);
            });
        }
      }
    }

    if (
      $event.value === undefined ||
      !(
        // cursor move by keyboard events are note saved because this would be too much
        (
          contains($event.value, 'cursor') ||
          contains($event.value, 'segment_enter') ||
          contains($event.value, 'playonhover') ||
          contains($event.value, 'asr')
        )
      )
    ) {
      $event.value = `${$event.type}:${$event.value}`;

      let selection:
        | {
            start: number;
            length: number;
          }
        | undefined = {
        start: -1,
        length: -1,
      };

      if (hasProperty($event, 'selection') && $event.selection !== undefined) {
        selection.start = $event.selection.start.samples;
        selection.length = $event.selection.duration.samples;
      } else {
        selection = undefined;
      }

      const textSelection = this.editor?.textSelection;
      let playPosition = this.audioManager.playPosition;
      if (!this.audioChunkLines.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.av.MouseClickPos!;
        }
      }

      this.uiService.addElementFromEvent(
        'shortcut',
        $event,
        $event.timestamp,
        playPosition,
        textSelection,
        selection,
        undefined,
        'multi-lines-viewer'
      );
    } else if (
      $event.value !== undefined &&
      contains($event.value, 'playonhover')
    ) {
      this.appStorage.playonhover = !this.appStorage.playonhover;
    }
  }

  afterSpeedChange(event: { new_value: number; timestamp: number }) {
    this.appStorage.audioSpeed = event.new_value;

    if (this.appStorage.logging) {
      const textSelection = this.editor?.textSelection;
      this.uiService.addElementFromEvent(
        'slider',
        event,
        event.timestamp,
        this.audioManager.playPosition,
        textSelection,
        undefined,
        undefined,
        'audio_speed'
      );
    }
  }

  afterVolumeChange(event: { new_value: number; timestamp: number }) {
    this.appStorage.audioVolume = event.new_value;

    if (this.appStorage.logging) {
      const textSelection = this.editor?.textSelection;
      this.uiService.addElementFromEvent(
        'slider',
        event,
        event.timestamp,
        this.audioManager.playPosition,
        textSelection,
        undefined,
        undefined,
        'audio_volume'
      );
    }
  }

  onButtonClick(event: { type: string; timestamp: number }) {
    this.selectedIndex = -1;
    if (this.appStorage.logging) {
      const textSelection = this.editor?.textSelection;

      const audioSelection = {
        start: this.viewer.av.drawnSelection!.start.samples,
        length: this.viewer.av.drawnSelection!.duration.samples,
      };

      this.uiService.addElementFromEvent(
        'mouseclick',
        { value: 'click:' + event.type },
        event.timestamp,
        this.audioManager.playPosition,
        textSelection,
        audioSelection,
        undefined,
        'audio_buttons'
      );
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEntered({ index: segnumber });
  }

  public update() {
    this.audioChunkLines.startpos = this.audioChunkLines.time.start.clone();
  }

  onScrollbarMouse(event: any) {
    if (event.state === 'mousemove') {
      this.loupeHidden = true;
    }
  }

  onScrolling(event: any) {
    if (event.state === 'scrolling') {
      this.loupeHidden = true;
    }
  }

  onCircleLoupeMouseOver() {
    const fullY = this.miniloupe.location.y + 20 + this.miniloupe.size.height;
    if (fullY < this.viewer.height!) {
      // loupe is fully visible
      this.miniloupe.location.y = this.miniloupe.location.y + 20;
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y =
        this.miniloupe.location.y - 20 - this.miniloupe.size.height;
    }
  }

  afterFirstInitialization() {
    this.checkIfSmallAudioChunk(
      this.audioChunkLines,
      this.annotationStoreService.currentLevel!
    );
    this.cd.detectChanges();
  }

  openAuthWindow = () => {
    const url = document.location.href
      .replace('transcr/', '')
      .replace('transcr', '');
    const left = (window.innerHeight - 200) / 2;
    // tslint:disable-next-line:max-line-length
    const tempWindow = window.open(
      url + 'auth',
      '_blank',
      'toolbar=false,scrollbars=yes,resizable=true,top=100,left=' +
        left +
        ',width=760,height=550'
    );

    if (tempWindow !== undefined) {
      this.authWindow = tempWindow as any;
    }
  };

  resetQueueItemsWithNoAuth = () => {
    /*
    for (const asrQueueItem of this.asrService.queue.queue) {
      if (asrQueueItem.status === ASRProcessStatus.NOAUTH) {
        // reset
        asrQueueItem.changeStatus(ASRProcessStatus.IDLE);
      }
    }
    this.asrService.queue.start();

     */
  };

  public enableAllShortcuts() {
    this.shortcutsEnabled = true;
    this.viewer.enableShortcuts();
    if (this.window !== undefined && this.window.loupe !== undefined) {
      this.window.loupe.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.shortcutsEnabled = false;
    this.viewer.disableShortcuts();
    if (this.window !== undefined && this.window.loupe !== undefined) {
      this.window.loupe.disableShortcuts();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // this.viewer.height = this.linesViewHeight;
  }

  onEntriesChange(
    annotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>
  ) {
    // this.annotationStoreService.saveSegments();
    this.annotationStoreService.overwriteTranscript(annotation);
  }

  onCurrentLevelChange($event: CurrentLevelChangeEvent) {
    if ($event.type === 'change') {
      this.annotationStoreService.changeCurrentLevelItems(
        $event.items.map((a) => a.instance!)
      );
    }

    if ($event.type === 'remove') {
      this.annotationStoreService.removeCurrentLevelItems(
        $event.items,
        $event.removeOptions?.silenceCode,
        $event.removeOptions?.mergeTranscripts
      );
    }

    if ($event.type === 'add') {
      this.annotationStoreService.addCurrentLevelItems(
        $event.items.map((a) => a.instance!)
      );
    }
  }
}
