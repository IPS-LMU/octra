import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';
import {BrowserInfo} from '../../core/shared';

import {
  AlertService,
  AudioService,
  KeymappingService,
  KeyMappingShortcutEvent,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {OCTRAEditor} from '../octra-editor';
import {
  AudioNavigationComponent,
  AudioViewerComponent,
  AudioviewerConfig,
  AudioViewerShortcutEvent
} from '@octra/components';
import {AudioChunk, AudioManager} from '../../../../../../libs/media/src/lib/audio/audio-manager';
import {AudioSelection, SampleUnit} from '@octra/media';

@Component({
  selector: 'octra-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.css']
})
export class LinearEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  public static editorname = 'Linear Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('signalDisplayTop', {static: true}) signalDisplayTop: AudioViewerComponent;
  @ViewChild('miniloupeComponent', {static: false}) miniloupeComponent: AudioViewerComponent;
  @ViewChild('signalDisplayDown', {static: false}) signalDisplayDown: AudioViewerComponent;
  @ViewChild('nav', {static: true}) nav: AudioNavigationComponent;
  @ViewChild('transcr', {static: true}) public editor: TranscrEditorComponent;
  public segmentselected = false;
  public loupeSettings: AudioviewerConfig;
  public miniloupe = {
    component: null,
    isHidden: true,
    size: {
      width: 160,
      height: 160
    },
    location: {
      x: 0,
      y: 0
    }
  };
  public audioManager: AudioManager;
  public audioChunkTop: AudioChunk;
  public audioChunkDown: AudioChunk;
  public audioChunkLoupe: AudioChunk;

  public selectedAudioChunk: AudioChunk;

  private oldRaw = '';
  private subscrManager: SubscriptionManager;
  private saving = false;
  private factor = 6;
  private mouseTimer = null;
  private platform = BrowserInfo.platform;
  private selectedIndex: number;

  private mousestate = 'initiliazied';

  private audioShortcutsTopDisplay = {
    play_pause: {
      keys: {
        mac: 'TAB',
        pc: 'TAB'
      },
      title: 'play pause',
      focusonly: false
    },
    stop: {
      keys: {
        mac: 'ESC',
        pc: 'ESC'
      },
      title: 'stop playback',
      focusonly: false
    },
    step_backward: {
      keys: {
        mac: 'SHIFT + BACKSPACE',
        pc: 'SHIFT + BACKSPACE'
      },
      title: 'step backward',
      focusonly: false
    },
    step_backwardtime: {
      keys: {
        mac: 'SHIFT + TAB',
        pc: 'SHIFT + TAB'
      },
      title: 'step backward time',
      focusonly: false
    }
  };

  private audioShortcutsBottomDisplay = {
    play_pause: {
      keys: {
        mac: 'SHIFT + SPACE',
        pc: 'SHIFT + SPACE'
      },
      title: 'play pause',
      focusonly: false
    },
    stop: {
      keys: {
        mac: 'ESC',
        pc: 'ESC'
      },
      title: 'stop playback',
      focusonly: false
    },
    step_backward: {
      keys: {
        mac: 'SHIFT + ENTER',
        pc: 'SHIFT + ENTER'
      },
      title: 'step backward',
      focusonly: false
    },
    step_backwardtime: {
      keys: {
        mac: 'SHIFT + ´',
        pc: 'SHIFT + ´'
      },
      title: 'step backward time',
      focusonly: false
    }
  };

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get segmententer_shortc(): string {
    return (this.signalDisplayTop.settings) ? this.signalDisplayTop.settings.shortcuts.segment_enter.keys[this.platform] : '';
  }

  private _miniLoupeSettings: AudioviewerConfig;

  get miniLoupeSettings(): AudioviewerConfig {
    return this._miniLoupeSettings;
  }

  private shortcutsEnabled = true;

  constructor(public audio: AudioService,
              public alertService: AlertService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public cd: ChangeDetectorRef,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
    super();
    this.subscrManager = new SubscriptionManager();

    if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
      this.subscrManager.add(this.keyMap.beforeKeyDown.subscribe((event) => {
        if (event.comboKey === 'ALT + SHIFT + 1' ||
          event.comboKey === 'ALT + SHIFT + 2' ||
          event.comboKey === 'ALT + SHIFT + 3') {

          this.transcrService.tasksBeforeSend.push(new Promise<void>((resolve) => {
            if (!isUnset(this.audioChunkDown) && this.segmentselected && this.selectedIndex > -1) {
              this.editor.updateRawText();
              this.save();
              resolve();
            } else {
              resolve();
            }
          }));
        }
      }));
    }
  }

  /**
   * hits when user is typing something in the editor
   */
  onEditorTyping = (status: string) => {
    // this.viewer.focused = false;
    // this.loupe.viewer.focused = false;

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
      setTimeout(() => {
        if (!isUnset(this.signalDisplayDown)) {
          // this.loupe.update(false);
        } else {
          console.error(`can't update loupe after typing because it's undefined!`);
        }
      }, 200);

      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.saving.emit('success');
      }
    }
  }

  ngOnInit() {
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkTop = this.audioManager.mainchunk.clone();
    this.audioChunkLoupe = this.audioManager.mainchunk.clone();
    this.selectedAudioChunk = this.audioChunkTop;

    this.keyMap.register('AV', {...this.audioShortcutsTopDisplay, ...this.signalDisplayTop.settings.shortcuts});
    this.signalDisplayTop.settings.shortcutsEnabled = true;
    this.signalDisplayTop.settings.boundaries.enabled = true;
    this.signalDisplayTop.settings.boundaries.readonly = false;
    this.signalDisplayTop.settings.justifySignalHeight = true;
    this.signalDisplayTop.settings.roundValues = false;
    this.signalDisplayTop.settings.showTimePerLine = true;
    this.signalDisplayTop.settings.margin.top = 5;

    this.loupeSettings = new AudioviewerConfig();
    this.keyMap.register('Loupe', {...this.audioShortcutsBottomDisplay, ...this.loupeSettings.shortcuts});
    this.loupeSettings.justifySignalHeight = true;
    this.loupeSettings.roundValues = false;
    this.loupeSettings.boundaries.enabled = true;
    this.loupeSettings.showTimePerLine = true;
    this.loupeSettings.margin.top = 5;

    // set settings for mini loupe
    this._miniLoupeSettings = new AudioviewerConfig();
    this._miniLoupeSettings.roundValues = false;
    this._miniLoupeSettings.shortcutsEnabled = false;
    this._miniLoupeSettings.selection.enabled = false;
    this._miniLoupeSettings.boundaries.readonly = true;
    this._miniLoupeSettings.asr.enabled = false;
    this._miniLoupeSettings.cropping = 'circle';
    this._miniLoupeSettings.cursor.fixed = true;
    this._miniLoupeSettings.lineheight = 160;

    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.disabledKeys.push('SHIFT + SPACE');

    this.subscrManager.add(this.transcrService.currentlevel.segments.onsegmentchange.subscribe(
      ($event) => {
        if (!this.saving) {
          setTimeout(() => {
            this.saving = true;
            this.onSegmentChange();
          }, 1000);
        }
      }
    ));

    this.subscrManager.add(this.signalDisplayTop.alerttriggered.subscribe(
      (result) => {
        this.alertService.showAlert(result.type, result.message).catch((error) => {
          console.error(error);
        });
      }
    ));

    this.subscrManager.add(this.keyMap.onkeydown.subscribe(this.onShortcutTriggered), 'shortcut');

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj.mini_loupe === null || obj.mini_loupe === undefined)) {
      if (obj.mini_loupe.isFirstChange() && this.appStorage.showLoupe) {
      }
    }
  }

  ngOnDestroy() {
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });
    this.subscrManager.destroy();
    this.keyMap.unregister('AV');
    this.keyMap.unregister('Loupe');
  }

  onButtonClick(event: {
    type: string, timestamp: number
  }) {
    // only top signal display
    const caretpos = this.editor.caretpos;
    this.uiService.addElementFromEvent('mouseclick', {value: event.type},
      event.timestamp, this.audioManager.playposition, caretpos, {
        start: this.signalDisplayTop.av.drawnSelection.start.samples,
        length: this.signalDisplayTop.av.drawnSelection.duration.samples
      }, null, 'audio_buttons');
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    if (this.appStorage.showLoupe) {
      this.miniloupeComponent.av.zoomY = this.factor;
    }

    this.subscrManager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    const subscr = this.signalDisplayTop.onInitialized.subscribe(
      () => {
        LinearEditorComponent.initialized.emit();
        subscr.unsubscribe();
      }, () => {
      },
      () => {
      });
  }

  onSelectionChanged(selection: AudioSelection) {
    if (selection) {
      if (selection.length > 0) {
        selection.checkSelection();
        this.segmentselected = false;
        if (!isUnset(this.audioChunkDown)) {
          this.audioChunkDown.destroy();
        }
        this.audioChunkDown = new AudioChunk(this.audioChunkTop.selection.clone(), this.audioManager);
      } else {
        this.audioChunkDown = null;
        this.selectedAudioChunk = this.audioChunkTop;
      }
    }
  }

  onAlertTriggered(result) {
    this.alertService.showAlert(result.type, result.message).catch((error) => {
      console.error(error);
    });
  }

  onSegmentChange() {
    this.saving = false;
  }

  onMouseOver($event: {
    event: MouseEvent | null, time: SampleUnit
  }) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }

    this.miniloupe.component = this.signalDisplayTop;

    this.doPlayOnHover(this.audioManager, this.appStorage.playonhover, this.audioChunkTop, this.signalDisplayTop.av.mouseCursor);

    if (this.appStorage.showLoupe) {
      this.miniloupe.isHidden = false;
      this.mouseTimer = window.setTimeout(() => {
        this.changeLoupePosition($event.event, $event.time);
        this.mousestate = 'ended';
      }, 20);
    }
  }

  onSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audioChunkDown = new AudioChunk(selection, this.audioManager);
      this.editor.focus(true);
    });

    if (this.appStorage.logging) {
      const start = ($event.index > 0) ? this.transcrService.currentlevel.segments.get($event.index - 1).time.samples : 0;
      this.uiService.addElementFromEvent('segment', {
        value: 'entered'
      }, Date.now(), this.audioManager.playposition, -1, null, {
        start,
        length: this.transcrService.currentlevel.segments.get($event.index).time.samples - start
      }, LinearEditorComponent.editorname);
    }
  }

  onLoupeSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audioChunkDown.selection = selection.clone();
      this.audioChunkDown.absolutePlayposition = selection.start.clone();
      this.editor.focus(true);
    });
  }

  onTranscriptionChanged($event) {
    this.save();
  }

  onViewerShortcutTriggered($event: AudioViewerShortcutEvent, control: string) {
    this.triggerUIActionAfterShortcut($event, control);
  }

  onShortcutTriggered = ($event: KeyMappingShortcutEvent) => {
    if (this.shortcutsEnabled) {
      const comboKey = $event.comboKey;

      const platform = BrowserInfo.platform;
      if (!isUnset(this.audioShortcutsTopDisplay) && !isUnset(this.audioShortcutsBottomDisplay)) {
        const shortcuts = {
          signaldisplay_top: this.audioShortcutsTopDisplay,
          signaldisplay_down: this.audioShortcutsBottomDisplay
        };

        let keyActive = false;
        let a = 0;

        for (const displayType in shortcuts) {
          if (shortcuts.hasOwnProperty(displayType) && !isUnset(shortcuts[displayType])) {
            for (const shortcut in shortcuts['' + displayType]) {
              if (shortcuts['' + displayType].hasOwnProperty(shortcut)) {
                const currentShortcut = shortcuts['' + displayType]['' + shortcut + ''];
                const currentAudioChunk = (displayType === 'signaldisplay_top') ? this.audioChunkTop : this.audioChunkDown;
                a++;
                if (!isUnset(currentAudioChunk) && currentShortcut.keys['' + platform + ''] === comboKey) {
                  switch (shortcut) {
                    case('play_pause'):
                      this.selectedAudioChunk = currentAudioChunk;
                      this.triggerUIActionAfterShortcut({shortcut: comboKey, value: shortcut}, displayType);
                      if (currentAudioChunk.isPlaying) {
                        currentAudioChunk.pausePlayback().catch((error) => {
                          console.error(error);
                        });
                      } else {
                        currentAudioChunk.startPlayback(false).catch((error) => {
                          console.error(error);
                        });
                      }
                      keyActive = true;
                      break;
                    case('stop'):
                      this.selectedAudioChunk = currentAudioChunk;
                      this.triggerUIActionAfterShortcut({shortcut: comboKey, value: shortcut}, displayType);
                      currentAudioChunk.stopPlayback().catch((error) => {
                        console.error(error);
                      });
                      keyActive = true;
                      break;
                    case('step_backward'):
                      this.selectedAudioChunk = currentAudioChunk;
                      console.log(`step backward`);
                      this.triggerUIActionAfterShortcut({shortcut: comboKey, value: shortcut}, displayType);
                      currentAudioChunk.stepBackward().catch((error) => {
                        console.error(error);
                      });
                      keyActive = true;
                      break;
                    case('step_backwardtime'):
                      this.selectedAudioChunk = currentAudioChunk;
                      console.log(`step backward time`);
                      this.triggerUIActionAfterShortcut({shortcut: comboKey, value: shortcut}, displayType);
                      currentAudioChunk.stepBackwardTime(0.5).catch((error) => {
                        console.error(error);
                      });
                      keyActive = true;
                      break;
                  }
                }

                if (keyActive) {
                  break;
                }
              }
            }
          }
        }

        if (this.appStorage.showLoupe) {
          const event = $event.event;
          if (!isUnset(this.miniloupe) && this.signalDisplayTop.focused) {
            if (event.key === '+' || event.key === '-') {
              if (event.key === '+') {
                keyActive = true;
                this.factor = Math.min(12, this.factor + 1);
                this.miniloupeComponent.av.zoomY = Math.max(1, this.factor);
              } else if (event.key === '-') {
                if (this.factor > 3) {
                  keyActive = true;
                  this.factor = Math.max(1, this.factor - 1);
                  this.miniloupeComponent.av.zoomY = Math.max(4, this.factor);
                }
              }

              this.changeArea(this.miniloupeComponent, this.signalDisplayTop, this.audioManager, this.audioChunkLoupe,
                this.signalDisplayTop.av.mouseCursor, this.factor)
                .then((newLoupeChunk) => {
                  if (!isUnset(newLoupeChunk)) {
                    this.audioChunkLoupe = newLoupeChunk;
                  }
                });
            }
          }
        }

        if (keyActive) {
          $event.event.preventDefault();
        }
      }
    }
  }

  private triggerUIActionAfterShortcut($event, control: string) {
    const component: AudioViewerComponent = (control === 'signaldisplay_top') ? this.signalDisplayTop : this.signalDisplayDown;
    if (this.appStorage.logging) {
      if (
        $event.value === null || !(
          // cursor move by keyboard events are note saved because this would be too much
          Functions.contains($event.value, 'cursor') ||
          // disable logging for user test phase, because it would be too much
          Functions.contains($event.value, 'segment_enter') ||
          Functions.contains($event.value, 'playonhover')
        )
      ) {
        const caretpos = this.editor.caretpos;
        $event.value = $event.type + ':' + $event.value;

        let segment = null;

        if (this.segmentselected && this.selectedIndex > -1) {
          const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
          segment = {
            start: annoSegment.time.samples,
            length: (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
              ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
              - annoSegment.time.samples
              : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples
          };
        }

        const selection = {
          start: -1,
          length: 0
        };

        let playPosition = component.audioChunk.absolutePlayposition;

        selection.start = component.av.drawnSelection.start.samples;
        selection.length = component.av.drawnSelection.duration.samples;

        if (!component.audioChunk.isPlaying) {
          if ($event.type === 'boundary') {
            playPosition = component.av.MouseClickPos;
          }
        }

        this.uiService.addElementFromEvent('shortcut', $event, Date.now(), playPosition, caretpos, selection, segment, control);
      } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
        this.appStorage.playonhover = !this.appStorage.playonhover;
      }
    }
  }

  onLoupeClick(event) {
    if (this.selectedIndex > -1) {
      const endSamples = this.transcrService.currentlevel.segments.get(this.selectedIndex).time.samples;
      let startSamples = 0;
      if (this.selectedIndex > 0) {
        startSamples = this.transcrService.currentlevel.segments.get(this.selectedIndex - 1).time.samples;
      }
      if (this.signalDisplayDown.av.MouseClickPos.samples < startSamples
        || this.signalDisplayDown.av.MouseClickPos.samples > endSamples) {
        this.segmentselected = false;
      }
    }
  }

  onMarkerInsert(markerCode: string) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.samples;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
          - annoSegment.time.samples
          : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples;
      }

      this.uiService.addElementFromEvent('shortcut', {value: markerCode}, Date.now(), this.audioManager.playposition,
        this.editor.caretpos, null, segment, 'texteditor_markers');
    }
  }

  onMarkerClick(markerCode: string) {
    this.onTranscriptionChanged(null);
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.samples;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
          - annoSegment.time.samples
          : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples;
      }

      this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(), this.audioManager.playposition,
        this.editor.caretpos, null, segment, 'texteditor_toolbar');
    }
  }

  public changeLoupePosition(mouseEvent: MouseEvent, cursorTime: SampleUnit) {
    const x = mouseEvent.offsetX - ((this.miniloupe.size.width - 10) / 2) - 2;

    // loupe is fully visible
    this.miniloupe.location.y = mouseEvent.offsetY + 60;
    this.miniloupe.location.x = x;

    this.changeArea(this.miniloupeComponent, this.signalDisplayTop, this.audioManager, this.audioChunkLoupe, cursorTime, this.factor)
      .then((newLoupeChunk) => {
        if (!isUnset(newLoupeChunk)) {
          this.audioChunkLoupe = newLoupeChunk;
        }
      });
    this.cd.detectChanges();
  }

  onViewerMouseDown($event) {
    this.segmentselected = false;
  }

  afterSpeedChange(event: {
    new_value: number, timestamp: number
  }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.samples;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
          - annoSegment.time.samples
          : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audioManager.playposition,
        this.editor.caretpos, null, segment, 'audio_speed');
    }
  }

  afterVolumeChange(event: {
    new_value: number, timestamp: number
  }) {
    if (this.appStorage.logging) {
      let segment = null;

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment = {
          start: annoSegment.time.samples,
          length: (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
            ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
            - annoSegment.time.samples
            : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples
        };
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audioManager.playposition,
        this.editor.caretpos, null, segment, 'audio_volume');
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEnter({index: segnumber});
  }

  public update() {
    this.segmentselected = false;
    this.audioChunkTop.startpos = this.audioChunkTop.time.start.clone();
    this.audioChunkDown.startpos = this.audioChunkDown.time.start.clone();
  }

  afterFirstInitialization() {
    this.checkIfSmallAudioChunk(this.audioChunkTop, this.transcrService.currentlevel);
  }

  onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  public enableAllShortcuts() {
    this.signalDisplayTop.enableShortcuts();
    if (!isUnset(this.signalDisplayDown)) {
      this.signalDisplayDown.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.signalDisplayTop.disableShortcuts();
    if (!isUnset(this.signalDisplayDown)) {
      this.signalDisplayDown.disableShortcuts();
    }
  }

  private selectSegment(index: number): Promise<AudioSelection> {
    return new Promise<AudioSelection>(
      (resolve) => {
        const segment = this.transcrService.currentlevel.segments.get(index);
        this.editor.rawText = segment.transcript;
        this.selectedIndex = index;
        this.segmentselected = true;
        let start = this.audioManager.createSampleUnit(0);
        if (index > 0) {
          start = this.transcrService.currentlevel.segments.get(index - 1).time;
        }
        resolve(new AudioSelection(start, segment.time));
      }
    );
  }

  private save() {
    if (this.segmentselected) {
      if (this.selectedIndex > -1 && this.transcrService.currentlevel.segments &&
        this.selectedIndex < this.transcrService.currentlevel.segments.length) {
        const segment = this.transcrService.currentlevel.segments.get(this.selectedIndex).clone();
        // this.viewer.focused = false;
        // this.loupe.viewer.focused = false;
        segment.transcript = this.editor.rawText;
        this.transcrService.currentlevel.segments.change(this.selectedIndex, segment);
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    }
  }
}
