import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {AudioNavigationComponent, AudioviewerComponent} from '../../core/component';

import {
  AudioService,
  KeymappingService,
  MessageService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';

import {AudioSelection, AudioTime, Functions} from '../../core/shared';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {SettingsService} from '../../core/shared/service/settings.service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {AudioManager} from '../../core/obj/media/audio/AudioManager';
import {AudioChunk} from '../../core/obj/media/audio/AudioChunk';
import {TranscrWindowComponent} from './transcr-window/transcr-window.component';
import {PlayBackState} from '../../core/obj/media/index';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {TranscrEditorComponent} from '../../core/component/transcr-editor/transcr-editor.component';
import {isNullOrUndefined} from 'util';
import {CircleLoupeComponent} from '../../core/component/circleloupe/circleloupe.component';

@Component({
  selector: 'app-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.css']
})
export class TwoDEditorComponent implements OnInit, AfterViewInit, AfterContentChecked, OnChanges, OnDestroy {
  public static editorname = '2D-Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('window') window: TranscrWindowComponent;
  @ViewChild('loupe') loupe: CircleLoupeComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;

  public get editor(): TranscrEditorComponent {
    if (isNullOrUndefined(this.window)) {
      return null;
    }
    return this.window.editor;
  }

  public showWindow = false;
  private subscrmanager: SubscriptionManager;

  public loupe_hidden = true;
  private mousestate = 'initiliazied';
  private intervalID = null;
  public selected_index: number;

  private mouseTimer;

