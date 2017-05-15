import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {AudioNavigationComponent, AudioviewerComponent} from '../../component';
import {TranscrWindowComponent} from '../transcr-window/transcr-window.component';

import {
  AudioService,
  KeymappingService,
  MessageService,
  TranscriptionService,
  UserInteractionsService
} from '../../service';

import {AudioTime, AVMousePos, AVSelection, Functions} from '../../shared';
import {SubscriptionManager} from '../../shared/SubscriptionManager';
import {SettingsService} from '../../service/settings.service';
import {SessionService} from '../../service/session.service';
import {CircleLoupeComponent} from '../../component/circleloupe/circleloupe.component';

@Component({
  selector: 'app-overlay-gui',
  templateUrl: './overlay-gui.component.html',
  styleUrls: ['./overlay-gui.component.css']
})
export class OverlayGUIComponent implements OnInit, AfterViewInit, AfterContentChecked, OnChanges, OnDestroy {
  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('window') window: TranscrWindowComponent;
  @ViewChild('loupe') loupe: CircleLoupeComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;
  @ViewChild('audionav') nav: ElementRef;

  public showWindow = false;
  private subscrmanager: SubscriptionManager;

  public loupe_hidden = true;
  private mousestartmoving = false;
  private loupe_updated = true;
  private intervalID = null;

  private factor = 4;
  public mini_loupecoord: any = {
    x: 0,
    y: 0
  };

  public get getHeight(): number {
    return window.innerHeight - 250;
  }

  private shortcuts: any = {};

