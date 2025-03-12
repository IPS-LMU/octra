import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
import { contains } from '@octra/utilities';
import {
  TranscrEditorComponent,
  TranscrEditorConfig,
} from '../../core/component';

import { NgClass, NgStyle } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ASRContext,
  OctraAnnotation,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
} from '@octra/annotation';
import { AudioSelection, SampleUnit } from '@octra/media';
import {
  AudioViewerComponent,
  AudioviewerConfig,
  AudioViewerShortcutEvent,
  CurrentLevelChangeEvent,
  OctraComponentsModule,
} from '@octra/ngx-components';
import {
  AudioChunk,
  AudioManager,
  BrowserInfo,
  Shortcut,
  ShortcutGroup,
} from '@octra/web-media';
import { HotkeysEvent } from 'hotkeys-js';
import { timer } from 'rxjs';
import { AudioNavigationComponent } from '../../core/component/audio-navigation';
import { AudioNavigationComponent as AudioNavigationComponent_1 } from '../../core/component/audio-navigation/audio-navigation.component';
import { TranscrEditorComponent as TranscrEditorComponent_1 } from '../../core/component/transcr-editor/transcr-editor.component';
import { SampleInterval } from '../../core/obj/Settings/logging';
import {
  AlertService,
  AlertType,
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { ShortcutService } from '../../core/shared/service/shortcut.service';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { OCTRAEditor, OctraEditorRequirements } from '../octra-editor';

@Component({
  selector: 'octra-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.scss'],
  imports: [
    OctraComponentsModule,
    NgStyle,
    AudioNavigationComponent_1,
    TranscrEditorComponent_1,
    NgClass,
    TranslocoPipe,
  ],
})
export class LinearEditorComponent
  extends OCTRAEditor
  implements OnInit, AfterViewInit, OctraEditorRequirements
{
  public static editorname = 'Linear Editor';
  public initialized: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('signalDisplayTop', { static: true })
  signalDisplayTop!: AudioViewerComponent;
  @ViewChild('minimagnifierComponent', { static: false })
  minimagnifierComponent!: AudioViewerComponent;
  @ViewChild('signalDisplayDown', { static: false })
  signalDisplayDown!: AudioViewerComponent;
  @ViewChild('nav', { static: true }) nav!: AudioNavigationComponent;
  @ViewChild('transcr', { static: true })
  public editor!: TranscrEditorComponent;
  editorSettings: TranscrEditorConfig = new TranscrEditorConfig();

  public segmentselected = false;
  public magnifierSettings!: AudioviewerConfig;
  public minimagnifier = {
    component: undefined,
    isHidden: true,
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
  public audioChunkTop!: AudioChunk;
  public audioChunkDown?: AudioChunk;
  public audioChunkMagnifier!: AudioChunk;

  public selectedAudioChunk!: AudioChunk;
  private oldRaw = '';
  private saving = false;
  private factor = 6;
  private platform = BrowserInfo.platform;
  private selectedIndex!: number;

  private mousestate = 'initiliazied';

  private onAudioPlayPause = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
    shortcutGroup: ShortcutGroup,
  ) => {
    const currentAudioChunk =
      shortcutGroup.name === 'signaldisplay_top_audio'
        ? this.audioChunkTop
        : this.audioChunkDown;
    const controlName = shortcutGroup.name.replace('_audio', '');

    if (currentAudioChunk) {
      this.selectedAudioChunk = currentAudioChunk;
      this.triggerUIActionAfterShortcut(
        {
          shortcut: hotKeyEvent.shortcut,
          value: shortcut.name,
        },
        controlName,
        Date.now(),
      );
      if (currentAudioChunk.isPlaying) {
        currentAudioChunk.pausePlayback().catch((error) => {
          console.error(error);
        });
      } else {
        currentAudioChunk.startPlayback(false).catch((error) => {
          console.error(error);
        });
      }
    }
  };

  private onAudioStop = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
    shortcutGroup: ShortcutGroup,
  ) => {
    const currentAudioChunk =
      shortcutGroup.name === 'signaldisplay_top_audio'
        ? this.audioChunkTop
        : this.audioChunkDown;
    const controlName = shortcutGroup.name.replace('_audio', '');

    if (currentAudioChunk) {
      this.selectedAudioChunk = currentAudioChunk;
      this.triggerUIActionAfterShortcut(
        {
          shortcut: hotKeyEvent.shortcut,
          value: shortcut.name,
        },
        controlName,
        Date.now(),
      );
      currentAudioChunk.stopPlayback().catch((error) => {
        console.error(error);
      });
    }
  };

  private onStepBackward = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
    shortcutGroup: ShortcutGroup,
  ) => {
    const currentAudioChunk =
      shortcutGroup.name === 'signaldisplay_top_audio'
        ? this.audioChunkTop
        : this.audioChunkDown;
    const controlName = shortcutGroup.name.replace('_audio', '');

    if (currentAudioChunk) {
      this.selectedAudioChunk = currentAudioChunk;
      this.triggerUIActionAfterShortcut(
        {
          shortcut: hotKeyEvent.shortcut,
          value: shortcut.name,
        },
        controlName,
        Date.now(),
      );
      currentAudioChunk.stepBackward().catch((error) => {
        console.error(error);
      });
    }
  };

  private onStepBackwardTime = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
    shortcutGroup: ShortcutGroup,
  ) => {
    const currentAudioChunk =
      shortcutGroup.name === 'signaldisplay_top_audio'
        ? this.audioChunkTop
        : this.audioChunkDown;
    const controlName = shortcutGroup.name.replace('_audio', '');

    if (currentAudioChunk) {
      this.selectedAudioChunk = currentAudioChunk;
      this.triggerUIActionAfterShortcut(
        {
          shortcut: hotKeyEvent.shortcut,
          value: shortcut.name,
        },
        controlName,
        Date.now(),
      );
      currentAudioChunk.stepBackwardTime(0.5).catch((error) => {
        console.error(error);
      });
    }
  };

  onZoomInOut = (
    $event: KeyboardEvent,
    shortcut: Shortcut,
    hotkeyEvent: HotkeysEvent,
  ) => {
    if (this.shortcutsEnabled) {
      if (this.appStorage.showMagnifier) {
        if (this.minimagnifier !== undefined && this.signalDisplayTop.focused) {
          if (hotkeyEvent.key === '.' || hotkeyEvent.key === ',') {
            if (hotkeyEvent.key === '.') {
              this.factor = Math.min(12, this.factor + 1);
              this.minimagnifierComponent.av.zoomY = Math.max(1, this.factor);
            } else if (hotkeyEvent.key === ',') {
              if (this.factor > 3) {
                this.factor = Math.max(1, this.factor - 1);
                this.minimagnifierComponent.av.zoomY = Math.max(4, this.factor);
              }
            }

            this.changeArea(
              this.minimagnifierComponent,
              this.signalDisplayTop,
              this.audioManager,
              this.audioChunkMagnifier,
              this.signalDisplayTop.av.mouseCursor!,
              this.factor,
            ).then((newMagnifierChunk) => {
              if (newMagnifierChunk !== undefined) {
                this.audioChunkMagnifier = newMagnifierChunk;
              }
            });
          }
        }
      }
    }
  };

  private audioShortcutsTopDisplay: ShortcutGroup = {
    name: 'signaldisplay_top',
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

  private audioShortcutsBottomDisplay: ShortcutGroup = {
    name: 'signaldisplay_down',
    enabled: true,
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'SHIFT + SPACE',
          pc: 'SHIFT + SPACE',
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
          mac: 'SHIFT + ENTER',
          pc: 'SHIFT + ENTER',
        },
        title: 'step backward',
        focusonly: false,
        callback: this.onStepBackward,
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + *',
          pc: 'SHIFT + *',
        },
        title: 'step backward time',
        focusonly: false,
        callback: this.onStepBackwardTime,
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
       *         focusonly: false,
       *         callback: this.onZoomInOut,
       *       },
       *       {
       *         name: 'zoom out',
       *         title: 'zoom out',
       *         keys: {
       *           mac: ',',
       *           pc: ',',
       *         },
       *         focusonly: false,
       *         callback: this.onZoomInOut,
       *       },
       */
    ],
  };

  public transcript = '';

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get segmententer_shortc(): string {
    const segmentEnterShortcut =
      this.signalDisplayTop.settings.shortcuts.items.find(
        (a) => a.name === 'segment_enter',
      );
    if (
      segmentEnterShortcut !== undefined &&
      this.signalDisplayTop.settings !== undefined
    ) {
      return segmentEnterShortcut.keys[this.platform]!;
    }
    return '';
  }

  private _miniMagnifierSettings!: AudioviewerConfig;

  get miniMagnifierSettings(): AudioviewerConfig {
    return this._miniMagnifierSettings;
  }

  constructor(
    public audio: AudioService,
    public alertService: AlertService,
    public annotationStoreService: AnnotationStoreService,
    public shortcutService: ShortcutService,
    public cd: ChangeDetectorRef,
    public uiService: UserInteractionsService,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
  ) {
    super();
  }

  /**
   * hits when user is typing something in the editor
   */
  onEditorTyping = (status: string) => {
    // this.viewer.focused = false;
    // this.magnifier.viewer.focused = false;
    if (!this.editor) {
      return;
    }

    if (status === 'started') {
      this.oldRaw = this.editor.rawText;
    }

    if (status === 'stopped') {
      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.savingNeeded = false;
        this.oldRaw = this.editor.rawText;
      }

      this.editor.updateRawText();
      this.save();

      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.saving.emit('success');
      }
    }
  };

  ngOnInit() {
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkTop = this.audioManager.mainchunk.clone();
    this.audioChunkMagnifier = this.audioManager.mainchunk.clone();
    this.selectedAudioChunk = this.audioChunkTop;

    this.shortcutService.registerShortcutGroup({
      name: 'signaldisplay_top_audio',
      enabled: true,
      items: this.audioShortcutsTopDisplay.items,
    });

    this.shortcutService.registerShortcutGroup({
      name: 'signaldisplay_top',
      enabled: true,
      items: this.signalDisplayTop.settings.shortcuts.items,
    });

    this.signalDisplayTop.settings.shortcutsEnabled = true;
    this.signalDisplayTop.settings.boundaries.enabled = true;
    this.signalDisplayTop.settings.boundaries.readonly = false;
    this.signalDisplayTop.settings.justifySignalHeight = true;
    this.signalDisplayTop.settings.roundValues = false;
    this.signalDisplayTop.settings.showTimePerLine = true;
    this.signalDisplayTop.settings.margin.top = 5;

    this.magnifierSettings = new AudioviewerConfig();
    this.shortcutService.registerShortcutGroup({
      name: 'signaldisplay_down_audio',
      enabled: true,
      items: this.audioShortcutsBottomDisplay.items,
    });
    this.shortcutService.registerShortcutGroup({
      name: 'signaldisplay_down',
      enabled: true,
      items: this.magnifierSettings.shortcuts.items,
    });
    this.shortcutService.registerShortcutGroup(this.miniMagnifierShortcuts);
    this.magnifierSettings.justifySignalHeight = true;
    this.magnifierSettings.roundValues = false;
    this.magnifierSettings.boundaries.enabled = true;
    this.magnifierSettings.showTimePerLine = true;
    this.magnifierSettings.margin.top = 5;

    // set settings for mini magnifier
    this._miniMagnifierSettings = new AudioviewerConfig();
    this._miniMagnifierSettings.roundValues = false;
    this._miniMagnifierSettings.shortcutsEnabled = false;
    this._miniMagnifierSettings.selection.enabled = false;
    this._miniMagnifierSettings.boundaries.readonly = true;
    this._miniMagnifierSettings.asr.enabled = false;
    this._miniMagnifierSettings.cropping = 'circle';
    this._miniMagnifierSettings.cursor.fixed = true;
    this._miniMagnifierSettings.lineheight = 160;

    this.editorSettings.markers =
      this.annotationStoreService.guidelines?.markers ?? [];
    this.editorSettings.disabledKeys.push('SHIFT + SPACE');

    this.subscribe(this.annotationStoreService.currentLevel$, ($event) => {
      if (!this.saving) {
        this.subscribe(timer(1000), () => {
          this.saving = true;
          this.onLevelChange();
        });
      }
    });

    this.subscribe(this.signalDisplayTop.alert, (result) => {
      this.alertService
        .showAlert(result.type as AlertType, result.message)
        .catch((error) => {
          console.error(error);
        });
    });

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });
    this.shortcutService.destroy();
  }

  onButtonClick(event: { type: string; timestamp: number }) {
    // only top signal display
    const caretpos = this.editor.textSelection;
    this.uiService.addElementFromEvent(
      'mouseclick',
      { value: event.type },
      event.timestamp,
      this.audioManager.playPosition,
      caretpos,
      {
        start: this.signalDisplayTop.av.drawnSelection!.start.samples,
        length: this.signalDisplayTop.av.drawnSelection!.duration.samples,
      },
      undefined,
      'audio_buttons',
    );
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    if (this.appStorage.showMagnifier) {
      this.minimagnifierComponent.av.zoomY = this.factor;
    }

    this.subscribe(
      this.annotationStoreService.segmentrequested,
      (segnumber: number) => {
        this.openSegment(segnumber);
      },
    );

    this.subscribe(
      this.signalDisplayTop.onInitialized,
      () => {
        this.initialized.emit();
        this.subscriptionManager.removeByTag('topSignalInitialized');
      },
      'topSignalInitialized',
    );
  }

  onSelectionChanged(selection: AudioSelection) {
    if (selection) {
      if (selection.length > 0) {
        selection.checkSelection();
        this.segmentselected = false;
        if (this.audioChunkDown !== undefined) {
          this.audioChunkDown.destroy();
        }
        this.audioChunkDown = new AudioChunk(
          this.audioChunkTop.selection.clone(),
          this.audioManager,
        );
      } else {
        this.audioChunkDown = undefined;
        this.selectedAudioChunk = this.audioChunkTop;
      }
    }
  }

  onAlertTriggered(result: any) {
    this.alertService.showAlert(result.type, result.message).catch((error) => {
      console.error(error);
    });
  }

  onLevelChange() {
    this.saving = false;
  }

  onMouseOver($event: {
    event: MouseEvent | undefined;
    time: SampleUnit | undefined;
  }) {
    this.subscriptionManager.removeByTag('mouseTimer');

    this.minimagnifier.component = this.signalDisplayTop as any;

    this.doPlayOnHover(
      this.audioManager,
      this.appStorage.playOnHover ?? false,
      this.audioChunkTop,
      this.signalDisplayTop.av.mouseCursor!,
    );

    if (this.appStorage.showMagnifier) {
      this.minimagnifier.isHidden = false;
      this.subscribe(
        timer(20),
        () => {
          this.changeMagnifierPosition($event.event!, $event.time!);
          this.mousestate = 'ended';
        },
        'mouseTimer',
      );
    }
  }

  onSegmentEnter($event: any) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audioChunkDown = new AudioChunk(selection, this.audioManager);
      this.editor.focus(true, true).catch((error) => {
        console.error(error);
      });
    });

    if (
      this.appStorage.logging &&
      this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel
    ) {
      const start =
        $event.index > 0
          ? this.annotationStoreService.currentLevel!.items[$event.index - 1]!
              .time.samples
          : 0;
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
          start,
          length:
            this.annotationStoreService.currentLevel!.items[$event.index]!.time
              .samples - start,
        },
        LinearEditorComponent.editorname,
      );
    }
  }

  onMagnifierSegmentEnter($event: any) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audioChunkDown!.selection = selection.clone();
      this.audioChunkDown!.absolutePlayposition = selection.start.clone();
      this.editor.focus(true, true).catch((error) => {
        console.error(error);
      });
    });
  }

  onTranscriptionChanged() {
    this.save();
  }

  onViewerShortcutTriggered($event: AudioViewerShortcutEvent, control: string) {
    this.triggerUIActionAfterShortcut($event, control, $event.timestamp);

    if ($event.shortcutName === 'undo') {
      this.appStorage.undo();
    } else if ($event.shortcutName === 'redo') {
      this.appStorage.redo();
    }
  }

  private triggerUIActionAfterShortcut(
    $event: any,
    control: string,
    timestamp: number,
  ) {
    const component: AudioViewerComponent =
      control === 'signaldisplay_top'
        ? this.signalDisplayTop
        : this.signalDisplayDown;
    if (this.appStorage.logging) {
      if (
        $event.value === undefined ||
        !(
          // cursor move by keyboard events are note saved because this would be too much
          (
            contains($event.value, 'cursor') ||
            // disable logging for user test phase, because it would be too much
            contains($event.value, 'segment_enter') ||
            contains($event.value, 'playonhover')
          )
        )
      ) {
        const textSelection = this.editor.textSelection;
        $event.value = $event.type + ':' + $event.value;

        let segment = undefined;

        if (
          this.segmentselected &&
          this.selectedIndex > -1 &&
          this.annotationStoreService.currentLevel instanceof
            OctraAnnotationSegmentLevel
        ) {
          const annoSegment =
            this.annotationStoreService.currentLevel!.items[this.selectedIndex];
          segment = {
            start: annoSegment!.time.samples,
            length:
              this.selectedIndex <
              this.annotationStoreService.currentLevel!.items.length - 1
                ? this.annotationStoreService.currentLevel!.items[
                    this.selectedIndex + 1
                  ]!.time.samples - annoSegment!.time.samples
                : this.audioManager.resource.info.duration.samples -
                  annoSegment!.time.samples,
          };
        }

        let audioSelection: SampleInterval | undefined = undefined;

        let playPosition = component!.audioChunk!.absolutePlayposition;

        audioSelection = {
          start: component!.av.drawnSelection!.start.samples,
          length: component!.av.drawnSelection!.duration.samples,
        };

        if (!component!.audioChunk!.isPlaying) {
          if ($event.type === 'boundary') {
            playPosition = component.av.MouseClickPos!;
          }
        }

        this.uiService.addElementFromEvent(
          'shortcut',
          $event,
          timestamp,
          playPosition,
          textSelection,
          audioSelection,
          segment,
          control,
        );
      } else if (
        $event.value !== undefined &&
        contains($event.value, 'playonhover')
      ) {
        this.appStorage.playOnHover = !this.appStorage.playOnHover;
      }
    }
  }

  onMagnifierClick() {
    if (
      this.selectedIndex > -1 &&
      this.annotationStoreService.currentLevel?.items &&
      this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel
    ) {
      const endSamples =
        this.annotationStoreService.currentLevel.items[this.selectedIndex]!.time
          .samples;
      let startSamples = 0;
      if (this.selectedIndex > 0) {
        startSamples =
          this.annotationStoreService.currentLevel.items[
            this.selectedIndex - 1
          ]!.time.samples;
      }
      if (
        this.signalDisplayDown.av.MouseClickPos!.samples < startSamples ||
        this.signalDisplayDown.av.MouseClickPos!.samples > endSamples
      ) {
        this.segmentselected = false;
      }
    }
  }

  onMarkerInsert(markerCode: string) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
      };

      if (
        this.segmentselected &&
        this.selectedIndex > -1 &&
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
      ) {
        const annoSegment =
          this.annotationStoreService.currentLevel?.items[this.selectedIndex];
        segment.start = annoSegment!.time.samples;
        segment.length =
          this.selectedIndex <
          this.annotationStoreService.currentLevel.items.length - 1
            ? this.annotationStoreService.currentLevel.items[
                this.selectedIndex + 1
              ]!.time.samples - annoSegment!.time.samples
            : this.audioManager.resource.info.duration.samples -
              annoSegment!.time.samples;
      }

      this.uiService.addElementFromEvent(
        'shortcut',
        { value: markerCode },
        Date.now(),
        this.audioManager.playPosition,
        this.editor.textSelection,
        undefined,
        segment,
        'texteditor_markers',
      );
    }
  }

  onMarkerClick(markerCode: string) {
    this.onTranscriptionChanged();
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
      };
      if (
        this.segmentselected &&
        this.selectedIndex > -1 &&
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
      ) {
        const annoSegment =
          this.annotationStoreService.currentLevel.items[this.selectedIndex];
        segment.start = annoSegment!.time.samples;
        segment.length =
          this.selectedIndex <
          this.annotationStoreService.currentLevel.items.length - 1
            ? this.annotationStoreService.currentLevel.items[
                this.selectedIndex + 1
              ]!.time.samples - annoSegment!.time.samples
            : this.audioManager.resource.info.duration.samples -
              annoSegment!.time.samples;
      }

      this.uiService.addElementFromEvent(
        'mouseclick',
        { value: markerCode },
        Date.now(),
        this.audioManager.playPosition,
        this.editor.textSelection,
        undefined,
        segment,
        'texteditor_toolbar',
      );
    }
  }

  public changeMagnifierPosition(
    mouseEvent: MouseEvent,
    cursorTime: SampleUnit,
  ) {
    const x = mouseEvent.offsetX - (this.minimagnifier.size.width - 10) / 2 - 2;

    // magnifier is fully visible
    this.minimagnifier.location.y = mouseEvent.offsetY + 60;
    this.minimagnifier.location.x = x;

    this.changeArea(
      this.minimagnifierComponent,
      this.signalDisplayTop,
      this.audioManager,
      this.audioChunkMagnifier,
      cursorTime,
      this.factor,
    ).then((newMagnifierChunk) => {
      if (newMagnifierChunk !== undefined) {
        this.audioChunkMagnifier = newMagnifierChunk;
      }
    });
    this.cd.detectChanges();
  }

  onViewerMouseDown() {
    this.segmentselected = false;
  }

  afterSpeedChange(event: { new_value: number; timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
      };

      if (
        this.segmentselected &&
        this.selectedIndex > -1 &&
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
      ) {
        const annoSegment =
          this.annotationStoreService.currentLevel.items[this.selectedIndex];
        segment.start = annoSegment!.time.samples;
        segment.length =
          this.selectedIndex <
          this.annotationStoreService.currentLevel.items.length - 1
            ? this.annotationStoreService.currentLevel.items[
                this.selectedIndex + 1
              ]!.time.samples - annoSegment!.time.samples
            : this.audioManager.resource.info.duration.samples -
              annoSegment!.time.samples;
      }

      this.uiService.addElementFromEvent(
        'slider',
        event,
        event.timestamp,
        this.audioManager.playPosition,
        this.editor.textSelection,
        undefined,
        segment,
        'audio_speed',
      );
    }
  }

  afterVolumeChange(event: { new_value: number; timestamp: number }) {
    if (this.appStorage.logging) {
      let segment = undefined;

      if (
        this.segmentselected &&
        this.selectedIndex > -1 &&
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
      ) {
        const annoSegment =
          this.annotationStoreService.currentLevel.items[this.selectedIndex];
        segment = {
          start: annoSegment!.time.samples,
          length:
            this.selectedIndex <
            this.annotationStoreService.currentLevel.items.length - 1
              ? this.annotationStoreService.currentLevel.items[
                  this.selectedIndex + 1
                ]!.time.samples - annoSegment!.time.samples
              : this.audioManager.resource.info.duration.samples -
                annoSegment!.time.samples,
        };
      }

      this.uiService.addElementFromEvent(
        'slider',
        event,
        event.timestamp,
        this.audioManager.playPosition,
        this.editor.textSelection,
        undefined,
        segment,
        'audio_volume',
      );
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEnter({ index: segnumber });
  }

  public update() {
    this.segmentselected = false;
    this.audioChunkTop.startpos = this.audioChunkTop.time.start.clone();
    this.audioChunkDown!.startpos = this.audioChunkDown!.time.start.clone();
  }

  afterFirstInitialization() {
    this.checkIfSmallAudioChunk(
      this.audioChunkTop,
      this.annotationStoreService.currentLevel!,
    );
  }

  onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  public enableAllShortcuts() {
    this.signalDisplayTop.enableShortcuts();
    if (this.signalDisplayDown !== undefined) {
      this.signalDisplayDown.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.signalDisplayTop.disableShortcuts();
    if (this.signalDisplayDown !== undefined) {
      this.signalDisplayDown.disableShortcuts();
    }
  }

  private selectSegment(index: number): Promise<AudioSelection> {
    return new Promise<AudioSelection>((resolve) => {
      if (
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
      ) {
        const segment = this.annotationStoreService.currentLevel.items[index];
        this.transcript =
          segment!.getFirstLabelWithoutName('Speaker')?.value ?? '';
        this.selectedIndex = index;
        this.segmentselected = true;
        let start = this.audioManager.createSampleUnit(0);
        if (index > 0) {
          start =
            this.annotationStoreService.currentLevel.items[index - 1]!.time;
        }
        resolve(new AudioSelection(start, segment!.time));
      }
    });
  }

  private save() {
    if (this.segmentselected) {
      if (
        this.selectedIndex > -1 &&
        this.annotationStoreService.currentLevel?.items &&
        this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel &&
        this.selectedIndex <
          this.annotationStoreService.currentLevel.items.length
      ) {
        const segment = this.annotationStoreService.currentLevel.items[
          this.selectedIndex
        ].clone(
          this.annotationStoreService.currentLevel.items[this.selectedIndex].id,
        );
        segment.changeFirstLabelWithoutName('Speaker', this.editor.rawText);

        this.annotationStoreService.changeCurrentItemById(
          this.annotationStoreService.currentLevel.items[this.selectedIndex].id,
          segment,
        );
      }
    }
  }

  public onAudioViewerMouseLeave(
    keyGroup: 'signaldisplay_top' | 'signaldisplay_down',
  ) {
    // this.keyMap.shortcutsManager.disableShortcutGroup(keyGroup);
  }

  public onAudioViewerMouseEnter(
    keyGroup: 'signaldisplay_top' | 'signaldisplay_down',
  ) {
    // this.keyMap.shortcutsManager.enableShortcutGroup(keyGroup);
  }

  onEntriesChange(
    annotation: OctraAnnotation<ASRContext, OctraAnnotationSegment>,
  ) {
    this.annotationStoreService.overwriteTranscript(annotation);
  }

  onCurrentLevelChange($event: CurrentLevelChangeEvent) {
    if ($event.type === 'change') {
      this.annotationStoreService.changeCurrentLevelItems(
        $event.items.map((a) => a.instance!),
      );
    }

    if ($event.type === 'remove') {
      this.annotationStoreService.removeCurrentLevelItems(
        $event.items,
        $event.removeOptions?.silenceCode,
        $event.removeOptions?.mergeTranscripts,
      );
    }

    if ($event.type === 'add') {
      this.annotationStoreService.addCurrentLevelItems(
        $event.items.map((a) => a.instance!),
      );
    }
  }
}
