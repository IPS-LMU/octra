import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranscrEditorComponent } from '../../core/component';

import {
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { OCTRAEditor, OctraEditorRequirements } from '../octra-editor';
import {
  AudioChunk,
  AudioManager,
  Shortcut,
  ShortcutGroup,
} from '@octra/web-media';
import {
  ASRContext,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
  OLabel,
} from '@octra/annotation';
import { AudioplayerComponent } from '@octra/ngx-components';
import { AudioNavigationComponent } from '../../core/component/audio-navigation';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { SampleUnit } from '@octra/media';
import { ShortcutService } from '../../core/shared/service/shortcut.service';
import { HotkeysEvent } from 'hotkeys-js';

@Component({
  selector: 'octra-audioplayer-gui',
  templateUrl: './dictaphone-editor.component.html',
  styleUrls: ['./dictaphone-editor.component.scss'],
})
export class DictaphoneEditorComponent
  extends OCTRAEditor
  implements OnInit, OnDestroy, AfterViewInit, OctraEditorRequirements
{
  public static editorname = 'Dictaphone Editor';

  @ViewChild('nav', { static: true }) nav!: AudioNavigationComponent;
  @ViewChild('audioplayer', { static: true })
  audioplayer!: AudioplayerComponent;
  @ViewChild('transcr', { static: true })
  public editor!: TranscrEditorComponent;

  public audiochunk!: AudioChunk;
  public audioManager!: AudioManager;
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  public get highlighting(): boolean {
    return this.appStorage.highlightingEnabled;
  }

  public set highlighting(value: boolean) {
    this.appStorage.highlightingEnabled = value;
  }

  public segments?: OctraAnnotationSegment[] = [];

  private oldRaw = '';

  onAudioPlayerPlay = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction(keyboardEvent, {
      shortcut: shortcut.name,
      value: hotKeyEvent.shortcut,
    });

    if (this.audiochunk.isPlaying) {
      this.audiochunk.pausePlayback().catch((error: any) => {
        console.error(error);
      });
    } else {
      console.log(`PLAY CHUNK ${this.audiochunk.id}`);
      this.audiochunk.startPlayback(false).catch((error: any) => {
        console.error(error);
      });
    }
  };

  onAudioStop = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction(keyboardEvent, {
      shortcut: shortcut.name,
      value: hotKeyEvent.shortcut,
    });

    this.audiochunk.stopPlayback().catch((error: any) => {
      console.error(error);
    });
  };

  onStepBackward = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction(keyboardEvent, {
      shortcut: shortcut.name,
      value: hotKeyEvent.shortcut,
    });

    this.audiochunk.stepBackward().catch((error: any) => {
      console.error(error);
    });
  };

  onStepBackwardTime = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent
  ) => {
    this.triggerUIAction(keyboardEvent, {
      shortcut: shortcut.name,
      value: hotKeyEvent.shortcut,
    });

    this.audiochunk.stepBackwardTime(0.5).catch((error: any) => {
      console.error(error);
    });
  };

  public shortcuts: ShortcutGroup = {
    name: 'audioplayer',
    enabled: true,
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'TAB',
        },
        title: 'play pause',
        focusonly: false,
        callback: this.onAudioPlayerPlay,
      },
      {
        name: 'stop',
        keys: {
          mac: 'ESC',
        },
        title: 'stop playback',
        focusonly: false,
        callback: this.onAudioStop,
      },
      {
        name: 'step_backward',
        keys: {
          mac: 'SHIFT + BACKSPACE',
        },
        title: 'step backward',
        focusonly: false,
        callback: this.onStepBackward,
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + TAB',
        },
        title: 'step backward time',
        focusonly: false,
        callback: this.onStepBackwardTime,
      },
    ],
  };

  public get settings() {
    return this.audioplayer.settings;
  }

  public set settings(value: any) {
    this.audioplayer.settings = value;
  }

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(
    public audio: AudioService,
    public shortcutService: ShortcutService,
    public annotationStoreService: AnnotationStoreService,
    private uiService: UserInteractionsService,
    public settingsService: SettingsService,
    public appStorage: AppStorageService
  ) {
    super();

    /*
    if (
      this.appStorage.useMode === 'online' ||
      this.appStorage.useMode === 'demo'
    ) {
      this.subscrManager.add(
        this.keyMap.beforeShortcutTriggered.subscribe(
          (event: ShortcutEvent) => {
            if (
              event.shortcut === 'SHIFT + ALT + 1' ||
              event.shortcut === 'SHIFT + ALT + 2' ||
              event.shortcut === 'SHIFT + ALT + 3'
            ) {
              /* TODO:later
              this.transcrService.tasksBeforeSend.push(
                new Promise<void>((resolve) => {
                  this.appStorage.afterSaving().then(() => {
                    resolve();
                  });
                })
              );

            }
          }
        )
      );
    } */
  }

  ngOnInit() {
    this.audioManager = this.audio.audiomanagers[0];
    this.audiochunk = this.audioManager.mainchunk.clone();
    this.editor.settings.markers =
      this.annotationStoreService.guidelines?.markers ?? [];
    this.editor.settings.responsive = this.settingsService.responsive.enabled;
    this.editor.settings.specialMarkers.boundary = true;
    this.editor.settings.highlightingEnabled = true;

    this.shortcutService.unregisterShortcutGroup(this.shortcuts.name);
    this.shortcutService.registerShortcutGroup(this.shortcuts);

    this.initialized.emit();
  }

  ngAfterViewInit() {
    this.loadEditor();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });
    this.shortcutService.destroy();
  }

  onButtonClick(event: { type: string; timestamp: number }) {
    this.uiService.addElementFromEvent(
      'mouseclick',
      { value: event.type },
      event.timestamp,
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'audio_buttons'
    );
  }

  afterSpeedChange(event: { new_value: number; timestamp: number }) {
    this.appStorage.audioSpeed = event.new_value;
    this.uiService.addElementFromEvent(
      'slider',
      event,
      event.timestamp,
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'audio_speed'
    );
  }

  afterVolumeChange(event: { new_value: number; timestamp: number }) {
    this.appStorage.audioVolume = event.new_value;
    this.uiService.addElementFromEvent(
      'slider',
      event,
      event.timestamp,
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'audio_volume'
    );
  }

  afterTyping(status: string) {
    if (status === 'started') {
      this.oldRaw = this.editor.rawText;
    }

    if (status === 'stopped') {
      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.savingNeeded = false;
        this.oldRaw = this.editor.rawText;
      }

      this.editor.updateRawText();
      this.saveTranscript();

      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.saving.emit('success');
      }
    }
  }

  private triggerUIAction = (keyboardEvent: Event, shortcutObj: any) => {
    shortcutObj.value = `audio:${shortcutObj.value}`;
    this.uiService.addElementFromEvent(
      'shortcut',
      shortcutObj,
      Date.now(),
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'texteditor'
    );
  };

  onBoundaryClicked(samples: SampleUnit) {
    /*
    const i: number = getSegmentBySamplePosition(
      this.transcrService.currentlevel!.segments,
      samples
    );

    this.boundaryselected = true;

    if (i > -1) {
      const start =
        i > 0
          ? this.transcrService.currentlevel!.segments[i - 1]!.time.samples
          : 0;

      new Promise<void>((resolve) => {
        if (this.audiochunk.isPlaying) {
          this.audiochunk.stopPlayback().then(resolve);
        } else {
          resolve();
        }
      }).then(() => {
        this.audiochunk.startpos = this.audioManager.createSampleUnit(start);
        this.audiochunk.selection.end =
          this.transcrService.currentlevel!.segments[i]!.time.clone();

        this.audiochunk.startPlayback().then(() => {
          // set start pos to selected boundary
          this.audiochunk.startpos = samples.clone();
          this.audioplayer.update();
        });
        this.boundaryselected = false;
      });
    } else {
      this.boundaryselected = false;
    }
    */
  }

  onBoundaryInserted() {
    this.uiService.addElementFromEvent(
      'segment',
      { value: 'boundaries:add' },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'texteditor'
    );
  }

  onMarkerInsert(markerCode: string) {
    this.uiService.addElementFromEvent(
      'shortcut',
      { value: 'markers:' + markerCode },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'texteditor'
    );
  }

  onMarkerClick(markerCode: string) {
    this.afterTyping('stopped');

    this.uiService.addElementFromEvent(
      'mouseclick',
      { value: markerCode },
      Date.now(),
      this.audioManager.playPosition,
      this.editor.caretpos,
      undefined,
      undefined,
      'texteditor_toolbar'
    );
  }

  saveTranscript() {
    const transcript = this.annotationStoreService.transcript!.clone();

    if (transcript.currentLevel && transcript.currentLevel.type === 'SEGMENT') {
      transcript.currentLevel.clear();
      const rawText = this.editor.rawText;
      // split text at the position of every boundary marker
      let segTexts: string[] = rawText.split(/\s*{[0-9]+}\s*/g);

      const samplesArray: number[] = [];
      rawText.replace(new RegExp(/\s*{([0-9]+)}\s*/, 'g'), (match, g1) => {
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

      segTexts = segTexts.map((a: string) => {
        return a.replace(/(^\s+)|(\s+$)/g, '');
      });

      const items: OctraAnnotationSegment<ASRContext>[] = [];

      for (let i = 0; i < segTexts.length; i++) {
        const time =
          i < samplesArray.length
            ? new SampleUnit(samplesArray[i], this.audioManager.sampleRate)
            : this.audioManager.resource.info.duration;

        items.push(
          transcript.createSegment(time, [
            new OLabel(transcript.currentLevel!.name, segTexts[i]),
          ])
        );
      }
      transcript.currentLevel.overwriteItems(items as any);
      this.annotationStoreService.overwriteTranscript(transcript);
    }
  }

  public update() {
    this.audiochunk.startpos = this.audiochunk.time.start;
    this.loadEditor();
  }

  public afterFirstInitialization() {
    // ignore
  }

  public enableAllShortcuts() {
    this.shortcutsEnabled = true;
  }

  public disableAllShortcuts() {
    this.shortcutsEnabled = false;
  }

  onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  onTranscrEditorRedoUndo(type: 'undo' | 'redo') {
    this.subscrManager.removeByTag('annochange');
    this.subscrManager.add(
      this.appStorage.annotationChanged.subscribe(() => {
        this.subscrManager.removeByTag('annochange');
        this.loadEditor();
      }),
      'annochange'
    );

    if (type === 'undo') {
      this.appStorage.undo();
    } else if (type === 'redo') {
      this.appStorage.redo();
    }
  }

  openSegment(index: number) {
    // ignore
  }

  private loadEditor() {
    if (
      this.annotationStoreService.currentLevel &&
      this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel &&
      this.annotationStoreService.currentLevel.items.length > 0
    ) {
      this.segments = this.annotationStoreService.currentLevel.items;
    }
    this.editor.settings.height = 100;
    this.oldRaw = this.editor.rawText;
  }
}
