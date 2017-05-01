import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {AudioNavigationComponent, AudioviewerComponent, LoupeComponent} from '../../component';
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

@Component({
  selector: 'app-overlay-gui',
  templateUrl: './overlay-gui.component.html',
  styleUrls: ['./overlay-gui.component.css']
})
export class OverlayGUIComponent implements OnInit, AfterViewInit, AfterContentChecked, OnChanges, OnDestroy {
  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('window') window: TranscrWindowComponent;
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;

  public showWindow = false;
  private subscrmanager: SubscriptionManager;

  public loupe_hidden = true;
  private mousestartmoving = false;
  private loupe_updated = true;
  private intervalID = null;

  public mini_loupecoord: any = {
    x: 0,
    y: 0
  };

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
    this.viewer.Settings.justifySignalHeight = true;
    this.viewer.Settings.step_width_ratio = (this.viewer.Settings.pixel_per_sec / this.audio.samplerate);

    this.viewer.alerttriggered.subscribe(
      (result) => {
        this.msg.showMessage(result.type, result.message);
      }
    );
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

    this.intervalID = setInterval(() => {
      if (!this.mousestartmoving && !this.loupe_updated) {
        this.loupe_updated = true;
        this.changeArea(this.loupe, this.mini_loupecoord);
      }
    }, 200);
  }

  ngAfterContentChecked() {
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.segments && selected.index > -1 && selected.index < this.transcrService.segments.length) {
      const segment = this.transcrService.segments.get(selected.index);
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

  onStateChange(state: string) {
  }

  onMouseOver(cursor: AVMousePos) {
    this.mousestartmoving = true;
    this.loupe_updated = false;
    setTimeout(() => {
      this.mousestartmoving = false;
    }, 200);
    this.changePosition(this.mini_loupecoord);
  }

  onSegmentChange($event) {
  }

  private changeArea(loup: LoupeComponent, coord: any) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      coord.x = ((cursor.relPos.x) ? cursor.relPos.x - 40 : 0);
      coord.y = ((cursor.line) ? (cursor.line.number + 1) *
        cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);
      const half_rate = Math.round(this.audio.samplerate / 20);
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
      $event.value == null || !(
        // cursor move by keyboard events are note saved because this would be too much
        Functions.contains($event.value, 'cursor') ||
        // disable logging for user test phase, because it would be too much
        Functions.contains($event.value, 'play_selection') ||
        Functions.contains($event.value, 'segment_enter')
      )
    ) {
      this.uiService.addElementFromEvent('shortcut', $event, Date.now(), type);
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
      case('default'):
        break;
    }
  }

  public openSegment(segnumber: number) {
    const segment = this.transcrService.segments.get(segnumber);
    this.selectSegment({
      index: segnumber,
      pos: segment.time.samples
    });
  }

  public selectSegment(selected: any) {
    const segment = this.transcrService.segments.get(selected.index);
    if (this.transcrService.segments && selected.index > -1 && selected.index < this.transcrService.segments.length) {
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
        const start = (selected.index > 0) ? this.transcrService.segments.get(selected.index - 1).time
          : new AudioTime(0, this.audio.samplerate);
        this.window.changeArea(start, segment.time);
        this.window.editor.rawText = segment.transcript;
      }
    } else {
      console.error('selected segment not found');
    }
  }
}
