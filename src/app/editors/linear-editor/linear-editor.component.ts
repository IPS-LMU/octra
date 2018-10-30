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
import {AudioChunk, AudioSelection, AudioTime} from '../../media-components/obj/media/audio';
import {AudioviewerComponent, AudioviewerConfig} from '../../media-components/components/audio/audioviewer';
import {CircleLoupeComponent} from '../../media-components/components/audio/circleloupe';
import {LoupeComponent} from '../../media-components/components/audio/loupe';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {BrowserInfo} from '../../core/shared';
import {AVMousePos} from '../../media-components/obj';
import {AudioManager} from '../../media-components/obj/media/audio/AudioManager';
import {Functions} from '../../core/shared/Functions';

@Component({
  selector: 'app-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.css']
})
export class LinearEditorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  public get app_settings(): any {
    return this.settingsService.app_settings;
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
    this.subscrmanager = new SubscriptionManager();
  }

  public static editorname = 'Linear Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('miniloupe') miniloupe: CircleLoupeComponent;
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('nav') nav: AudioNavigationComponent;
  @ViewChild('transcr') public editor: TranscrEditorComponent;
  public miniloupe_hidden = true;
  public segmentselected = false;
  public top_selected = false;
  public loupe_settings: AudioviewerConfig;
  public mini_loupecoord: any = {
    component: 'viewer',
    x: 0,
    y: 0
  };
  public audiomanager: AudioManager;
  public audiochunk_top: AudioChunk;
  public audiochunk_down: AudioChunk;
  public audiochunk_loupe: AudioChunk;
  private subscrmanager: SubscriptionManager;
  private saving = false;
  private factor = 6;
  private mouseTimer = null;
  private platform = BrowserInfo.platform;
  private selected_index: number;
  /**
   * hits when user is typing something in the editor
   * @param status
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
    this.audiochunk_top = this.audiomanager.mainchunk.clone();
    this.audiochunk_down = this.audiomanager.mainchunk.clone();
    this.audiochunk_loupe = this.audiomanager.mainchunk.clone();

    this.viewer.Settings.shortcuts = this.keyMap.register('AV', this.viewer.Settings.shortcuts);
    this.viewer.Settings.multi_line = false;
    this.viewer.Settings.lineheight = 80;
    this.viewer.Settings.shortcuts_enabled = true;
    this.viewer.Settings.boundaries.readonly = false;
    this.viewer.Settings.justify_signal_height = true;
    this.viewer.Settings.round_values = false;

    this.loupe_settings = new AudioviewerConfig();
    this.loupe_settings.shortcuts = this.keyMap.register('Loupe', this.loupe_settings.shortcuts);
    this.loupe_settings.shortcuts.play_pause.keys.mac = 'SHIFT + SPACE';
    this.loupe_settings.shortcuts.play_pause.keys.pc = 'SHIFT + SPACE';
    this.loupe_settings.shortcuts.play_pause.focusonly = false;
    this.loupe_settings.shortcuts.step_backwardtime = null;
    this.loupe_settings.shortcuts.step_backward.keys.mac = 'SHIFT + ENTER';
    this.loupe_settings.shortcuts.step_backward.keys.pc = 'SHIFT + ENTER';
    this.loupe_settings.justify_signal_height = true;
    this.loupe_settings.round_values = false;

    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.disabled_keys.push('SHIFT + SPACE');

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
        if (this.appStorage.show_loupe) {
          const event = obj.event;
          if (this.viewer.focused || (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused)) {
            if (event.key === '+') {
              this.factor = Math.min(12, this.factor + 1);
              this.miniloupe.zoomY = Math.max(1, this.factor);

              if (this.viewer.focused) {
                this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
                  this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
              } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                this.changeArea(this.audiochunk_loupe, this.loupe.viewer, this.mini_loupecoord,
                  this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
              }
            } else if (event.key === '-') {
              if (this.factor > 3) {
                this.factor = Math.max(1, this.factor - 1);
                this.miniloupe.zoomY = Math.max(4, this.factor);
                if (this.viewer.focused) {
                  this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
                    this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
                } else if (!(this.loupe === null || this.loupe === undefined) && this.loupe.focused) {
                  this.changeArea(this.audiochunk_loupe, this.loupe.viewer, this.mini_loupecoord,
                    this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
                }
              }
            }
          }
        }
      }
    ));
    LinearEditorComponent.initialized.emit();
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj.mini_loupe === null || obj.mini_loupe === undefined)) {
      if (obj.mini_loupe.isFirstChange() && this.appStorage.show_loupe) {
        this.miniloupe.Settings.shortcuts_enabled = false;
        this.miniloupe.Settings.boundaries.enabled = false;
        this.miniloupe.Settings.height = 160;
        this.miniloupe.loupe.viewer.round_values = false;
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
      event.timestamp, Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor), caretpos, 'audio_buttons');

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
        this.nav.replay = this.viewer.rePlayback();
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
    if (this.appStorage.show_loupe) {
      this.miniloupe.zoomY = this.factor;
    }

    this.subscrmanager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );
  }

  test(selection: AudioSelection) {
    if (selection) {
      if (selection.length > 0) {
        selection.checkSelection();
        this.segmentselected = false;
        this.audiochunk_down.destroy();
        this.audiochunk_down = new AudioChunk(this.audiochunk_top.selection.clone(), this.audiomanager);
        this.top_selected = true;
      } else {
        this.top_selected = false;
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

    this.mini_loupecoord.component = this.viewer;

    if (!this.audiomanager.audioplaying && this.appStorage.playonhover) {
      // play audio
      this.audiochunk_top.selection.start = this.viewer.av.Mousecursor.timePos.clone();
      this.audiochunk_top.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audiomanager.ressource.info.samplerate / 10;
      this.audiochunk_top.startPlayback(() => {
      }, () => {
      }, true);
    }

    const a = this.viewer.getLocation();
    this.mini_loupecoord.y = this.viewer.Settings.lineheight;
    if (this.appStorage.usemode === 'local' || this.appStorage.usemode === 'url') {
      this.mini_loupecoord.y += 24;
    }

    this.mouseTimer = window.setTimeout(() => {
      this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
        this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
    }, 20);
  }

  onSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.top_selected = true;
      this.audiochunk_down = new AudioChunk(selection, this.audiomanager);
    });
  }

  onLoupeSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audiochunk_down.selection = selection.clone();
      this.audiochunk_down.playposition = selection.start.clone();
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

        if (this.segmentselected && this.selected_index > -1) {
          const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
          segment.start = anno_segment.time.samples;
          segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
            ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
            : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

          segment.start = Math.round(segment.start * this.audiomanager.sampleRateFactor);
          segment.length = Math.round(segment.length * this.audiomanager.sampleRateFactor);
          segment.textlength = anno_segment.transcript.length;
        }

        this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
          Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor), caretpos, control, segment);
      } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
        this.appStorage.playonhover = !this.appStorage.playonhover;
      }
    }
  }

  onLoupeClick(event) {
    if (this.selected_index > -1) {
      const end_samples = this.transcrService.currentlevel.segments.get(this.selected_index).time.samples;
      let start_samples = 0;
      if (this.selected_index > 0) {
        start_samples = this.transcrService.currentlevel.segments.get(this.selected_index - 1).time.samples;
      }
      if (this.loupe.viewer.MouseCursor.timePos.samples < start_samples
        || this.loupe.viewer.MouseCursor.timePos.samples > end_samples) {
        this.segmentselected = false;
      }
    }
  }

  onMarkerInsert(marker_code: string) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.start = Math.round(segment.start * this.audiomanager.sampleRateFactor);
        segment.length = Math.round(segment.length * this.audiomanager.sampleRateFactor);
        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('shortcut', {value: marker_code}, Date.now(),
        Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor),
        this.editor.caretpos, 'texteditor_markers', segment);
    }
  }

  onMarkerClick(marker_code: string) {
    this.onTranscriptionChanged(null);
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segmentselected && this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.start = Math.round(segment.start * this.audiomanager.sampleRateFactor);
        segment.length = Math.round(segment.length * this.audiomanager.sampleRateFactor);
        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('mouseclick', {value: marker_code}, Date.now(),
        Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor),
        this.editor.caretpos, 'texteditor_toolbar', segment);
    }
  }

  onViewerMouseDown($event) {
    this.segmentselected = false;
  }

  onSpeedChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    this.audiochunk_top.speed = event.new_value;
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

      if (this.segmentselected && this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.start = Math.round(segment.start * this.audiomanager.sampleRateFactor);
        segment.length = Math.round(segment.length * this.audiomanager.sampleRateFactor);
        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor), this.editor.caretpos, 'audio_speed', segment);
    }
  }

  onVolumeChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    this.audiochunk_top.volume = event.new_value;
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

      if (this.segmentselected && this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.start = Math.round(segment.start * this.audiomanager.sampleRateFactor);
        segment.length = Math.round(segment.length * this.audiomanager.sampleRateFactor);
        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        Math.round(this.audiomanager.playposition * this.audiomanager.sampleRateFactor), this.editor.caretpos, 'audio_volume', segment);
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEnter({index: segnumber});
  }

  public update() {
    this.loupe.update();
    this.viewer.update();
    this.segmentselected = false;
    this.audiochunk_top.startpos = this.audiochunk_top.time.start;
    this.audiochunk_down.startpos = this.audiochunk_down.time.start;
  }

  private changeArea(audiochunk: AudioChunk, viewer: AudioviewerComponent, coord: any,
                     cursor: number, relX: number, factor: number = 4) {
    const range = ((viewer.Chunk.time.duration.samples / this.audiomanager.ressource.info.duration.samples)
      * this.audiomanager.ressource.info.samplerate) / factor;

    if (cursor && relX > -1) {
      coord.x = ((relX) ? relX - 80 : 0);
      const half_rate = Math.round(range);
      const start = (cursor > half_rate)
        ? new AudioTime(cursor - half_rate, this.audiomanager.ressource.info.samplerate)
        : new AudioTime(0, this.audiomanager.ressource.info.samplerate);
      const end = (cursor < this.audiomanager.ressource.info.duration.samples - half_rate)
        ? new AudioTime(cursor + half_rate, this.audiomanager.ressource.info.samplerate)
        : this.audiomanager.ressource.info.duration.clone();

      this.audiochunk_loupe.destroy();
      this.audiochunk_loupe = new AudioChunk(new AudioSelection(start, end), this.audiomanager);
    }
  }

  private selectSegment(index: number): Promise<AudioSelection> {
    return new Promise<AudioSelection>(
      (resolve) => {
        const segment = this.transcrService.currentlevel.segments.get(index);
        this.editor.rawText = segment.transcript;
        this.selected_index = index;
        this.segmentselected = true;
        let start = new AudioTime(0, this.audiomanager.ressource.info.samplerate);
        if (index > 0) {
          start = this.transcrService.currentlevel.segments.get(index - 1).time;
        }
        resolve(new AudioSelection(start, segment.time));
      }
    );
  }

  private save() {
    if (this.segmentselected) {
      if (this.selected_index > -1 && this.transcrService.currentlevel.segments &&
        this.selected_index < this.transcrService.currentlevel.segments.length) {
        const segment = this.transcrService.currentlevel.segments.get(this.selected_index).clone();
        this.viewer.focused = false;
        this.loupe.viewer.focused = false;
        segment.transcript = this.editor.rawText;
        const saved = this.transcrService.currentlevel.segments.change(this.selected_index, segment);
      }
    }
  }
}
