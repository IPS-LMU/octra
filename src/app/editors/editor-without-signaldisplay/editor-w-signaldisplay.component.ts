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
import {Segment} from '../../core/obj/Segment';
import {AudioManager} from '../../core/obj/media/audio/AudioManager';
import {AudioChunk} from '../../core/obj/media/audio/AudioChunk';

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
    this.audiochunk = this.audiomanager.mainchunk;
    this.audiochunk.speed = 1;
    this.audiochunk.volume = 1;
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
    this.editor.Settings.height = 100;
    this.editor.update();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnChanges(obj: any) {
  }

  test() {
    const selection: Selection = document.getSelection();
    const cursorPos = selection.anchorOffset;
    const oldContent = selection.anchorNode.nodeValue;
    const t = jQuery(selection.anchorNode.parentElement);
    console.log(t);
    t.css(
      {
        border: '1px solid red'
      }
    );
    const toInsert = 'InsertMe!';
    const newContent = oldContent.substring(0, cursorPos) + toInsert + oldContent.substring(cursorPos);
    selection.anchorNode.nodeValue = newContent;
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
      /*
       const segment = this.transcrService.annotation.levels[0].segments.get(0);
       segment.transcript = this.editor.rawText;
       this.transcrService.annotation.levels[0].segments.change(0, segment);
       */
    }
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
    this.afterTyping('stopped');
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
    }
  }

  private saveTranscript() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');
    // split text at the position of every boundary marker
    let seg_texts: string[] = html.split(
      /\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="[0-9]+">\s?/g
    );
    console.log(seg_texts);

    console.log(this.transcrService.annotation.levels[0].segments);
    const samples_array: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)">\s?/g,
      function (match, g1, g2) {
        samples_array.push(Number(g1));
        return '';
      });

    seg_texts = seg_texts.map((a: string) => {
      return a.replace(/(<p>)|(<\/p>)/g, '');
    });


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
        console.log(samples_array);
        console.log(i - 1);

        if (i === seg_texts.length - 1) {
          this.transcrService.annotation.levels[0].segments.add(this.audiochunk.time.end.samples, new_raw);
        } else {
          this.transcrService.annotation.levels[0].segments.add(samples_array[i - 1], new_raw);
        }

        console.log(this.transcrService.annotation.levels[0].segments);
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
}
