import {AfterViewInit, Component, EventEmitter, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {AudioNavigationComponent, AudioplayerComponent, TranscrEditorComponent} from '../../core/component';
import {
  AudioService,
  KeymappingService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {SubscriptionManager} from '../../core/shared';
import {SettingsService} from '../../core/shared/service/settings.service';
import {SessionService} from '../../core/shared/service/session.service';
import {Segment} from '../../core/obj/Annotation/Segment';
import {AudioManager} from '../../core/obj/media/audio/AudioManager';
import {AudioChunk} from '../../core/obj/media/audio/AudioChunk';
import {AudioTime} from '../../core/obj/media/audio/AudioTime';

@Component({
  selector: 'app-audioplayer-gui',
  templateUrl: './editor-w-signaldisplay.component.html',
  styleUrls: ['./editor-w-signaldisplay.component.css']
})
export class EditorWSignaldisplayComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

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

  public audiochunk: AudioChunk;
  public audiomanager: AudioManager;
  private boundaryselected = false;

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public sessService: SessionService) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audiochunk = this.audiomanager.mainchunk.clone();
    this.audiochunk.speed = 1;
    this.audiochunk.volume = 1;
    this.settings.shortcuts = this.keyMap.register('AP', this.settings.shortcuts);
    this.shortcuts = this.settings.shortcuts;
    this.editor.Settings.markers = this.transcrService.guidelines.markers.items;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.special_markers.boundary = true;

    EditorWSignaldisplayComponent.initialized.emit();


    /* does not work
    setInterval(() => {
      if (this.audiochunk.isPlaying) {
        const samples = this.audiochunk.playposition.samples;
        let i: number = this.transcrService.annotation.levels[0].segments.getSegmentBySamplePosition(samples);
        if (i < 0) {
          i = this.transcrService.annotation.levels[0].segments.length - 1;
        }
        this.highlightSegment(i);
      }
    }, 500);
    */
  }

  ngAfterViewInit() {
    if (this.transcrService.annotation.levels[0].segments.length > 0) {
      this.editor.segments = this.transcrService.annotation.levels[0].segments;
    }
    this.editor.Settings.height = 100;
    this.editor.update();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnChanges(obj: any) {
  }

  highlightSegment(seg_number: number) {
    jQuery('.note-editable.panel-body textspan').css({
      'background-color': ''
    });
    jQuery('.note-editable.panel-body textspan:eq(' + seg_number + ')').css({
      'background-color': 'yellow'
    });
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
    this.audiochunk.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'speed_change');
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'volume_change');
    }
  }

  afterTyping(status) {
    if (status === 'stopped') {
      this.saveTranscript();
      this.highlight();
    }
  }

  onShortcutTriggered(event) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('shortcut', event, Date.now(), 'audioplayer');
    }
  }

  onBoundaryClicked(samples: number) {
    const i: number = this.transcrService.annotation.levels[0].segments.getSegmentBySamplePosition(samples);

    this.boundaryselected = true;

    if (i > -1) {
      const start = (i > 0) ? this.transcrService.annotation.levels[0].segments.get(i - 1).time.samples : 0;
      this.highlightSegment(i);
      this.audiochunk.startpos = new AudioTime(start, this.audiomanager.ressource.info.samplerate);
      this.audiochunk.selection.end = this.transcrService.annotation.levels[0].segments.get(i).time.clone();
      this.audioplayer.update();

      // make sure that audio is stopped
      this.audiochunk.stopPlayback(() => {
        this.audioplayer.startPlayback().then(() => {
          this.boundaryselected = false;
          if (this.audiochunk.isPlaybackEnded) {
            // set start pos and playback length to end of audio file
            this.audiochunk.startpos = this.audiochunk.selection.end.clone();
            this.audioplayer.update();
          }
        }).catch(() => {
        });
      });
    } else {
      this.boundaryselected = false;
    }
  }

  onMarkerInsert(marker_code: string) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_insert', {value: marker_code}, Date.now(), 'editor');
    }
  }

  onMarkerClick(marker_code: string) {
    this.afterTyping('stopped');
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
    }
  }

  saveTranscript() {
    let html: string = this.editor.html.replace(/&nbsp;/g, ' ');
    // split text at the position of every boundary marker
    html = html.replace(/(<textspan([ \w:"\-%;]|[0-9])*>)|(<\/textspan>)/g, '');
    let seg_texts: string[] = html.split(
      /\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="[0-9]+">\s?/g
    );

    const samples_array: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)">\s?/g,
      function (match, g1, g2) {
        samples_array.push(Number(g1));
        return '';
      });

    seg_texts = seg_texts.map((a: string) => {
      return a.replace(/(<p>)|(<\/p>)/g, '');
    });

    // remove invalid boundaries
    if (seg_texts.length > 1) {
      let start = 0;
      for (let i = 0; i < samples_array.length; i++) {
        if (!(samples_array[i] > start)) {
          // remove boundary
          samples_array.splice(i, 1);

          // concat
          seg_texts[i + 1] = seg_texts[i] + seg_texts[i + 1];
          seg_texts.splice(i, 1);


          --i;
        } else {
          start = samples_array[i];
        }
      }
    }

    for (let i = 0; i < seg_texts.length; i++) {
      const anno_seg_length = this.transcrService.annotation.levels[0].segments.length;
      const new_raw = this.transcrService.htmlToRaw(seg_texts[i]);

      if (i < anno_seg_length) {
        // probably overwrite old files
        const segment: Segment = this.transcrService.annotation.levels[0].segments.get(i);
        segment.transcript = new_raw;
        if (i < seg_texts.length - 1) {
          segment.time.samples = samples_array[i];
        }

        this.transcrService.annotation.levels[0].segments.change(i, segment);
      } else {
        // add new segments

        if (i === seg_texts.length - 1) {
          this.transcrService.annotation.levels[0].segments.add(this.audiochunk.time.end.samples, new_raw);
        } else {
          this.transcrService.annotation.levels[0].segments.add(samples_array[i - 1], new_raw);
        }
      }
    }

    const anno_seg_length = this.transcrService.annotation.levels[0].segments.length;
    if (anno_seg_length > seg_texts.length) {
      // remove left segments
      this.transcrService.annotation.levels[0].segments.segments.splice(seg_texts.length, (anno_seg_length - seg_texts.length));
      // because last segment was removed
      const seg = this.transcrService.annotation.levels[0].segments.get(seg_texts.length - 1);
      seg.time.samples = this.audiochunk.time.end.samples;
    }
  }

  public highlight() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');

    const samples_array: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)">\s?/g,
      function (match, g1, g2) {
        samples_array.push(Number(g1));
        return '';
      });

    let start = 0;
    for (let i = 0; i < samples_array.length; i++) {
      if (!(samples_array[i] > start)) {
        // mark boundary red
        jQuery('.note-editable.panel-body img[data-samples]:eq(' + i + ')').css({
          'background-color': 'red'
        });
      } else {
        jQuery('.note-editable.panel-body img[data-samples]:eq(' + i + ')').css({
          'background-color': 'white'
        });
        start = samples_array[i];
      }
    }
  }
}
