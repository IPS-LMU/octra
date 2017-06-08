import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';

import {AudioNavigationComponent, AudioplayerComponent, TranscrEditorComponent} from '../../component';
import {AudioService, KeymappingService, TranscriptionService, UserInteractionsService} from '../../service';
import {SubscriptionManager} from '../../shared';
import {SettingsService} from '../../service/settings.service';
import {SessionService} from '../../service/session.service';

@Component({
  selector: 'app-audioplayer-gui',
  templateUrl: './editor-w-signaldisplay.component.html',
  styleUrls: ['./editor-w-signaldisplay.component.css']
})
export class EditorWSignaldisplayComponent implements OnInit, OnDestroy, AfterViewInit {
  public static editorname = 'Editor without signal display';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('nav') nav: AudioNavigationComponent;
  @ViewChild('audioplayer') audioplayer: AudioplayerComponent;
  @ViewChild('transcr') editor: TranscrEditorComponent;

  private subscrmanager: SubscriptionManager;

  private shortcuts: any;

  public set NavShortCuts(value: any) {
    this.shortcuts = value;
  }

  public get settings(): any {
    return this.audioplayer.settings;
  }

  public set settings(value: any) {
    this.audioplayer.settings = value;
  }

  public get app_settings(): any {
    return this.settingsService.app_settings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public sessService: SessionService) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.settings.shortcuts = this.keyMap.register('AP', this.settings.shortcuts);
    this.shortcuts = this.settings.shortcuts;
    this.editor.Settings.markers = this.transcrService.guidelines.markers.items;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;

    EditorWSignaldisplayComponent.initialized.emit();
  }

  ngAfterViewInit() {
    if (this.transcrService.annotation.levels[0].segments.length > 0) {
      this.editor.segments = this.transcrService.annotation.levels[0].segments;
    }
    // height of texteditor = 0 => auto
    this.editor.Settings.height = 0;
    this.editor.update();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('mouse_click', {}, event.timestamp, event.type + '_button');
    }

    switch (event.type) {
      case('play'):
        this.audioplayer.startPlayback();
        break;
      case('pause'):
        this.audioplayer.pausePlayback();
        break;
      case('stop'):
        this.audioplayer.stopPlayback();
        break;
      case('replay'):
        this.nav.replay = this.audioplayer.rePlayback();
        break;
      case('backward'):
        this.audioplayer.stepBackward();
        break;
      case('backward time'):
        this.audioplayer.stepBackwardTime(3, 0.5);
        break;
      case('default'):
        break;
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

  updateSegment($event) {
    const segment = this.transcrService.annotation.levels[0].segments.get(0);
    segment.transcript = this.editor.rawText;
    this.transcrService.annotation.levels[0].segments.change(0, segment);
  }

  onShortcutTriggered(event) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('shortcut', event, Date.now(), 'audioplayer');
    }
  }

  onMarkerInsert(marker_code: string) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_insert', {value: marker_code}, Date.now(), 'editor');
    }
  }

  onMarkerClick(marker_code: string) {
    this.updateSegment(null);
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
    }
  }
}
