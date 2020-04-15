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

import {
  AlertService,
  AppStorageService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {BrowserInfo} from '../../core/shared';
import {Functions, isUnset} from '../../core/shared/Functions';
import {OCTRAEditor} from '../octra-editor';
import {AudioviewerConfig} from '../../media-components/components/audio/audio-viewer/audio-viewer.config';
import {AudioChunk, AudioManager} from '../../media-components/obj/audio/AudioManager';
import {AudioViewerComponent} from '../../media-components/components/audio/audio-viewer/audio-viewer.component';
import {AudioSelection} from '../../media-components/obj/audio';
import {AVMousePos} from '../../media-components/obj/audio/AVMousePos';

@Component({
  selector: 'app-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.css']
})
export class LinearEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get segmententer_shortc(): string {
    return (this.viewer.settings) ? this.viewer.settings.shortcuts.segment_enter.keys[this.platform] : '';
  }

  private oldRaw = '';

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

  public static editorname = 'Linear Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', {static: true}) viewer: AudioViewerComponent;
  @ViewChild('miniloupe', {static: false}) miniloupe: AudioViewerComponent;
  @ViewChild('loupe', {static: false}) loupe: AudioViewerComponent;
  @ViewChild('nav', {static: true}) nav: AudioNavigationComponent;
  @ViewChild('transcr', {static: true}) public editor: TranscrEditorComponent;
  public miniLoupeHidden = true;
  public segmentselected = false;
  public loupeSettings: AudioviewerConfig;
  public miniLoupeCoord: any = {
    component: 'viewer',
    x: 0,
    y: 0
  };
  public audioManager: AudioManager;
  public audioChunkTop: AudioChunk;
  public audioChunkDown: AudioChunk;
  public audioChunkLoupe: AudioChunk;
  private subscrManager: SubscriptionManager;
  private saving = false;
  private factor = 6;
  private mouseTimer = null;
  private platform = BrowserInfo.platform;
  private selectedIndex: number;
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

      this.save();
      setTimeout(() => {
        if (!isUnset(this.loupe)) {
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

    this.viewer.settings.shortcuts = this.keyMap.register('AV', this.viewer.settings.shortcuts);
    this.viewer.settings.multiLine = false;
    this.viewer.settings.lineheight = 80;
    this.viewer.settings.shortcutsEnabled = true;
    this.viewer.settings.boundaries.readonly = false;
    this.viewer.settings.justifySignalHeight = true;
    this.viewer.settings.roundValues = false;

    this.loupeSettings = new AudioviewerConfig();
    this.loupeSettings.shortcuts = this.keyMap.register('Loupe', this.loupeSettings.shortcuts);
    this.loupeSettings.shortcuts.play_pause.keys.mac = 'SHIFT + SPACE';
    this.loupeSettings.shortcuts.play_pause.keys.pc = 'SHIFT + SPACE';
    this.loupeSettings.shortcuts.play_pause.focusonly = false;
    this.loupeSettings.shortcuts.step_backwardtime = null;
    this.loupeSettings.shortcuts.step_backward.keys.mac = 'SHIFT + ENTER';
    this.loupeSettings.shortcuts.step_backward.keys.pc = 'SHIFT + ENTER';
    this.loupeSettings.justifySignalHeight = true;
    this.loupeSettings.roundValues = false;
    this.loupeSettings.boundaries.enabled = true;

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

    this.subscrManager.add(this.viewer.alerttriggered.subscribe(
      (result) => {
        this.alertService.showAlert(result.type, result.message);
      }
    ));

    /*
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(
      (obj) => {
        if (this.appStorage.showLoupe) {
          const event = obj.event;
          if (this.viewer.focused || (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused)) {
            if (event.key === '+') {
              this.factor = Math.min(12, this.factor + 1);
              this.miniloupe.zoomY = Math.max(1, this.factor);

              if (this.viewer.focused) {
                this.changeArea(this.audioChunkLoupe, this.viewer, this.miniLoupeCoord,
                  this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
              } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                this.changeArea(this.audioChunkLoupe, this.loupe.viewer, this.miniLoupeCoord,
                  this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
              }
            } else if (event.key === '-') {
              if (this.factor > 3) {
                this.factor = Math.max(1, this.factor - 1);
                this.miniloupe.zoomY = Math.max(4, this.factor);
                if (this.viewer.focused) {
                  this.changeArea(this.audioChunkLoupe, this.viewer, this.miniLoupeCoord,
                    this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
                } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                  this.changeArea(this.audioChunkLoupe, this.loupe.viewer, this.miniLoupeCoord,
                    this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
                }
              }
            }
          }
        }
      }
    ));
     */
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj.mini_loupe === null || obj.mini_loupe === undefined)) {
      if (obj.mini_loupe.isFirstChange() && this.appStorage.showLoupe) {
        this.miniloupe.settings.shortcutsEnabled = false;
        this.miniloupe.settings.boundaries.enabled = false;
        this.miniloupe.settings.lineheight = 160;
        this.miniloupe.settings.roundValues = false;
      }
    }
  }

  ngOnDestroy() {
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
        start: this.viewer.av.drawnSelection.start.samples,
        length: this.viewer.av.drawnSelection.duration.samples
      }, null, 'audio_buttons');

    switch (event.type) {
      case('play'):
        this.audioChunkTop.startPlayback();
        break;
      case('pause'):
        this.audioChunkTop.pausePlayback();
        break;
      case('stop'):
        this.audioChunkTop.stopPlayback();
        break;
      case('replay'):
        this.audioChunkTop.toggleReplay();
        break;
      case('backward'):
        this.audioChunkTop.stepBackward();
        break;
      case('backward time'):
        this.audioChunkTop.stepBackwardTime(0.5);
        break;
      case('default'):
        break;
    }
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    if (this.appStorage.showLoupe) {
      this.miniloupe.av.zoomY = this.factor;
    }

    this.subscrManager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    this.viewer.onInitialized.subscribe(
      () => {
      }, () => {
      },
      () => {
        LinearEditorComponent.initialized.emit();
      });
  }

  onSelectionChanged(selection: AudioSelection) {
    if (selection) {
      if (selection.length > 0) {
        selection.checkSelection();
        this.segmentselected = false;
        this.audioChunkDown.destroy();
        this.audioChunkDown = new AudioChunk(this.audioChunkTop.selection.clone(), this.audioManager);
      } else {
        this.audioChunkDown = null;
      }
    }
  }

  onAlertTriggered(result) {
    this.alertService.showAlert(result.type, result.message);
  }

  onSegmentChange() {
    // this.viewer.update();
    this.saving = false;
  }

  onMouseOver(cursor: AVMousePos) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }

    this.miniLoupeCoord.component = this.viewer;

    if (!this.audioManager.isPlaying && this.appStorage.playonhover) {
      // play audio
      /* this.audiochunkTop.selection.start = this.viewer.av.Mousecursor.timePos.clone();
      this.audiochunkTop.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audioManager.ressource.info.sampleRate / 10;
      this.audiochunkTop.startPlayback(() => {
      }, true);
       */
    }

    // const a = this.viewer.getLocation();
    this.miniLoupeCoord.y = this.viewer.settings.lineheight - 10;

    if (!isUnset(this.nav)) {
      // this.miniLoupeCoord.y += this.nav.height;
    }


    /*
    this.mouseTimer = window.setTimeout(() => {
    this.changeArea(this.audioChunkLoupe, this.viewer, this.miniLoupeCoord
    this.viewer.av.MouseClickPos.timePos.samples, this.viewer.avMpuseClickPos.relPos.x, this.factor);
  }, 20);
     */
  }

  onSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.viewer.selectSegment($event.index);
      this.audioChunkDown = new AudioChunk(selection, this.audioManager);
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
    });
  }

  onTranscriptionChanged($event) {
    this.save();
  }

  onShortCutTriggered($event, control, component: AudioViewerComponent) {
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

        let selection = {
          start: -1,
          length: 0
        };

        let playPosition = component.audioChunk.absolutePlayposition;

        selection.start = component.av.drawnSelection.start.samples;
        selection.length = component.av.drawnSelection.duration.samples;

        if (!component.audioChunk.isPlaying) {
          if ($event.type === 'boundary') {
            playPosition = component.av.MouseClickPos.timePos
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
      if (this.loupe.av.MouseClickPos.timePos.samples < startSamples
        || this.loupe.av.MouseClickPos.timePos.samples > endSamples) {
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

  onViewerMouseDown($event) {
    this.segmentselected = false;
  }

  onSpeedChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    // this.audiochunkTop.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
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

  onVolumeChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    this.audioChunkTop.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: {
    new_value: number, timestamp: number
  }) {
    if (this.appStorage.logging) {
      const segment = null;

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.samples;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.samples
          - annoSegment.time.samples
          : this.audioManager.ressource.info.duration.samples - annoSegment.time.samples;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audioManager.playposition,
        this.editor.caretpos, null, segment, 'audio_volume');
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEnter({index: segnumber});
  }

  public update() {
    /* if (!isNullOrUndefined(this.loupe)) {
      this.loupe.update();
    }
    if (!isNullOrUndefined(this.viewer)) {
      this.viewer.update();
    } */
    this.segmentselected = false;
    this.audioChunkTop.startpos = this.audioChunkTop.time.start.clone();
    this.audioChunkDown.startpos = this.audioChunkDown.time.start.clone();
  }

  private changeArea(audiochunk: AudioChunk, viewer: AudioViewerComponent, coord: any,
                     cursor: number, relX: number, factor: number = 4) {
    const range = ((viewer.audioChunk.time.duration.samples / this.audioManager.ressource.info.duration.samples)
      * this.audioManager.ressource.info.sampleRate) / factor;

    if (cursor && relX > -1) {
      coord.x = ((relX) ? relX - 80 : 0);
      const halfRate = Math.round(range);
      const start = (cursor > halfRate)
        ? this.audioManager.createSampleUnit(cursor - halfRate)
        : this.audioManager.createSampleUnit(0);
      const end = (cursor < this.audioManager.ressource.info.duration.samples - halfRate)
        ? this.audioManager.createSampleUnit(cursor + halfRate)
        : this.audioManager.ressource.info.duration.clone();

      this.audioChunkLoupe.destroy();
      this.audioChunkLoupe = new AudioChunk(new AudioSelection(start, end), this.audioManager);
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

  afterFirstInitialization() {
    const emptySegmentIndex = this.transcrService.currentlevel.segments.segments.findIndex((a) => {
      return a.transcript === '';
    });
    if (this.audioChunkTop.time.duration.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (this.transcrService.currentlevel.segments.length === 1) {
        this.openSegment(0);
      }
    }
  }

  onKeyUp() {
    this.appStorage.savingNeeded = true;
  }

  public enableAllShortcuts() {
    this.viewer.enableShortcuts();
    if (!isUnset(this.loupe)) {
      this.loupe.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.viewer.disableShortcuts();
    if (!isUnset(this.loupe)) {
      this.loupe.disableShortcuts();
    }
  }
}
