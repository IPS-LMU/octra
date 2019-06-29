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
  AppStorageService,
  AudioService,
  KeymappingService,
  MessageService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AudioChunk, AudioSelection, BrowserAudioTime} from '../../media-components/obj/media/audio';
import {AudioviewerComponent, AudioviewerConfig} from '../../media-components/components/audio/audioviewer';
import {CircleLoupeComponent} from '../../media-components/components/audio/circleloupe';
import {LoupeComponent} from '../../media-components/components/audio/loupe';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {BrowserInfo} from '../../core/shared';
import {AVMousePos} from '../../media-components/obj';
import {AudioManager} from '../../media-components/obj/media/audio/AudioManager';
import {Functions, isNullOrUndefined} from '../../core/shared/Functions';
import {OCTRAEditor} from '../octra-editor';

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
    return (this.viewer.Settings) ? this.viewer.Settings.shortcuts.segment_enter.keys[this.platform] : '';
  }

  constructor(public audio: AudioService,
              public msg: MessageService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public cd: ChangeDetectorRef,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
    super();
    this.subscrmanager = new SubscriptionManager();
  }

  public static editorname = 'Linear Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', {static: true}) viewer: AudioviewerComponent;
  @ViewChild('miniloupe', {static: false}) miniloupe: CircleLoupeComponent;
  @ViewChild('loupe', {static: false}) loupe: LoupeComponent;
  @ViewChild('nav', {static: true}) nav: AudioNavigationComponent;
  @ViewChild('transcr', {static: true}) public editor: TranscrEditorComponent;
  public miniLoupeHidden = true;
  public segmentselected = false;
  public topSelected = false;
  public loupeSettings: AudioviewerConfig;
  public miniLoupeCoord: any = {
    component: 'viewer',
    x: 0,
    y: 0
  };
  public audiomanager: AudioManager;
  public audiochunkTop: AudioChunk;
  public audiochunkDown: AudioChunk;
  public audioChunkLoupe: AudioChunk;
  private subscrmanager: SubscriptionManager;
  private saving = false;
  private factor = 6;
  private mouseTimer = null;
  private platform = BrowserInfo.platform;
  private selectedIndex: number;
  /**
   * hits when user is typing something in the editor
   */
  onEditorTyping = (status: string) => {
    this.viewer.focused = false;
    this.loupe.viewer.focused = false;
    if (status === 'stopped') {
      this.save();
      setTimeout(() => {
        this.loupe.update(false);
      }, 200);
    }
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audiochunkTop = this.audiomanager.mainchunk.clone();
    this.audiochunkDown = this.audiomanager.mainchunk.clone();
    this.audioChunkLoupe = this.audiomanager.mainchunk.clone();

    this.viewer.Settings.shortcuts = this.keyMap.register('AV', this.viewer.Settings.shortcuts);
    this.viewer.Settings.multiLine = false;
    this.viewer.Settings.lineheight = 80;
    this.viewer.Settings.shortcutsEnabled = true;
    this.viewer.Settings.boundaries.readonly = false;
    this.viewer.Settings.justifySignalHeight = true;
    this.viewer.Settings.roundValues = false;

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

    this.subscrmanager.add(this.transcrService.currentlevel.segments.onsegmentchange.subscribe(
      ($event) => {
        if (!this.saving) {
          setTimeout(() => {
            this.saving = true;
            this.onSegmentChange();
          }, 1000);
        }
      }
    ));

    this.subscrmanager.add(this.viewer.alerttriggered.subscribe(
      (result) => {
        this.msg.showMessage(result.type, result.message);
      }
    ));

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
                  this.viewer.MouseCursor.timePos.browserSample.value, this.viewer.MouseCursor.relPos.x, this.factor);
              } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                this.changeArea(this.audioChunkLoupe, this.loupe.viewer, this.miniLoupeCoord,
                  this.viewer.MouseCursor.timePos.browserSample.value, this.loupe.MouseCursor.relPos.x, this.factor);
              }
            } else if (event.key === '-') {
              if (this.factor > 3) {
                this.factor = Math.max(1, this.factor - 1);
                this.miniloupe.zoomY = Math.max(4, this.factor);
                if (this.viewer.focused) {
                  this.changeArea(this.audioChunkLoupe, this.viewer, this.miniLoupeCoord,
                    this.viewer.MouseCursor.timePos.browserSample.value, this.viewer.MouseCursor.relPos.x, this.factor);
                } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                  this.changeArea(this.audioChunkLoupe, this.loupe.viewer, this.miniLoupeCoord,
                    this.viewer.MouseCursor.timePos.browserSample.value, this.loupe.MouseCursor.relPos.x, this.factor);
                }
              }
            }
          }
        }
      }
    ));
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj.mini_loupe === null || obj.mini_loupe === undefined)) {
      if (obj.mini_loupe.isFirstChange() && this.appStorage.showLoupe) {
        this.miniloupe.Settings.shortcutsEnabled = false;
        this.miniloupe.Settings.boundaries.enabled = false;
        this.miniloupe.Settings.height = 160;
        this.miniloupe.loupe.viewer.roundValues = false;
      }
    }
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
    this.keyMap.unregister('AV');
    this.keyMap.unregister('Loupe');
  }

  onButtonClick(event: {
    type: string, timestamp: number
  }) {
    const caretpos = this.editor.caretpos;
    this.uiService.addElementFromEvent('mouseclick', {value: event.type},
      event.timestamp, this.audiomanager.playposition, caretpos, 'audio_buttons');

    switch (event.type) {
      case('play'):
        this.viewer.startPlayback();
        break;
      case('pause'):
        this.viewer.pausePlayback(() => {
        });
        break;
      case('stop'):
        this.viewer.stopPlayback(() => {
        });
        break;
      case('replay'):
        this.viewer.rePlayback();
        this.nav.replay = this.viewer.audiochunk.replay;
        break;
      case('backward'):
        this.viewer.stepBackward(() => {
        });
        break;
      case('backward time'):
        this.viewer.stepBackwardTime(() => {
        }, 0.5);
        break;
      case('default'):
        break;
    }
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    if (this.appStorage.showLoupe) {
      this.miniloupe.zoomY = this.factor;
    }

    this.subscrmanager.add(
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
        this.audiochunkDown.destroy();
        this.audiochunkDown = new AudioChunk(this.audiochunkTop.selection.clone(), this.audiomanager);
        this.topSelected = true;
      } else {
        this.topSelected = false;
      }
    }
  }

  onAlertTriggered(result) {
    this.msg.showMessage(result.type, result.message);
  }

  onSegmentChange() {
    this.viewer.update();
    this.saving = false;
  }

  onMouseOver(cursor: AVMousePos) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }

    this.miniLoupeCoord.component = this.viewer;

    if (!this.audiomanager.isPlaying && this.appStorage.playonhover) {
      // play audio
      this.audiochunkTop.selection.start = this.viewer.av.Mousecursor.timePos.clone();
      this.audiochunkTop.selection.end.browserSample.value = this.viewer.av.Mousecursor.timePos.browserSample.value +
        this.audiomanager.ressource.info.samplerate / 10;
      this.audiochunkTop.startPlayback(() => {
      }, true);
    }

    const a = this.viewer.getLocation();
    this.miniLoupeCoord.y = this.viewer.Settings.lineheight - 10;

    if (!isNullOrUndefined(this.nav)) {
      this.miniLoupeCoord.y += this.nav.height;
    }

    this.mouseTimer = window.setTimeout(() => {
      this.changeArea(this.audioChunkLoupe, this.viewer, this.miniLoupeCoord,
        this.viewer.MouseCursor.timePos.browserSample.value, this.viewer.MouseCursor.relPos.x, this.factor);
    }, 20);
  }

  onSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.topSelected = true;
      this.audiochunkDown = new AudioChunk(selection, this.audiomanager);
    });
  }

  onLoupeSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audiochunkDown.selection = selection.clone();
      this.audiochunkDown.playposition = selection.start.clone() as BrowserAudioTime;
      this.loupe.viewer.drawPlayCursor();
    });
  }

  onTranscriptionChanged($event) {
    this.save();
  }

  onShortCutTriggered($event, control) {
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

        const segment = {
          start: -1,
          length: -1,
          textlength: -1
        };

        if (this.segmentselected && this.selectedIndex > -1) {
          const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
          segment.start = annoSegment.time.originalSample.value;
          segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
            ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
            - annoSegment.time.originalSample.value
            : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

          segment.textlength = annoSegment.transcript.length;
        }

        this.uiService.addElementFromEvent('shortcut', $event, Date.now(), this.audiomanager.playposition, caretpos, control, segment);
      } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
        this.appStorage.playonhover = !this.appStorage.playonhover;
      }
    }
  }

  onLoupeClick(event) {
    if (this.selectedIndex > -1) {
      const endSamples = this.transcrService.currentlevel.segments.get(this.selectedIndex).time.browserSample.value;
      let startSamples = 0;
      if (this.selectedIndex > 0) {
        startSamples = this.transcrService.currentlevel.segments.get(this.selectedIndex - 1).time.browserSample.value;
      }
      if (this.loupe.viewer.MouseCursor.timePos.browserSample.value < startSamples
        || this.loupe.viewer.MouseCursor.timePos.browserSample.value > endSamples) {
        this.segmentselected = false;
      }
    }
  }

  onMarkerInsert(markerCode: string) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      this.uiService.addElementFromEvent('shortcut', {value: markerCode}, Date.now(), this.audiomanager.playposition,
        this.editor.caretpos, 'texteditor_markers', segment);
    }
  }

  onMarkerClick(markerCode: string) {
    this.onTranscriptionChanged(null);
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(), this.audiomanager.playposition,
        this.editor.caretpos, 'texteditor_toolbar', segment);
    }
  }

  onViewerMouseDown($event) {
    this.segmentselected = false;
  }

  onSpeedChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    this.audiochunkTop.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  afterSpeedChange(event: {
    new_value: number, timestamp: number
  }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audiomanager.playposition,
        this.editor.caretpos, 'audio_speed', segment);
    }
  }

  onVolumeChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    this.audiochunkTop.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: {
    new_value: number, timestamp: number
  }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selectedIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audiomanager.playposition,
        this.editor.caretpos, 'audio_volume', segment);
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEnter({index: segnumber});
  }

  public update() {
    this.loupe.update();
    this.viewer.update();
    this.segmentselected = false;
    this.audiochunkTop.startpos = this.audiochunkTop.time.start as BrowserAudioTime;
    this.audiochunkDown.startpos = this.audiochunkDown.time.start as BrowserAudioTime;
  }

  private changeArea(audiochunk: AudioChunk, viewer: AudioviewerComponent, coord: any,
                     cursor: number, relX: number, factor: number = 4) {
    const range = ((viewer.Chunk.time.duration.browserSample.value / this.audiomanager.ressource.info.duration.browserSample.value)
      * this.audiomanager.ressource.info.samplerate) / factor;

    if (cursor && relX > -1) {
      coord.x = ((relX) ? relX - 80 : 0);
      const halfRate = Math.round(range);
      const start = (cursor > halfRate)
        ? this.audiomanager.createBrowserAudioTime(cursor - halfRate)
        : this.audiomanager.createBrowserAudioTime(0);
      const end = (cursor < this.audiomanager.ressource.info.duration.browserSample.value - halfRate)
        ? this.audiomanager.createBrowserAudioTime(cursor + halfRate)
        : this.audiomanager.ressource.info.duration.clone();

      this.audioChunkLoupe.destroy();
      this.audioChunkLoupe = new AudioChunk(new AudioSelection(start, end), this.audiomanager);
    }
  }

  private selectSegment(index: number): Promise<AudioSelection> {
    return new Promise<AudioSelection>(
      (resolve) => {
        const segment = this.transcrService.currentlevel.segments.get(index);
        this.editor.rawText = segment.transcript;
        this.selectedIndex = index;
        this.segmentselected = true;
        let start = this.audiomanager.createBrowserAudioTime(0);
        if (index > 0) {
          start = this.transcrService.currentlevel.segments.get(index - 1).time as BrowserAudioTime;
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
        this.viewer.focused = false;
        this.loupe.viewer.focused = false;
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
    if (this.audiochunkTop.time.duration.browserSample.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (this.transcrService.currentlevel.segments.length === 1) {
        this.openSegment(0);
      }
    }
  }
}
