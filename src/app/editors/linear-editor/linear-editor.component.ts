import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
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
import {isNullOrUndefined} from 'util';
import {SessionService} from '../../core/shared/service/session.service';
import {CircleLoupeComponent} from '../../core/component/circleloupe/circleloupe.component';
import {AudioManager} from '../../core/obj/media/audio/AudioManager';
import {AudioChunk} from '../../core/obj/media/audio/AudioChunk';

@Component({
  selector: 'app-signal-gui',
  templateUrl: './linear-editor.component.html',
  styleUrls: ['./linear-editor.component.css']
})
export class LinearEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  public static editorname = 'Linear Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('miniloupe') miniloupe: CircleLoupeComponent;
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('nav') nav: AudioNavigationComponent;
  @ViewChild('transcr') editor: TranscrEditorComponent;

  private subscrmanager: SubscriptionManager;
  private saving = false;

  public miniloupe_hidden = true;
  public segmentselected = false;
  private factor = 4;

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
              public sessService: SessionService) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audiochunk_top = this.audiomanager.mainchunk.clone();
    this.audiochunk_down = this.audiomanager.mainchunk.clone();
    this.audiochunk_loupe = this.audiomanager.mainchunk.clone();
    this.viewer.Settings.shortcuts = this.keyMap.register('AV', this.viewer.Settings.shortcuts);

    this.viewer.Settings.multi_line = false;
    this.viewer.Settings.height = 80;
    this.viewer.Settings.shortcuts_enabled = true;
    this.viewer.Settings.boundaries.readonly = false;
    this.viewer.Settings.justify_signal_height = true;

    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;

    this.loupe.Settings.shortcuts = this.keyMap.register('Loupe', this.loupe.Settings.shortcuts);
    this.loupe.Settings.shortcuts.play_pause.keys.mac = 'SPACE';
    this.loupe.Settings.shortcuts.play_pause.keys.pc = 'SPACE';
    this.loupe.Settings.shortcuts.play_pause.focusonly = true;
    this.loupe.Settings.shortcuts.step_backwardtime = null;
    this.loupe.Settings.shortcuts.step_backward.keys.mac = 'SHIFT + ENTER';
    this.loupe.Settings.shortcuts.step_backward.keys.pc = 'SHIFT + ENTER';
    this.loupe.Settings.justify_signal_height = true;

    this.miniloupe.Settings.shortcuts_enabled = false;
    this.miniloupe.Settings.boundaries.enabled = false;
    this.miniloupe.Settings.justify_signal_height = false;

    this.subscrmanager.add(this.transcrService.annotation.levels[0].segments.onsegmentchange.subscribe(
      ($event) => {
        if (!this.saving) {
          setTimeout(() => {
            this.saving = true;
            this.onSegmentChange($event);
          }, 1000);
        }
      }
    ));

    this.subscrmanager.add(this.loupe.viewer.alerttriggered.subscribe((result) => {
        this.msg.showMessage(result.type, result.message);
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
        if (this.viewer.focused || this.loupe.focused) {
          if (event.key === '+') {
            this.factor = Math.max(4, this.factor + 1);
            this.miniloupe.zoomY = Math.max(1, this.miniloupe.zoomY + 1);

            if (this.viewer.focused) {
              this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
                this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
            } else if (this.loupe.focused) {
              this.changeArea(this.audiochunk_loupe, this.loupe.viewer, this.mini_loupecoord,
                this.viewer.MouseCursor.timePos.samples, this.loupe.MouseCursor.relPos.x, this.factor);
            }
          } else if (event.key === '-') {
            if (this.factor > 3) {
              this.factor = Math.max(3, this.factor - 1);
              this.miniloupe.zoomY = Math.max(1, this.miniloupe.zoomY - 1);
              if (this.viewer.focused) {
                this.changeArea(this.audiochunk_loupe, this.viewer, this.mini_loupecoord,
                  this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x, this.factor);
              } else if (this.loupe.focused) {
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

  ngOnDestroy() {
    this.subscrmanager.destroy();
    this.keyMap.unregister('AV');
    this.keyMap.unregister('Loupe');
  }

  onButtonClick(event: {
    type: string, timestamp: number
  }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('mouse_click', {}, event.timestamp, event.type + '_button');
    }

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
    this.loupe.zoomY = this.factor;
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
        this.audiochunk_down = new AudioChunk(this.audiochunk_top.selection.clone(), this.audiomanager);
        this.loupe.update();
      }
    }
  }

  onSegmentChange($event) {
    this.loupe.update();
    this.viewer.update();
    this.saving = false;
  }

  onMouseOver(cursor: AVMousePos) {
    this.mini_loupecoord.component = this.viewer;

    if (!this.audiomanager.audioplaying && this.sessService.playonhover) {
      // play audio
      this.audiochunk_top.selection.start = this.viewer.av.Mousecursor.timePos.clone();
      this.audiochunk_top.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audiomanager.ressource.info.samplerate / 10;
      this.audiochunk_top.startPlayback(() => {
      }, true);
    }

    this.mini_loupecoord.y = -this.miniloupe.Settings.height / 2;
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

      this.audiochunk_loupe = new AudioChunk(new AudioSelection(start, end), this.audiomanager);
    }
  }

  onSegmentEnter($event) {
    const segment = this.transcrService.annotation.levels[0].segments.get($event.index);
    this.editor.rawText = segment.transcript;
    this.segmentselected = true;
    this.selected_index = $event.index;
    let start = new AudioTime(0, this.audiomanager.ressource.info.samplerate);
    if ($event.index > 0) {
      start = this.transcrService.annotation.levels[0].segments.get($event.index - 1).time;
    }

    this.audiochunk_down = new AudioChunk(new AudioSelection(start, segment.time), this.audiomanager);
    this.loupe.update();
  }

// TODO CHANGE!!
  onLoupeSegmentEnter($event) {
    const segment = this.transcrService.annotation.levels[0].segments.get($event.index);
    this.editor.rawText = segment.transcript;
    this.segmentselected = true;
    this.selected_index = $event.index;
  }

  onTranscriptionChanged($event) {
    this.save();
  }

  private save() {
    if (this.segmentselected) {
      if (this.selected_index > -1 && this.transcrService.annotation.levels[0].segments &&
        this.selected_index < this.transcrService.annotation.levels[0].segments.length) {
        const segment = this.transcrService.annotation.levels[0].segments.get(this.selected_index);
        this.viewer.focused = false;
        this.loupe.viewer.focused = false;
        segment.transcript = this.editor.rawText;
        this.transcrService.annotation.levels[0].segments.change(this.selected_index, segment);
      }
    }
  }

  onShortCutTriggered($event, type) {
    if (this.projectsettings.logging.forced) {

      if (
        $event.value === null || !(
          // cursor move by keyboard events are note saved because this would be too much
          Functions.contains($event.value, 'cursor') ||
          // disable logging for user test phase, because it would be too much
          Functions.contains($event.value, 'play_selection') ||
          Functions.contains($event.value, 'segment_enter') ||
          Functions.contains($event.value, 'playonhover')
        )
      ) {
        this.uiService.addElementFromEvent('shortcut', $event, Date.now(), type);
      } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
        this.sessService.playonhover = !this.sessService.playonhover;
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
  };

  onMarkerInsert(marker_code: string) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_insert', {value: marker_code}, Date.now(), 'editor');
    }
  }

  onMarkerClick(marker_code: string) {
    this.onTranscriptionChanged(null);
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
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
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'speed_change');
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
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'volume_change');
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    if (!isNullOrUndefined(this.mini_loupecoord.component)) {

      if (this.mini_loupecoord.component === 'viewer') {
        const a = this.viewer.getLocation();
        this.mini_loupecoord.y = 0;
      } else if (this.mini_loupecoord.component === 'loupe') {
        // TODO change
        /* const compute = this.loupe.getLocation();
         this.mini_loupecoord.y = compute.y - this.loupe.Settings.height
         - (this.miniloupe.Settings.height / 2) + 15;*/
      }
    }
  }

  public openSegment(segnumber: number) {
    const segment = this.transcrService.annotation.levels[0].segments.get(segnumber);
    this.editor.rawText = segment.transcript;

    this.segmentselected = true;
    this.selected_index = segnumber;
    this.viewer.selectSegment(segnumber);

    const start = this.transcrService.annotation.levels[0].segments.getStartTime(segnumber);
    this.audiochunk_down = new AudioChunk(new AudioSelection(start, AudioTime.add(start, segment.time)), this.audiomanager);
    this.loupe.update();
  }
}
