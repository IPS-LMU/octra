import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, inject, OnInit, Output, ViewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { contains, hasProperty } from '@octra/utilities';
import { TranscrEditorComponent } from '../../core/component';

import { NgStyle } from '@angular/common';
import {
  AnnotationLevelType,
  ASRContext,
  ASRQueueItemType,
  getSegmentBySamplePosition,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import {
  AudioViewerComponent,
  AudioviewerConfig,
  AudioViewerShortcutEvent,
  CurrentLevelChangeEvent,
  NgbModalWrapper,
  OctraComponentsModule,
} from '@octra/ngx-components';
import { AudioChunk, AudioManager, Shortcut, ShortcutGroup } from '@octra/web-media';
import { HotkeysEvent } from 'hotkeys-js';
import { interval, Subscription, timer } from 'rxjs';
import { AudioNavigationComponent } from '../../core/component/audio-navigation';
import { NavbarService } from '../../core/component/navbar/navbar.service';
import { OctraModalService } from '../../core/modals/octra-modal.service';
import { AlertService, AlertType, AudioService, SettingsService, UserInteractionsService } from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { ShortcutService } from '../../core/shared/service/shortcut.service';
import { ASRProcessStatus, ASRTimeInterval } from '../../core/store/asr';
import { AsrStoreService } from '../../core/store/asr/asr-store-service.service';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { OCTRAEditor, OctraEditorRequirements, SupportedOctraEditorMetaData } from '../octra-editor';
import { TranscrWindowComponent } from './transcr-window';

@Component({
  selector: 'octra-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.scss'],
  imports: [OctraComponentsModule, NgStyle, AudioNavigationComponent],
})
export class TwoDEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OctraEditorRequirements {
  annotationStoreService = inject(AnnotationStoreService);
  audio = inject(AudioService);
  uiService = inject(UserInteractionsService);
  alertService = inject(AlertService);
  settingsService = inject(SettingsService);
  appStorage = inject(AppStorageService);
  private cd = inject(ChangeDetectorRef);
  private langService = inject(TranslocoService);
  private asrStoreService = inject(AsrStoreService);
  private modalService = inject(OctraModalService);
  private shortcutService = inject(ShortcutService);
  private navbarService = inject(NavbarService);

  static meta: SupportedOctraEditorMetaData = {
    name: '2D-Editor',
    supportedLevelTypes: [AnnotationLevelType.SEGMENT],
    translate: 'interfaces.2D editor',
    icon: 'bi bi-justify',
    supportsASR: true,
  };

  public static editorname = '2D-Editor';
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', { static: true }) viewer!: AudioViewerComponent;
  window?: NgbModalWrapper<TranscrWindowComponent>;
  @ViewChild('magnifier', { static: false }) magnifier!: AudioViewerComponent;
  @ViewChild('audionav', { static: true }) audionav!: AudioNavigationComponent;
  @Output() public openModal = new EventEmitter();

