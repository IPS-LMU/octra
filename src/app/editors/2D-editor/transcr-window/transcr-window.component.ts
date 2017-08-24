import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import {AudioNavigationComponent, LoupeComponent, TranscrEditorComponent} from '../../../core/component';
import {
  AudioService,
  KeymappingService,
  TranscriptionService,
  UserInteractionsService
} from '../../../core/shared/service';
import {AudioTime, Segment, SubscriptionManager} from '../../../core/shared';
import {SettingsService} from '../../../core/shared/service/settings.service';
import {AudioChunk} from '../../../core/obj/media/audio/AudioChunk';
import {AudioManager} from '../../../core/obj/media/audio/AudioManager';
import {AudioRessource} from '../../../core/obj/media/audio/AudioRessource';
import {isNullOrUndefined} from 'util';
import {AudioSelection} from '../../../core/obj/media/audio/AudioSelection';
import {Segments} from '../../../core/obj/Annotation/Segments';

@Component({
  selector: 'app-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.css']
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('editor') editor: TranscrEditorComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;
  @ViewChild('window') window: ElementRef;

  @Output('act') act: EventEmitter<string> = new EventEmitter<string>();
  @Input('easymode') easymode = false;

  @Output('shortcuttriggered')
  get shortcuttriggered(): EventEmitter<string> {
    return this.loupe.shortcuttriggered;
  }

  @Output('marker_insert')
  get marker_insert(): EventEmitter<string> {
    return this.editor.marker_insert;
  }

  @Output('marker_click')
  get marker_click(): EventEmitter<string> {
    return this.editor.marker_click;
  }

  private showWindow = false;
  public pos_y = 0;
  private subscrmanager: SubscriptionManager;
  private temp_segments: Segments;

  get app_settings(): any {
    return this.settingsService.app_settings;
  }

  get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
  }

  get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
  }

  get ressource(): AudioRessource {
    return this.audiochunk.audiomanager.ressource;
  }

  @Input() audiochunk: AudioChunk;
  @Input() segment_index: number;

  constructor(public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.special_markers.boundary = true;
    const segments = this.transcrService.currentlevel.segments;
    this.temp_segments = segments.clone();
    this.subscrmanager.add(this.editor.loaded.subscribe(
      () => {
        if (this.segment_index > -1 && this.transcrService.currentlevel.segments &&
          this.segment_index < this.transcrService.currentlevel.segments.length) {
          this.editor_rawText(this.transcrService.currentlevel.segments.get(this.segment_index).transcript);
        }
      }
    ));

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  ngOnChanges(obj) {
    if (obj.hasOwnProperty('audiochunk')) {
      const previous: AudioChunk = obj.audiochunk.previousValue;
      const current: AudioChunk = obj.audiochunk.currentValue;

      if (!obj.audiochunk.firstChange) {
        if ((isNullOrUndefined(previous) && !isNullOrUndefined(current)) ||
          (current.time.start.samples !== previous.time.start.samples &&
            current.time.end.samples !== previous.time.end.samples)) {
          // audiochunk changed
          this.loupe.update();
        }
      }
    }
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngAfterViewInit() {
    this.loupe.Settings.boundaries.readonly = true;
    this.loupe.zoomY = 4;

    setTimeout(() => {
      this.audiochunk.startpos = this.audiochunk.time.start.clone();
      this.loupe.viewer.startPlayback();
    }, 500);
  }

  ngAfterContentInit() {
    this.act.emit('open');
  }

  public close() {
    this.showWindow = false;
    this.act.emit('close');
  }

  public open() {
    this.showWindow = true;
  }

  save() {
    if (this.segment_index > -1 && this.transcrService.currentlevel.segments &&
      this.segment_index < this.transcrService.currentlevel.segments.length) {

      if (this.editor.html.indexOf('<img src="assets/img/components/transcr-editor/boundary.png"') > -1) {
        // boundaries were inserted
        this.transcrService.currentlevel.segments.segments = this.temp_segments.segments;
        this.transcrService.currentlevel.segments.onsegmentchange.emit(null);
      } else {
        // no boundaries inserted
        const segment = this.transcrService.currentlevel.segments.get(this.segment_index);
        segment.transcript = this.editor.rawText;
        this.transcrService.currentlevel.segments.change(this.segment_index, segment);
      }
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('mouse_clicked', {value: event.type},
        event.timestamp, this.audiomanager.playposition, this.editor.caretpos, 'audio_buttons');
    }

    if (event.type === 'replay') {
      this.audionav.replay = !this.audionav.replay;
    }

    this.loupe.onButtonClick(event);
  }

  /**
   * selects the next segment on the left or on the right side
   * @param direction
   */
  goToSegment(direction: string) {
    if (this.segment_index > -1 && this.transcrService.currentlevel.segments &&
      this.segment_index < this.transcrService.currentlevel.segments.length) {
      let segment: Segment = this.transcrService.currentlevel.segments.get(this.segment_index);

      if (direction === 'right' &&
        this.segment_index < this.transcrService.currentlevel.segments.length - 1) {
        segment = this.transcrService.currentlevel.segments.get(++this.segment_index);
      } else if (direction === 'left' && this.segment_index > 0) {
        segment = this.transcrService.currentlevel.segments.get(--this.segment_index);
      }

      let begin = new AudioTime(0, this.audiomanager.ressource.info.samplerate);

      if (this.segment_index > 0) {
        begin = this.transcrService.currentlevel.segments.get(this.segment_index - 1).time.clone();
      }

      this.editor.rawText = this.transcrService.currentlevel.segments.get(this.segment_index).transcript;
      this.audiochunk = new AudioChunk(new AudioSelection(begin, segment.time.clone()), this.audiochunk.audiomanager);
    }
  }

  public editor_rawText(text: string) {
    this.editor.rawText = text;
  }

  onShortCutTriggered($event, type) {
    this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, type);
  }

  onMarkerInsert(marker_code: string) {
    this.uiService.addElementFromEvent('shortcut', {value: marker_code}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'markers');
  }

  onMarkerClick(marker_code: string) {
    this.uiService.addElementFromEvent('mouse_clicked', {value: marker_code}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor_toolbar');
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
        this.audiomanager.playposition, this.editor.caretpos, 'audio_speed');
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
        this.audiomanager.playposition, this.editor.caretpos, 'audio_volume');
    }
  }

  public doit = (direction: string) => {
    if (this.audiomanager.audioplaying) {
      this.loupe.viewer.stopPlayback();
    }
    this.save();
    if (direction !== 'down') {
      this.goToSegment(direction);
      setTimeout(() => {
        this.audiochunk.startpos = this.audiochunk.time.start.clone();
        this.loupe.viewer.startPlayback();
      }, 500);
    } else {
      this.save();
      this.close();
    }
  };

  onKeyDown = ($event) => {
    switch ($event.comboKey) {
      case ('SHIFT + ARROWRIGHT'):
        this.doit('right');
        break;
      case ('SHIFT + ARROWLEFT'):
        this.doit('left');
        break;
      case ('SHIFT + ARROWDOWN'):
        this.doit('down');
        break;
      case ('ESC'):
        this.doit('down');
        break;
    }
  };

  onBoundaryClicked(samples: number) {
    const i: number = this.temp_segments.getSegmentBySamplePosition(samples);

    if (i > -1) {
      const start = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.samples : 0;
      this.audiochunk.startpos = new AudioTime(start, this.audiomanager.ressource.info.samplerate);
      this.audiochunk.selection.end = this.transcrService.currentlevel.segments.get(i).time.clone();
      this.loupe.update();
      this.loupe.viewer.startPlayback().then(() => {
        // set start pos and playback length to end of audio file
        this.audiochunk.startpos = this.audiochunk.playposition.clone();
      }).catch(() => {
      });
    }
  }

  afterTyping(status) {
    if (status === 'stopped') {
      this.saveTranscript();
      this.highlight();
    }
  }

  saveTranscript() {
    const seg_start = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(this.audiochunk.time.start.samples + 20);

    this.temp_segments = this.transcrService.currentlevel.segments.clone();
    // TODO ! left and rigt boundary must not be changed !
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');
    // split text at the position of every boundary marker
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

    for (let i = 0; i < seg_texts.length - 1; i++) {
      const new_raw = this.transcrService.htmlToRaw(seg_texts[i]);

      this.temp_segments.add(samples_array[i], new_raw);
    }

    // shift rest of text to next segment
    if (!isNullOrUndefined(this.temp_segments.get(seg_start + seg_texts.length - 1))) {
      this.temp_segments.get(seg_start + seg_texts.length - 1).transcript = seg_texts[seg_texts.length - 1];
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