  private factor = 8;
  public miniloupe: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  } = {
    size: {
      width: 160,
      height: 160
    },
    location: {
      x: 0,
      y: 0
    }
  };

  private scrolltimer: Subscription = null;

  public get getHeight(): number {
    return window.innerHeight - 350;
  }

  private shortcuts: any = {};

  public get app_settings(): any {
    return this.settingsService.app_settings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  public audiomanager: AudioManager;
  public audiochunk_lines: AudioChunk;
  public audiochunk_window: AudioChunk;
  public audiochunk_loupe: AudioChunk;

  constructor(public transcrService: TranscriptionService,
              public keyMap: KeymappingService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public cd: ChangeDetectorRef,
              public msg: MessageService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audiochunk_lines = this.audiomanager.mainchunk.clone();
    this.audiochunk_loupe = this.audiomanager.mainchunk.clone();
    this.audiochunk_window = this.audiomanager.mainchunk.clone();
    this.shortcuts = this.keyMap.register('2D-Editor', this.viewer.Settings.shortcuts);
    const window_shortcuts = {
      jump_left: {
        keys: {
          mac: 'ALT + ARROWLEFT',
          pc: 'ALT + ARROWLEFT'
        },
        focusonly: false,
        title: 'jump_last_segment'
      },
      jump_right: {
        keys: {
          mac: 'ALT + ARROWRIGHT',
          pc: 'ALT + ARROWRIGHT'
        },
        focusonly: false,
        title: 'jump_next_segment'
      },
      close_save: {
        keys: {
          mac: 'ALT + ARROWDOWN',
          pc: 'ALT + ARROWDOWN'
        },
        focusonly: false,
        title: 'close_save'
      }
    };
    this.keyMap.register('Transcription Window', window_shortcuts);

    this.viewer.Settings.multi_line = true;
    this.viewer.Settings.lineheight = 70;
    this.viewer.Settings.margin.bottom = 5;
    this.viewer.Settings.margin.right = 0;
    this.viewer.Settings.justify_signal_height = true;
    this.viewer.Settings.scrollable = true;
    this.viewer.Settings.margin.right = 20;
    this.viewer.Settings.round_values = false;
    this.viewer.Settings.step_width_ratio = (this.viewer.Settings.pixel_per_sec / this.audiomanager.ressource.info.samplerate);

    this.viewer.alerttriggered.subscribe(
      (result) => {
        this.msg.showMessage(result.type, result.message);
      }
    );

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(
      (obj) => {
        const event = obj.event;
        if (this.viewer.focused) {
          if (event.key === '+') {
            this.factor = Math.min(20, this.factor + 1);
            this.changeArea(this.loupe, this.miniloupe, this.factor);
          } else if (event.key === '-') {
            if (this.factor > 3) {
              this.factor = Math.max(1, this.factor - 1);
              this.changeArea(this.loupe, this.miniloupe, this.factor);
            }
          }
        }
      }
    ));

    this.subscrmanager.add(this.audiochunk_lines.statechange.subscribe(
      (state: PlayBackState) => {
        if (state === PlayBackState.PLAYING) {
          if (!isNullOrUndefined(this.appStorage.followplaycursor) && this.appStorage.followplaycursor === true) {

            this.scrolltimer = Observable.interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator.samplestoAbsX(this.audiochunk_lines.playposition.samples);
              let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.lineheight;
              y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.margin.bottom);

              if (y > this.viewer.viewRect.h) {
                this.viewer.scrollTo(y);
              }
            });
          }
        } else {
          if (this.scrolltimer !== null) {
            this.scrolltimer.unsubscribe();
          }
        }
      }
    ));

    TwoDEditorComponent.initialized.emit();
  }

  ngOnChanges(test) {
  }

  ngOnDestroy() {
    clearInterval(this.intervalID);
    this.subscrmanager.destroy();
    if (this.scrolltimer !== null) {
      this.scrolltimer.unsubscribe();
    }
  }

  ngAfterViewInit() {
    if (this.audiochunk_lines.channel) {
      this.viewer.initialize();
    }

    this.subscrmanager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    this.loupe.zoomY = this.factor;
    this.viewer.update(true);
  }

  ngAfterContentChecked() {
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.currentlevel.segments && selected.index > -1 &&
      selected.index < this.transcrService.currentlevel.segments.length) {
      const segment = this.transcrService.currentlevel.segments.get(selected.index);
      const start: AudioTime = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
        : new AudioTime(0, this.audiomanager.ressource.info.samplerate);
      if (segment) {
        this.selected_index = selected.index;
        this.audiochunk_window = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audiomanager);

        this.viewer.deactivate_shortcuts = true;
        this.viewer.focused = false;
        this.showWindow = true;
      }
    }
  }

  onWindowAction(state) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.deactivate_shortcuts = false;
      this.selected_index = this.window.segment_index;
      this.viewer.selectSegment(this.selected_index);
      this.viewer.drawSegments();

      const segment = this.transcrService.currentlevel.segments.get(this.selected_index);
      const absx = this.viewer.av.audioTCalculator.samplestoAbsX(segment.time.samples);
      const specialheight = jQuery('#special').height();

      let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.lineheight;
      y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.margin.bottom);
      Functions.scrollTo(y, '#special');

    } else if (state === 'open') {
    }
  }

  onSegmentSelected(selection: AudioSelection) {
  }

  onMouseOver() {
    if (!isNullOrUndefined(this.mouseTimer)) {
      window.clearTimeout(this.mouseTimer);
    }
    this.mousestate = 'moving';

    if (!this.audiomanager.audioplaying && this.appStorage.playonhover) {
      // play audio
      this.audiochunk_lines.selection.start.samples = this.viewer.av.Mousecursor.timePos.samples;
      this.audiochunk_lines.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audiomanager.ressource.info.samplerate / 10;
      this.audiochunk_lines.startPlayback(() => {
      }, true);
    }

    this.changePosition(this.miniloupe);
    this.mouseTimer = window.setTimeout(() => {
      this.changeArea(this.loupe, this.miniloupe, this.factor);
      this.mousestate = 'ended';
    }, 20);
  }

  onSegmentChange($event) {
  }

  private changeArea(loup: CircleLoupeComponent, coord: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  }, factor: number) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      coord.location.x = ((cursor.relPos.x) ? cursor.relPos.x - coord.size.width / 2 : 0);
      coord.location.y = ((cursor.line) ? (cursor.line.number) *
        cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);
      coord.location.y += this.viewer.Settings.lineheight - 15 - this.viewer.viewRect.y;

      const half_rate = Math.round(this.audiomanager.ressource.info.samplerate / factor);
      const start = (cursor.timePos.samples > half_rate)
        ? new AudioTime(cursor.timePos.samples - half_rate, this.audiomanager.ressource.info.samplerate)
        : new AudioTime(0, this.audiomanager.ressource.info.samplerate);
      const end = (cursor.timePos.samples < this.audiomanager.ressource.info.duration.samples - half_rate)
        ? new AudioTime(cursor.timePos.samples + half_rate, this.audiomanager.ressource.info.samplerate)
        : this.audiomanager.ressource.info.duration.clone();

      this.loupe.zoomY = factor;
      if (start && end) {
        this.audiochunk_loupe = new AudioChunk(new AudioSelection(start, end), this.audiomanager);
      }
    }
  }

  private changePosition(coord: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  }) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      coord.location.x = ((cursor.relPos.x) ? cursor.relPos.x - coord.size.width / 2 : 0);
      coord.location.y = ((cursor.line) ? (cursor.line.number) *
        cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);
      coord.location.y += this.viewer.Settings.lineheight - 15 - this.viewer.viewRect.y;
    }
  }

  onShortCutTriggered($event, type) {
    if (
      $event.value === null || !(
        // cursor move by keyboard events are note saved because this would be too much
        Functions.contains($event.value, 'cursor') ||
        Functions.contains($event.value, 'segment_enter') ||
        Functions.contains($event.value, 'playonhover')
      )
    ) {
      $event.value = `${$event.type}:${$event.value}`;

      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.textlength = anno_segment.transcript.length;
      }

      const caretpos = (!isNullOrUndefined(this.editor)) ? this.editor.caretpos : -1;

      this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
        this.audiomanager.playposition, caretpos, 'multi-lines-viewer', segment);

    } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
      this.appStorage.playonhover = !this.appStorage.playonhover;
    }
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk_lines.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.textlength = anno_segment.transcript.length;
      }

      const caretpos = (!isNullOrUndefined(this.editor)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, 'audio_speed', segment);
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk_lines.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.textlength = anno_segment.transcript.length;
      }

      const caretpos = (!isNullOrUndefined(this.editor)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, 'audio_volume', segment);
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.appStorage.logging) {
      const caretpos = (!isNullOrUndefined(this.editor)) ? this.editor.caretpos : -1;

      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selected_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.selected_index);
        segment.start = anno_segment.time.samples;
        segment.length = (this.selected_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selected_index + 1).time.samples - anno_segment.time.samples
          : this.audiomanager.ressource.info.duration.samples - anno_segment.time.samples;

        segment.textlength = anno_segment.transcript.length;
      }
      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp, this.audiomanager.playposition, caretpos, 'audio_buttons', segment);
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
        this.audionav.replay = this.viewer.rePlayback();
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

  public openSegment(segnumber: number) {
    this.onSegmentEntered({index: segnumber});
  }

  public update() {
    this.viewer.update();
    this.audiochunk_lines.startpos = this.audiochunk_lines.time.start;
  }

  onScrollbarMouse(event) {
    if (event.state === 'mousemove') {
      this.loupe_hidden = true;
    }
  }

  onScrolling(event) {
    if (event.state === 'scrolling') {
      this.loupe_hidden = true;
    }
  }
}
