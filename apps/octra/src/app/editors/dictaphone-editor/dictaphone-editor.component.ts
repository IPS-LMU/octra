import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ShortcutGroup, SubscriptionManager} from '@octra/utilities';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';

import {
  AudioService,
  KeymappingService,
  KeyMappingShortcutEvent,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {OCTRAEditor} from '../octra-editor';
import {AudioChunk, AudioManager, SampleUnit} from '@octra/media';
import {Segment} from '@octra/annotation';
import {AudioNavigationComponent, AudioplayerComponent} from '@octra/components';

@Component({
  selector: 'octra-audioplayer-gui',
  templateUrl: './dictaphone-editor.component.html',
  styleUrls: ['./dictaphone-editor.component.css']
})
export class DictaphoneEditorComponent extends OCTRAEditor implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  public static editorname = 'Dictaphone Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('nav', {static: true}) nav: AudioNavigationComponent;
  @ViewChild('audioplayer', {static: true}) audioplayer: AudioplayerComponent;
  @ViewChild('transcr', {static: true}) public editor: TranscrEditorComponent;

  public audiochunk: AudioChunk;
  public audioManager: AudioManager;
  private subscrmanager: SubscriptionManager;
  private boundaryselected = false;

  public get highlighting(): boolean {
    return this.appStorage.highlightingEnabled;
  }

  public set highlighting(value: boolean) {
    this.appStorage.highlightingEnabled = value;
  }

  private oldRaw = '';

  private shortcuts: ShortcutGroup = {
    name: 'AP',
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'TAB',
          pc: 'TAB'
        },
        title: 'play pause',
        focusonly: false
      },
      {
        name: 'stop',
        keys: {
          mac: 'ESC',
          pc: 'ESC'
        },
        title: 'stop playback',
        focusonly: false
      },
      {
        name: 'step_backward',
        keys: {
          mac: 'SHIFT + BACKSPACE',
          pc: 'SHIFT + BACKSPACE'
        },
        title: 'step backward',
        focusonly: false
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + TAB',
          pc: 'SHIFT + TAB'
        },
        title: 'step backward time',
        focusonly: false
      }
    ]
  };

  private shortcutsEnabled = true;

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

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
    super();
    this.subscrmanager = new SubscriptionManager();

    if (this.appStorage.useMode === 'online' || this.appStorage.useMode === 'demo') {
      this.subscrmanager.add(this.keyMap.beforeKeyDown.subscribe((event) => {
        if (event.comboKey === 'ALT + SHIFT + 1' ||
          event.comboKey === 'ALT + SHIFT + 2' ||
          event.comboKey === 'ALT + SHIFT + 3') {
          this.transcrService.tasksBeforeSend.push(new Promise<void>((resolve) => {
            this.appStorage.afterSaving().then(() => {
              resolve();
            });
          }));
        }
      }));
    }
  }

  ngOnInit() {
    this.audioManager = this.audio.audiomanagers[0];
    this.audiochunk = this.audioManager.mainchunk.clone();
    this.editor.Settings.markers = this.transcrService.guidelines.markers.items;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.specialMarkers.boundary = true;
    this.editor.Settings.highlightingEnabled = true;

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onShortcutTriggered), 'shortcut');

    this.keyMap.register(this.shortcuts);

    DictaphoneEditorComponent.initialized.emit();
  }

  ngAfterViewInit() {
    this.loadEditor();
  }

  ngOnDestroy() {
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });
    this.subscrmanager.destroy();
    this.keyMap.unregister('AP');
  }

  ngOnChanges(obj: SimpleChanges) {
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    this.uiService.addElementFromEvent('mouseclick', {value: event.type},
      event.timestamp, this.audioManager.playposition,
      this.editor.caretpos, null, null, 'audio_buttons');
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    this.appStorage.audioSpeed = event.new_value;
    this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audioManager.playposition,
      this.editor.caretpos, null, null, 'audio_speed');
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    this.appStorage.audioVolume = event.new_value;
    this.uiService.addElementFromEvent('slider', event, event.timestamp,
      this.audioManager.playposition, this.editor.caretpos, null, null, 'audio_volume');
  }

  afterTyping(status) {
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

  onShortcutTriggered = ($event: KeyMappingShortcutEvent) => {
    const triggerUIAction = (shortcutObj) => {
      shortcutObj.value = `audio:${shortcutObj.value}`;
      this.uiService.addElementFromEvent('shortcut', shortcutObj, Date.now(),
        this.audioManager.playposition, this.editor.caretpos, null, null, 'texteditor');
    };

    if (this.shortcutsEnabled) {
      switch ($event.shortcutName) {
        case('play_pause'):
          triggerUIAction({shortcut: $event.shortcutName, value: $event.shortcut});
          if (this.audiochunk.isPlaying) {
            this.audiochunk.pausePlayback().catch((error) => {
              console.error(error);
            });
          } else {
            this.audiochunk.startPlayback(false).catch((error) => {
              console.error(error);
            });
          }
          break;
        case('stop'):
          triggerUIAction({shortcut: $event.shortcutName, value: $event.shortcut});
          this.audiochunk.stopPlayback().catch((error) => {
            console.error(error);
          });
          break;
        case('step_backward'):
          console.log(`step backward`);
          triggerUIAction({shortcut: $event.shortcutName, value: $event.shortcut});
          this.audiochunk.stepBackward().catch((error) => {
            console.error(error);
          });
          break;
        case('step_backwardtime'):
          console.log(`step backward time`);
          triggerUIAction({shortcut: $event.shortcutName, value: $event.shortcut});
          this.audiochunk.stepBackwardTime(0.5).catch((error) => {
            console.error(error);
          });
          break;
      }
    }
  }

  onBoundaryClicked(samples: SampleUnit) {
    const i: number = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(samples);

    this.boundaryselected = true;

    if (i > -1) {
      const start = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.samples : 0;

      new Promise<void>((resolve) => {
        if (this.audiochunk.isPlaying) {
          this.audiochunk.stopPlayback().then(resolve);
        } else {
          resolve();
        }
      }).then(() => {
        this.audiochunk.startpos = this.audioManager.createSampleUnit(start);
        this.audiochunk.selection.end = this.transcrService.currentlevel.segments.get(i).time.clone();

        this.audiochunk.startPlayback().then(() => {
          // set start pos and playback length to end of audio file
          this.audiochunk.startpos = this.audioManager.createSampleUnit(samples.samples);
        });
        this.boundaryselected = false;
      });
    } else {
      this.boundaryselected = false;
    }
  }

  onBoundaryInserted() {
    this.uiService.addElementFromEvent('segment', {value: 'boundaries:add'}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, null, null, 'texteditor');
  }

  onMarkerInsert(markerCode: string) {
    this.uiService.addElementFromEvent('shortcut', {value: 'markers:' + markerCode}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, null, null, 'texteditor');
  }

  onMarkerClick(markerCode: string) {
    this.afterTyping('stopped');

    this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, null, null, 'texteditor_toolbar');
  }

  saveTranscript() {
    const rawText = this.editor.rawText;
    // split text at the position of every boundary marker
    let segTexts: string[] = rawText.split(
      /\s*{[0-9]+}\s*/g);

    const samplesArray: number[] = [];
    rawText.replace(new RegExp('\s*{([0-9]+)}\s*', 'g'),
      (match, g1) => {
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

    let annoSegLength = this.transcrService.currentlevel.segments.length;
    for (let i = 0; i < segTexts.length; i++) {
      const newRaw = segTexts[i];

      if (i < annoSegLength) {
        // probably overwrite old files
        const segment: Segment = this.transcrService.currentlevel.segments.get(i).clone();
        segment.transcript = newRaw;
        if (i < segTexts.length - 1) {
          segment.time = this.audioManager.createSampleUnit(samplesArray[i]);
        }

        this.transcrService.currentlevel.segments.change(i, segment);
      } else {
        // add new segments
        if (i === segTexts.length - 1) {
          this.transcrService.currentlevel.segments.add(this.audiochunk.time.end.clone(), this.transcrService.currentlevel.name, newRaw);
        } else {
          this.transcrService.currentlevel.segments.add(this.audioManager.createSampleUnit(samplesArray[i]), this.transcrService.currentlevel.name, newRaw);
        }
      }
    }

    annoSegLength = this.transcrService.currentlevel.segments.length;
    if (annoSegLength > segTexts.length) {
      // remove left segments
      this.transcrService.currentlevel.segments.segments.splice(segTexts.length, (annoSegLength - segTexts.length));
      // because last segment was removed
      const seg = this.transcrService.currentlevel.segments.get(segTexts.length - 1);
      seg.time = this.audiochunk.time.end.clone();
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
    console.log(`enable all shortcuts!`);
    this.shortcutsEnabled = true;
  }

  public disableAllShortcuts() {
    console.log(`disable all shortcuts!`);
    this.shortcutsEnabled = false;
  }

  onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  openSegment(index: number) {
    // ignore
  }

  private loadEditor() {
    if (this.transcrService.currentlevel.segments.length > 0) {
      this.editor.segments = this.transcrService.currentlevel.segments;
    }
    this.editor.Settings.height = 100;
    this.editor.update();
    this.oldRaw = this.editor.rawText;
  }
}