  public magnifierHidden = true;
  public selectedIndex!: number;
  public minimagnifier = {
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
  public audioChunkMagnifier!: AudioChunk;
  public miniMagnifierSettings!: AudioviewerConfig;
  private mousestate = 'initiliazied';
  private intervalID = undefined;
  private factor = 8;
  private scrolltimer?: Subscription;
  private shortcuts!: ShortcutGroup;
  private authWindow?: Window;

  onAudioPlayPause = ($event: KeyboardEvent, shortcut: Shortcut, hotkeyEvent: HotkeysEvent) => {
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

  onAudioStop = ($event: KeyboardEvent, shortcut: Shortcut, hotkeyEvent: HotkeysEvent) => {
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

  onStepBackward = ($event: KeyboardEvent, shortcut: Shortcut, hotkeyEvent: HotkeysEvent) => {
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

  onStepBackwardTime = ($event: KeyboardEvent, shortcut: Shortcut, hotkeyEvent: HotkeysEvent) => {
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

  onZoomInOut = ($event: KeyboardEvent, shortcut: Shortcut, hotkeyEvent: HotkeysEvent) => {
    if (this.shortcutsEnabled) {
      if (this.appStorage.showMagnifier) {
        if (hotkeyEvent.key === '.' || hotkeyEvent.key === ',') {
          if (hotkeyEvent.key === '.') {
            this.factor = Math.min(20, this.factor + 1);
          } else if (hotkeyEvent.key === ',') {
            if (this.factor > 3) {
              this.factor = Math.max(1, this.factor - 1);
            }
          }

          this.changeArea(this.magnifier, this.viewer, this.audioManager, this.audioChunkMagnifier, this.viewer.av.mouseCursor!, this.factor).then(
            (newMagnifierChunk) => {
              if (newMagnifierChunk !== undefined) {
                this.audioChunkMagnifier = newMagnifierChunk;
                this.cd.detectChanges();
              }
            },
          );
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

  private miniMagnifierShortcuts: ShortcutGroup = {
    name: 'mini magnifier',
    enabled: true,
    items: [
      /** TODO fix shortcut on focus
       * {
       *         name: 'zoom in',
       *         title: 'zoom in',
       *         keys: {
       *           mac: '.',
       *           pc: '.',
       *         },
       *         focusonly: true,
       *         callback: this.onZoomInOut,
       *       },
       *       {
       *         name: 'zoom out',
       *         title: 'zoom out',
       *         keys: {
       *           mac: ',',
       *           pc: ',',
       *         },
       *         focusonly: true,
       *         callback: this.onZoomInOut,
       *       },
       */
    ],
  };

  public get editor(): TranscrEditorComponent | undefined {
    return this.window?.componentInstance?.editor;
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

  constructor() {
    super();
    this.initialized = new EventEmitter<void>();
    this.miniMagnifierSettings = new AudioviewerConfig();
    this.subscribe(this.modalService.onModalAction, {
      next: this.onModalAction,
    });
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
    this.shortcutService.registerShortcutGroup(this.miniMagnifierShortcuts);
    this.shortcutService.registerShortcutGroup(this.windowShortcuts);

    this.viewer.settings.multiLine = true;
    this.viewer.settings.lineheight = 70;
    this.viewer.settings.margin.top = 5;
    this.viewer.settings.margin.right = 0;
    this.viewer.settings.justifySignalHeight = true;
    this.viewer.settings.scrollbar.enabled = true;
    this.viewer.settings.roundValues = false;
    this.viewer.settings.stepWidthRatio = this.viewer.settings.pixelPerSec / this.audioManager.resource.info.sampleRate;
    this.viewer.settings.showTimePerLine = true;
    this.viewer.settings.showTranscripts = true;
    this.viewer.settings.showProgressBars = true;
    this.viewer.name = 'multiline viewer';

    this.viewer.secondsPerLine = this.appStorage.secondsPerLine ?? 5;

    this.miniMagnifierSettings.roundValues = false;
    this.miniMagnifierSettings.shortcutsEnabled = true;
    this.miniMagnifierSettings.selection.enabled = false;
    this.miniMagnifierSettings.boundaries.readonly = true;
    this.miniMagnifierSettings.asr.enabled = false;
    this.miniMagnifierSettings.cropping = 'circle';
    this.miniMagnifierSettings.cursor.fixed = true;

    this.audioChunkMagnifier = this.audioManager.mainchunk.clone();

    this.subscribe(this.asrStoreService.asrEnabled$, {
      next: (enabled) => {
        this.viewer.settings.asr.enabled = enabled === true;
        if (!this.viewer.settings.asr.enabled) {
          this.shortcutService.unregisterItemFromGroup('2D-Editor viewer', 'do_maus');
          this.shortcutService.unregisterItemFromGroup('2D-Editor viewer', 'do_asr');
          this.shortcutService.unregisterItemFromGroup('2D-Editor viewer', 'do_asr_maus');
        }
      },
    });
    this.subscribe(this.viewer.alert, (result: any) => {
      this.alertService.showAlert(result.type as AlertType, result.message).catch((error) => {
        console.error(error);
      });
    });

    this.subscribe(this.audioChunkLines.statuschange, (state: PlayBackStatus) => {
      if (state === PlayBackStatus.PLAYING) {
        if (this.appStorage.followPlayCursor) {
          if (this.scrolltimer !== undefined) {
            this.scrolltimer.unsubscribe();
          }

          this.scrolltimer = interval(1000).subscribe(() => {
            const absx = this.viewer.av.audioTCalculator!.samplestoAbsX(this.audioChunkLines.relativePlayposition!);

            const lines = Math.floor(absx / this.viewer.av.innerWidth!);
            const y = lines * (this.viewer.settings.lineheight + this.viewer.settings.margin.bottom);

            this.viewer.scrollToAbsY(y);
          });
        }
      } else {
        if (this.scrolltimer !== undefined) {
          this.scrolltimer.unsubscribe();
        }
      }
    });

    this.subscribe(this.appStorage.settingschange, (event) => {
      switch (event.key) {
        case 'secondsPerLine':
          this.viewer.onSecondsPerLineChanged(event.value);
          break;
      }
    });

    this.subscribe(this.asrStoreService.queue$, {
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
    });

    this.subscribe(this.asrStoreService.itemChange$, (item) => {
      if (item.status !== ASRProcessStatus.IDLE) {
        const segmentIndex =
          this.annotationStoreService.transcript?.getCurrentSegmentIndexBySamplePosition(
            this.audio.audioManager.createSampleUnit(item.time.sampleStart + item.time.sampleLength),
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
              'automation',
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
              'automation',
            );
          }
        }
      }
    });

    this.subscribe(this.annotationStoreService.segmentRequested, (segment) => {
      this.openSegment(segment);
    });

    this.subscribe(this.annotationStoreService.importOptions$, {
      next: (importOptions) => {
        if (importOptions && Object.keys(importOptions).includes('SRT') && importOptions.SRT) {
          this.viewer.settings.speakerPattern = importOptions['SRT']['speakerIdentifierPattern'];
        }
      },
    });
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

    this.shortcutService.destroy();
  }

  ngAfterViewInit() {
    if (this.appStorage.showMagnifier) {
      this.magnifier.av.zoomY = this.factor;
    }
    const subscr = this.viewer.onInitialized.subscribe(() => {
      subscr.unsubscribe();
      this.initialized.emit();
    });
  }

  async onSegmentEntered(selected: { levelID: number; itemID: number }) {
    const selectedLevel = this.annotationStoreService.transcript.levels.find((a) => a.id === selected.levelID);
    const itemIndex = selectedLevel.items.findIndex((a) => a.id === selected.itemID);

    if (selectedLevel && selectedLevel.items && itemIndex > -1) {
      const segment = selectedLevel.items[itemIndex];

      if (segment !== undefined && segment instanceof OctraAnnotationSegment) {
        if (segment.context?.asr?.isBlockedBy !== ASRQueueItemType.ASRMAUS && segment.context?.asr?.isBlockedBy !== ASRQueueItemType.MAUS) {
          const start: SampleUnit =
            itemIndex > 0 ? (selectedLevel.items[itemIndex - 1] as OctraAnnotationSegment).time.clone() : this.audioManager.createSampleUnit(0);
          this.selectedIndex = itemIndex;
          this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audioManager);
          this.shortcutsEnabled = false;

          this.viewer.disableShortcuts();

          this.window?.close();
          this.window = this.modalService.openModalRef(TranscrWindowComponent, TranscrWindowComponent.options, {
            audiochunk: this.audioChunkWindow,
            easyMode: this.appStorage.easyMode,
            segmentIndex: this.selectedIndex,
          });
          this.window.result.then(() => {
            this.window = undefined;
          });
          this.subscriptionManager.removeByTag('windowActions');
          this.subscribe(
            this.window.componentInstance.act,
            {
              next: this.onWindowAction,
            },
            'windowActions',
          );

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
              length: (selectedLevel.items[itemIndex] as OctraAnnotationSegment).time.samples - start.samples,
            },
            TwoDEditorComponent.editorname,
          );
          this.cd.markForCheck();
          this.cd.detectChanges();
        } else {
          // tslint:disable-next-line:max-line-length
          this.alertService
            .showAlert('danger', "You can't open this segment while processing segmentation. If you need to open it, cancel segmentation first.")
            .catch((error) => {
              console.error(error);
            });
        }
      } else {
        console.error(`couldn't find segment with index ${itemIndex}`);
      }
    }
  }

  onWindowAction = ({ action, segmentIndex }: { action: string; segmentIndex: number }) => {
    if (action === 'close') {
      this.viewer.enableShortcuts();
      this.shortcutsEnabled = true;
      this.selectedIndex = segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);
    } else if (action === 'overview') {
      this.shortcutsEnabled = false;
      this.openModal.emit('overview');
    } else if (action === 'save to parent') {
      this.annotationStoreService.sendAnnotationToParentWindow();
    }
  };

  onMouseOver($event: { event: MouseEvent | undefined; time: SampleUnit | undefined }) {
    this.subscriptionManager.removeByTag('mouseTimer');
    this.mousestate = 'moving';

    this.doPlayOnHover(this.audioManager, this.appStorage.playOnHover ?? false, this.audioChunkLines, this.viewer.av.mouseCursor!);

    if (this.appStorage.showMagnifier) {
      if (this.viewer.audioChunk!.time.duration.seconds !== this.viewer.av.mouseCursor!.seconds) {
        this.magnifierHidden = false;
        this.subscribe(
          timer(0),
          () => {
            this.changeMagnifierPosition($event.event!, $event.time!);
            this.mousestate = 'ended';
          },
          'mouseTimer',
        );
      } else {
        this.magnifierHidden = false;
      }
    } else {
      this.magnifierHidden = true;
    }
  }

  public changeMagnifierPosition(mouseEvent: MouseEvent, cursorTime: SampleUnit) {
    const offsetX = mouseEvent.clientX - (mouseEvent.target as HTMLElement).getBoundingClientRect().left;
    const offsetY = mouseEvent.clientY - (mouseEvent.target as HTMLElement).getBoundingClientRect().top;

    const fullY = offsetY + 30 + this.minimagnifier.size.height;
    const x = offsetX - (this.minimagnifier.size.width - 10) / 2 - 2;

    const newPosition = { ...this.minimagnifier.location };

    if (fullY < this.viewer.height!) {
      // magnifier is fully visible
      newPosition.y = offsetY + 30;
    } else {
      // magnifier out of the bottom border of view rectangle
      newPosition.y = offsetY - 20 - this.minimagnifier.size.height;
    }
    newPosition.x = x;

    this.magnifierHidden = false;
    this.changeArea(this.magnifier, this.viewer, this.audioManager, this.audioChunkMagnifier, cursorTime, this.factor).then((newMagnifierChunk) => {
      if (newMagnifierChunk !== undefined) {
        this.audioChunkMagnifier = newMagnifierChunk;
        this.minimagnifier.location = newPosition;
        this.viewer.av.focus();
        this.cd.detectChanges();
      }
    });
  }

  onShortCutViewerTriggered($event: AudioViewerShortcutEvent) {
    this.triggerUIAction($event);
    if ($event.shortcutName === 'undo' || $event.shortcutName === 'redo') {
      if (this.appStorage.undoRedoDisabled) {
        this.alertService.showAlert('danger', this.langService.translate('alerts.undo deactivated'));
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
      const timePosition: SampleUnit = $event.timePosition !== undefined ? $event.timePosition! : this.viewer.av.mouseCursor!;

      const currentLevel = this.annotationStoreService.currentLevel;

      const segmentNumber = getSegmentBySamplePosition(currentLevel!.items as OctraAnnotationSegment[], timePosition);

      if (segmentNumber > -1) {
        if (this.appStorage.snapshot.asr.settings?.selectedASRLanguage && this.appStorage.snapshot.asr.settings?.selectedServiceProvider) {
          const segment = currentLevel!.items[segmentNumber].clone() as OctraAnnotationSegment;

          if (segment !== undefined) {
            const sampleStart = segmentNumber > 0 ? (currentLevel!.items[segmentNumber - 1] as OctraAnnotationSegment).time.samples : 0;

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
              'multi-lines-viewer',
            );

            const selection: ASRTimeInterval = {
              sampleStart,
              sampleLength: segment.time.samples - sampleStart,
            };

            if (segment.context?.asr?.isBlockedBy === undefined) {
              if ($event.value === 'do_asr' || $event.value === 'do_asr_maus' || $event.value === 'do_maus') {
                this.viewer.selectSegment(segmentNumber);

                if ($event.value === 'do_asr') {
                  this.asrStoreService.addToQueue(selection, ASRQueueItemType.ASR);
                } else if ($event.value === 'do_asr_maus') {
                  this.asrStoreService.addToQueue(selection, ASRQueueItemType.ASRMAUS);
                } else if ($event.value === 'do_maus') {
                  if (
                    (segment.getFirstLabelWithoutName('Speaker') && segment.getFirstLabelWithoutName('Speaker')!.value.trim() === '') ||
                    segment.getFirstLabelWithoutName('Speaker')!.value.split(' ').length < 2
                  ) {
                    this.alertService.showAlert('danger', this.langService.translate('asr.maus empty text'), false).catch((error) => {
                      console.error(error);
                    });
                  } else {
                    this.asrStoreService.addToQueue(selection, ASRQueueItemType.MAUS, segment.getFirstLabelWithoutName('Speaker')?.value);
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
          this.navbarService.openSettings.emit();
          this.alertService.showAlert('warning', this.langService.translate('asr.no asr selected').toString()).catch((error) => {
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
        'multi-lines-viewer',
      );
    } else if ($event.value !== undefined && contains($event.value, 'playonhover')) {
      this.appStorage.playOnHover = !this.appStorage.playOnHover;
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
        'audio_speed',
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
        'audio_volume',
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
        'audio_buttons',
      );
    }
  }

  public openSegment(item: { levelID: number; itemID: number }) {
    this.onSegmentEntered(item);
  }

  public update() {
    this.audioChunkLines.startpos = this.audioChunkLines.time.start.clone();
  }

  onScrollbarMouse(event: any) {
    if (event.state === 'mousemove') {
      this.magnifierHidden = true;
    }
  }

  onScrolling(event: any) {
    if (event.state === 'scrolling') {
      this.magnifierHidden = true;
    }
  }

  afterFirstInitialization() {
    this.checkIfSmallAudioChunk(this.audioChunkLines, this.annotationStoreService.currentLevel!);
    this.cd.detectChanges();
  }

  public enableAllShortcuts() {
    this.shortcutsEnabled = true;
    this.viewer.enableShortcuts();
    if (this.window?.componentInstance?.magnifier !== undefined) {
      this.window.componentInstance.magnifier.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.shortcutsEnabled = false;
    this.viewer.disableShortcuts();
    if (this.window?.componentInstance?.magnifier !== undefined) {
      this.window.componentInstance.magnifier.disableShortcuts();
    }
  }

  onCurrentLevelChange($event: CurrentLevelChangeEvent) {
    if ($event.type === 'change') {
      this.annotationStoreService.changeCurrentLevelItems($event.items.map((a) => a.instance!));
    }

    if ($event.type === 'remove') {
      this.annotationStoreService.removeCurrentLevelItems($event.items, $event.removeOptions?.silenceCode, $event.removeOptions?.mergeTranscripts);
    }

    if ($event.type === 'add') {
      this.annotationStoreService.addCurrentLevelItems($event.items.map((a) => a.instance!));
    }
  }

  private onModalAction = (event: any) => {
    if (event.type === 'open' && (event.name === 'OverviewModalComponent' || event.name === 'RegReplaceModalComponent')) {
      this.window?.close();
    }
  };
}