  public get app_settings(): any {
    return this.settingsService.app_settings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(public transcrService: TranscriptionService,
              public keyMap: KeymappingService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public cd: ChangeDetectorRef,
              public msg: MessageService,
              public settingsService: SettingsService,
              public sessService: SessionService) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.shortcuts = this.keyMap.register('2D-Editor', this.viewer.Settings.shortcuts);

    this.viewer.Settings.multi_line = true;
    this.viewer.Settings.height = 70;
    this.viewer.Settings.justifySignalHeight = false;
    this.viewer.Settings.step_width_ratio = (this.viewer.Settings.pixel_per_sec / this.audio.samplerate);

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
            this.factor = Math.max(4, this.factor + 1);
            this.loupe.zoomY = Math.max(1, this.loupe.zoomY + 1);

            this.changeArea(this.loupe, this.mini_loupecoord, this.factor);
          } else if (event.key === '-') {
            if (this.factor > 3) {
              this.factor = Math.max(3, this.factor - 1);
              this.loupe.zoomY = Math.max(1, this.loupe.zoomY - 1);
              this.changeArea(this.loupe, this.mini_loupecoord, this.factor);
            }
          }
        }
      }
    ));
  }

  ngOnChanges(test) {
  }

  ngOnDestroy() {
    clearInterval(this.intervalID);
    this.subscrmanager.destroy();
  }

  ngAfterViewInit() {
    if (this.audio.channel) {
      this.viewer.initialize();
    }

    this.subscrmanager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    this.loupe.zoomY = 8;
    this.intervalID = setInterval(() => {
      if (!this.mousestartmoving && !this.loupe_updated) {
        this.loupe_updated = true;
        this.changeArea(this.loupe, this.mini_loupecoord, this.factor);
      }
    }, 200);
  }

  ngAfterContentChecked() {
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.annotation.tiers[0].segments && selected.index > -1 &&
      selected.index < this.transcrService.annotation.tiers[0].segments.length) {
      const segment = this.transcrService.annotation.tiers[0].segments.get(selected.index);
      if (segment) {
        this.transcrService.selectedSegment = {index: selected.index, pos: selected.pos};
      }
    }

    if (this.transcrService.selectedSegment) {
      this.viewer.deactivate_shortcuts = true;
      this.viewer.focused = false;
      this.showWindow = true;
    }
  }

  onWindowAction(state) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.deactivate_shortcuts = false;
      this.viewer.drawSegments();
    } else if (state === 'open') {
    }
  }

  onSegmentSelected(num: number) {
  }

  public get Selection(): AVSelection {
    return this.viewer.Selection;
  }

  onMouseOver(cursor: AVMousePos) {
    this.mousestartmoving = true;
    this.loupe_updated = false;
    if (!this.audio.audioplaying && this.sessService.playonhover) {
      // play audio
      this.audio.startPlayback(this.viewer.av.Mousecursor.timePos, new AudioTime(this.audio.samplerate / 10,
        this.audio.samplerate), () => {
      }, () => {
        this.audio.audioplaying = false;
      }, true);
    }
    setTimeout(() => {
      this.mousestartmoving = false;
    }, 200);
    this.changePosition(this.mini_loupecoord);
  }

  onSegmentChange($event) {
  }

  private changeArea(loup: CircleLoupeComponent, coord: any, factor: number = 4) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      coord.x = ((cursor.relPos.x) ? cursor.relPos.x - 40 : 0);
      coord.y = ((cursor.line) ? (cursor.line.number + 1) *
        cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);

      /*
       let start = (cursor.absX > ) ? cursor.absX - 1 : 0;
       let end = (cursor.absX < this.viewer.AudioPxWidth - 1) ? cursor.absX + 1 : this.viewer.AudioPxWidth;

       start = this.viewer.av.audioTCalculator.absXChunktoSamples(start, this.viewer.av.Chunk);
       end = this.viewer.av.audioTCalculator.absXChunktoSamples(end, this.viewer.av.Chunk);

       const startA = new AudioTime(start, this.audio.samplerate);
       const endA = new AudioTime(end, this.audio.samplerate);

       */

      const half_rate = Math.round(this.audio.samplerate / factor);
      const start = (cursor.timePos.samples > half_rate)
        ? new AudioTime(cursor.timePos.samples - half_rate, this.audio.samplerate)
        : new AudioTime(0, this.audio.samplerate);
      const end = (cursor.timePos.samples < this.audio.duration.samples - half_rate)
        ? new AudioTime(cursor.timePos.samples + half_rate, this.audio.samplerate)
        : this.audio.duration.clone();

      if (start && end) {
        loup.changeArea(start, end);
      }
    }
  }

  private changePosition(coord: any) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      coord.x = ((cursor.relPos.x) ? cursor.relPos.x - 40 : 0);
      coord.y = ((cursor.line) ? (cursor.line.number + 1) *
        cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);
    }
  }

  onShortCutTriggered($event, type) {
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

  onMarkerInsert(marker_code: string) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_insert', {value: marker_code}, Date.now(), 'editor');
    }
  }

  onMarkerClick(marker_code: string) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
    }
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audio.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'speed_change');
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audio.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'volume_change');
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
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
        this.audionav.replay = this.viewer.rePlayback();
        break;
      case('backward'):
        this.viewer.stepBackward();
        break;
      case('backward time'):
        this.viewer.stepBackwardTime();
        break;
      case('default'):
        break;
    }
  }

  public openSegment(segnumber: number) {
    const segment = this.transcrService.annotation.tiers[0].segments.get(segnumber);
    this.selectSegment({
      index: segnumber,
      pos: segment.time.samples
    });
  }

  public selectSegment(selected: any) {
    const segment = this.transcrService.annotation.tiers[0].segments.get(selected.index);
    if (this.transcrService.annotation.tiers[0].segments && selected.index > -1 &&
      selected.index < this.transcrService.annotation.tiers[0].segments.length) {
      if (segment) {
        this.transcrService.selectedSegment = {index: selected.index, pos: selected.pos};
      }
    }

    if (this.transcrService.selectedSegment) {
      this.viewer.deactivate_shortcuts = true;
      this.viewer.focused = false;
      if (!this.showWindow) {
        this.showWindow = true;
      } else {
        const start = (selected.index > 0) ? this.transcrService.annotation.tiers[0].segments.get(selected.index - 1).time
          : new AudioTime(0, this.audio.samplerate);
        this.window.changeArea(start, segment.time);
        this.window.editor.rawText = segment.transcript;
      }
    } else {
      console.error('selected segment not found');
    }
  }
}
