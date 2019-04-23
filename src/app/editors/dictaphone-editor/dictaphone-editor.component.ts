import {AfterViewInit, Component, EventEmitter, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {
  AppStorageService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {BrowserAudioTime, BrowserSample, SubscriptionManager} from '../../core/shared';
import {Segment} from '../../core/obj/Annotation';
import {AudioManager} from '../../media-components/obj/media/audio/AudioManager';
import {AudioChunk} from '../../media-components/obj/media/audio';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {AudioplayerComponent} from '../../media-components/components/audio/audioplayer';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';

@Component({
  selector: 'app-audioplayer-gui',
  templateUrl: './dictaphone-editor.component.html',
  styleUrls: ['./dictaphone-editor.component.css']
})
export class DictaphoneEditorComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  public static editorname = 'Dictaphone Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('nav') nav: AudioNavigationComponent;
  @ViewChild('audioplayer') audioplayer: AudioplayerComponent;
  @ViewChild('transcr') public editor: TranscrEditorComponent;
  public audiochunk: AudioChunk;
  public audiomanager: AudioManager;
  private subscrmanager: SubscriptionManager;
  private shortcuts: any;
  private boundaryselected = false;

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
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
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

    DictaphoneEditorComponent.initialized.emit();
  }

  ngAfterViewInit() {
    this.loadEditor();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnChanges(obj: any) {
  }

  highlightSegment(segNumber: number) {
    jQuery('.note-editable.panel-body textspan').css({
      'background-color': ''
    });
    jQuery('.note-editable.panel-body textspan:eq(' + segNumber + ')').css({
      'background-color': 'yellow'
    });
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    this.uiService.addElementFromEvent('mouseclick', {value: event.type},
      event.timestamp, this.audiomanager.playposition,
      this.editor.caretpos, 'audio_buttons');

    switch (event.type) {
      case('play'):
        this.audioplayer.startPlayback(() => {
          this.audioplayer.update();
        });
        break;
      case('pause'):
        this.audioplayer.pausePlayback();
        break;
      case('stop'):
        this.audioplayer.stopPlayback(() => {
          this.audioplayer.audiochunk.playposition = this.audiomanager.createBrowserAudioTime(0);
          this.audioplayer.update();
        });
        break;
      case('replay'):
        this.audioplayer.rePlayback();
        break;
      case('backward'):
        this.audioplayer.stepBackward();
        break;
      case('backward time'):
        this.audioplayer.stepBackwardTime(0.5);
        break;
      case('default'):
        break;
    }
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    this.uiService.addElementFromEvent('slider', event, event.timestamp, this.audiomanager.playposition,
      this.editor.caretpos, 'audio_speed');
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    this.uiService.addElementFromEvent('slider', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, 'audio_volume');
  }

  afterTyping(status) {
    if (status === 'stopped') {
      this.saveTranscript();
      this.highlight();
    }
  }

  onShortcutTriggered(event) {
    event.value = `audio:${event.value}`;
    this.uiService.addElementFromEvent('shortcut', event, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor');
  }

  onBoundaryClicked(samples: BrowserSample) {
    const i: number = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(samples);

    this.boundaryselected = true;

    if (i > -1) {
      const start = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.browserSample.value : 0;

      new Promise<void>((resolve) => {
        if (this.audiochunk.isPlaying) {
          this.audiochunk.stopPlayback().then(resolve);
        } else {
          resolve();
        }
      }).then(() => {
        this.audiochunk.startpos = this.audiomanager.createBrowserAudioTime(start);
        this.audiochunk.selection.end = this.transcrService.currentlevel.segments.get(i).time.clone();
        this.audioplayer.update();

        this.audioplayer.startPlayback(() => {
          // set start pos and playback length to end of audio file
          this.audiochunk.startpos = this.audiochunk.selection.end.clone() as BrowserAudioTime;
          this.audioplayer.update();
        });
        this.boundaryselected = false;
      });
    } else {
      this.boundaryselected = false;
    }
  }

  onBoundaryInserted() {
    this.uiService.addElementFromEvent('segment', {value: 'boundaries:add'}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor');
  }

  onMarkerInsert(markerCode: string) {
    this.uiService.addElementFromEvent('shortcut', {value: 'markers:' + markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor');
  }

  onMarkerClick(markerCode: string) {
    this.afterTyping('stopped');

    this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor_toolbar');
  }

  saveTranscript() {
    let html: string = this.editor.html.replace(/(&nbsp;)+/g, ' ');
    // split text at the position of every boundary marker
    html = html.replace(/(<textspan([ \w:"\-%;]|[0-9])*>)|(<\/textspan>)/g, '');
    let segTexts: string[] = html.split(
      new RegExp('/\s*<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="[0-9]+" ' +
        'alt="\[\|[0-9]+\|\]">\s*', 'g')
    );

    const samplesArray: number[] = [];
    html.replace(new RegExp('/\s*<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s*', 'g'),
      (match, g1) => {
        samplesArray.push(Number(g1));
        return '';
      });

    segTexts = segTexts.map((a: string) => {
      return a.replace(/(<span>)|(<\/span>)|(<p>)|(<\/p>)/g, '');
    });
    // remove invalid boundaries
    if (segTexts.length > 1) {
      let start = 0;
      for (let i = 0; i < samplesArray.length; i++) {
        if (!(samplesArray[i] > start)) {
          // remove boundary
          samplesArray.splice(i, 1);

          // concat
          segTexts[i + 1] = segTexts[i] + segTexts[i + 1];
          segTexts.splice(i, 1);


          --i;
        } else {
          start = samplesArray[i];
        }
      }
    }

    segTexts = segTexts.map((a: string) => {
      return a.replace(/(^\s+)|(\s+$)/g, '');
    });

    let annoSegLength = this.transcrService.currentlevel.segments.length;
    for (let i = 0; i < segTexts.length; i++) {
      const newRaw = this.transcrService.htmlToRaw(segTexts[i]);

      if (i < annoSegLength) {
        // probably overwrite old files
        const segment: Segment = this.transcrService.currentlevel.segments.get(i).clone();
        segment.transcript = newRaw;
        if (i < segTexts.length - 1) {
          segment.time.browserSample.value = samplesArray[i];
        }

        this.transcrService.currentlevel.segments.change(i, segment);
      } else {
        // add new segments
        if (i === segTexts.length - 1) {
          this.transcrService.currentlevel.segments.add(this.audiochunk.time.end, newRaw);
        } else {
          this.transcrService.currentlevel.segments.add(this.audiomanager.createBrowserAudioTime(samplesArray[i]), newRaw);
        }
      }
    }

    annoSegLength = this.transcrService.currentlevel.segments.length;
    if (annoSegLength > segTexts.length) {
      // remove left segments
      this.transcrService.currentlevel.segments.segments.splice(segTexts.length, (annoSegLength - segTexts.length));
      // because last segment was removed
      const seg = this.transcrService.currentlevel.segments.get(segTexts.length - 1);
      seg.time.browserSample.value = this.audiochunk.time.end.browserSample.value;
    }
  }

  public highlight() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');

    const samplesArray: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s?/g,
      (match, g1, g2) => {
        samplesArray.push(Number(g1));
        return '';
      });

    let start = 0;
    for (let i = 0; i < samplesArray.length; i++) {
      if (!(samplesArray[i] > start)) {
        // mark boundary red
        jQuery('.note-editable.panel-body img[data-samples]:eq(' + i + ')').css({
          'background-color': 'red'
        });
      } else {
        jQuery('.note-editable.panel-body img[data-samples]:eq(' + i + ')').css({
          'background-color': 'white'
        });
        start = samplesArray[i];
      }
    }
  }

  public update() {
    this.audiochunk.startpos = this.audiochunk.time.start as BrowserAudioTime;
    this.audioplayer.update();
    this.loadEditor();
  }

  public onSelectionChanged(caretpos) {
    /*
    if (!this.audiochunk.isPlaying) {
      const seg_num = this.editor.getSegmentByCaretPos(caretpos);
      if (seg_num > -1) {
        const samples = (seg_num > 0) ? this.transcrService.currentlevel.segments.get(seg_num - 1).time.samples : 0;
        this.audiochunk.startpos = new AudioTime(samples, this.audiochunk.audiomanager.ressource.info.samplerate);
        this.audiochunk.selection.end = this.transcrService.currentlevel.segments.get(seg_num).time.clone();
        this.audioplayer.update();
      }
    } */
  }

  private loadEditor() {
    if (this.transcrService.currentlevel.segments.length > 0) {
      this.editor.segments = this.transcrService.currentlevel.segments;
    }
    this.editor.Settings.height = 100;
    this.editor.update();
  }
}
