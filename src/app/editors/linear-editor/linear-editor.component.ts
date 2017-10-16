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
  AudioNavigationComponent,
  AudioviewerComponent,
  LoupeComponent,
  TranscrEditorComponent
} from '../../core/component';

import {
  AudioService,
  KeymappingService,
  MessageService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AudioSelection, AudioTime, AVMousePos, BrowserInfo, Functions, SubscriptionManager} from '../../core/shared';
import {SettingsService} from '../../core/shared/service/settings.service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {AudioManager} from '../../core/obj/media/audio/AudioManager';
import {AudioChunk} from '../../core/obj/media/audio/AudioChunk';
import {isNullOrUndefined} from 'util';
import {AudioviewerConfig} from '../../core/component/audioviewer/config/av.config';
import {CircleLoupeComponent} from '../../core/component/circleloupe/circleloupe.component';

@Component({
  selector: 'app-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.css']
})
export class LinearEditorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  public static editorname = 'Linear Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('miniloupe') miniloupe: CircleLoupeComponent;
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('nav') nav: AudioNavigationComponent;
  @ViewChild('transcr') public editor: TranscrEditorComponent;

  private subscrmanager: SubscriptionManager;
  private saving = false;

  public miniloupe_hidden = true;
  public segmentselected = false;
  public top_selected = false;
  private factor = 6;

  public loupe_settings: AudioviewerConfig;
  public mini_loupecoord: any = {
    component: 'viewer',
    x: 0,
    y: 0
  };

  private platform = BrowserInfo.platform;

  public audiomanager: AudioManager;
  public audiochunk_top: AudioChunk;
  public audiochunk_down: AudioChunk;
  public audiochunk_loupe: AudioChunk;

  private selected_index: number;

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
    this.viewer.round_values = true;

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


    /*
    this.miniloupe.Settings.shortcuts_enabled = false;
    this.miniloupe.Settings.boundaries.enabled = false;
    this.miniloupe.Settings.justify_signal_height = false;
    this.miniloupe.loupe.viewer.round_values = false;
*/

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
        const event = obj.event;
        if (this.viewer.focused || (!isNullOrUndefined(this.loupe) && this.loupe.focused)) {
          if (event.key === '+') {
            this.factor = Math.min(12, this.factor + 1);
            this.miniloupe.zoomY = Math.max(1, this.factor);

            if (this.viewer.focused) {
              this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
                this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
            } else if (!isNullOrUndefined(this.loupe) && this.loupe.focused) {
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
              } else if (!isNullOrUndefined(this.loupe) && this.loupe.focused) {
                this.changeArea(this.audiochunk_loupe, this.loupe.viewer, this.mini_loupecoord,
                  this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
              }
            }
          }
        }
      }
    ));
    LinearEditorComponent.initialized.emit();
  }

  ngOnChanges(obj: SimpleChanges) {
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
        this.viewer.pausePlayback();
        break;
      case('stop'):
        this.viewer.stopPlayback();
        break;
      case('replay'):
        this.nav.replay = this.viewer.rePlayback();
        break;
      case('backward'):
        this.viewer.stepBackward();
        break;
      case('backward time'):
        this.viewer.stepBackwardTime(0.5);
        break;
      case('default'):
        break;
    }
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    this.miniloupe.zoomY = this.factor;
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
    if (!isNullOrUndefined(this.loupe)) {
      this.loupe.update();
    }
    this.viewer.update();
    this.saving = false;
  }

  onMouseOver(cursor: AVMousePos) {
    this.mini_loupecoord.component = this.viewer;

    if (!this.audiomanager.audioplaying && this.appStorage.playonhover) {
      // play audio
      this.audiochunk_top.selection.start = this.viewer.av.Mousecursor.timePos.clone();
      this.audiochunk_top.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audiomanager.ressource.info.samplerate / 10;
      this.audiochunk_top.startPlayback(() => {
      }, true);
    }

    const a = this.viewer.getLocation();
    this.mini_loupecoord.y = a.y - this.viewer.Settings.lineheight - this.miniloupe.Settings.height;
    if (this.appStorage.uselocalmode) {
      this.mini_loupecoord.y += 24;
    }
    this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
      this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
  }

  private changeArea(audiochunk: AudioChunk, viewer: AudioviewerComponent, coord: any,
                     cursor: number, relX: number, factor: number = 4) {
    const range = ((viewer.Chunk.time.duration.samples / this.audiomanager.ressource.info.duration.samples)
      * this.audiomanager.ressource.info.samplerate) / factor;

    if (cursor && relX > -1) {
      coord.x = ((relX) ? relX - 40 : 0);
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

  onSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.top_selected = true;

      setTimeout(() => {
        this.audiochunk_down.destroy();
        this.audiochunk_down = new AudioChunk(selection, this.audiomanager);
      }, 100);
    });
  }

  onLoupeSegmentEnter($event) {
    this.selectSegment($event.index).then((selection: AudioSelection) => {
      this.audiochunk_down.selection = selection.clone();
      this.audiochunk_down.playposition = this.audiochunk_down.selection.start.clone();

      setTimeout(() => {
        if (this.audiochunk_down.playposition.samples === this.audiochunk_down.time.start.samples) {
        }
        this.loupe.update();
      }, 100);
    });
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

  onTranscriptionChanged($event) {
    this.save();
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

          segment.textlength = anno_segment.transcript.length;
        }

        this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
          this.audiomanager.playposition, caretpos, control, segment);
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

  /**
   * hits when user is typing something in the editor
   * @param status
   */
  onEditorTyping = (status: string) => {
    this.viewer.focused = false;
    this.loupe.viewer.focused = false;
    if (status === 'stopped') {
      this.save();
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

        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('shortcut', {value: marker_code}, Date.now(),
        this.audiomanager.playposition, this.editor.caretpos, 'texteditor_markers', segment);
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

        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('mouseclick', {value: marker_code}, Date.now(),
        this.audiomanager.playposition, this.editor.caretpos, 'texteditor_toolbar', segment);
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

        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, this.editor.caretpos, 'audio_speed', segment);
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

        segment.textlength = anno_segment.transcript.length;
      }

      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, this.editor.caretpos, 'audio_volume', segment);
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
}
