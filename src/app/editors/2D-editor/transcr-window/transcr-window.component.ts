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

import {
  AppStorageService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../../core/shared/service';
import {BrowserAudioTime, BrowserSample, Segment, SubscriptionManager} from '../../../core/shared';
import {AudioChunk, AudioRessource, AudioSelection} from '../../../media-components/obj/media/audio';
import {Segments} from '../../../core/obj/Annotation';
import {TranscrEditorComponent} from '../../../core/component/transcr-editor';
import {LoupeComponent} from '../../../media-components/components/audio/loupe';
import {AudioNavigationComponent} from '../../../media-components/components/audio/audio-navigation';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {isNullOrUndefined} from '../../../core/shared/Functions';

@Component({
  selector: 'app-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.css']
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy, OnChanges {

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

  get app_settings(): any {
    return this.settingsService.appSettings;
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

  constructor(public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService,
              private appStorage: AppStorageService) {

    this.subscrmanager = new SubscriptionManager();
  }

  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('editor') editor: TranscrEditorComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;
  @ViewChild('window') window: ElementRef;
  @Output() act: EventEmitter<string> = new EventEmitter<string>();
  @Input() easymode = false;
  public pos_y = 0;
  @Input() audiochunk: AudioChunk;
  @Input() segment_index: number;
  private showWindow = false;
  private subscrmanager: SubscriptionManager;
  private temp_segments: Segments;
  public doit = (direction: string) => {
    this.save();

    new Promise<void>((resolve, reject) => {
      if (this.audiomanager.isPlaying) {
        this.loupe.viewer.stopPlayback(() => {
          resolve();
        });
      } else {
        resolve();
      }
    }).then(() => {
      if (direction !== 'down') {
        this.goToSegment(direction);
        setTimeout(() => {
          this.loupe.viewer.startPlayback();
        }, 500);
      } else {
        this.close();
      }
    });
  }

  onKeyDown = ($event) => {
    switch ($event.comboKey) {
      case ('ALT + ARROWRIGHT'):
        $event.event.preventDefault();
        if (!this.isNextSegmentLastAndBreak(this.segment_index)
          && this.segment_index < this.transcrService.currentlevel.segments.length - 1) {
          this.doit('right');
        } else {
          this.save();
          this.close();
          this.act.emit('overview');
        }
        break;
      case ('ALT + ARROWLEFT'):
        $event.event.preventDefault();
        this.doit('left');
        break;
      case ('ALT + ARROWDOWN'):
        $event.event.preventDefault();
        this.doit('down');
        break;
      case ('ESC'):
        this.doit('down');
        break;
    }
  }

  ngOnInit() {
    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.special_markers.boundary = true;
    this.loupe.viewer.Settings.justifySignalHeight = true;

    // remove annoying shortcut for break marker
    this.loupe.Settings.shortcuts['set_break'] = null;
    this.loupe.viewer.roundValues = false;
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
        if (((previous === null || previous === undefined) && !(current === null || current === undefined)) ||
          (current.time.start.browserSample.value !== previous.time.start.browserSample.value &&
            current.time.end.browserSample.value !== previous.time.end.browserSample.value)) {
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
    this.loupe.zoomY = 6;
    this.audiochunk.startpos = <BrowserAudioTime>this.audiochunk.time.start.clone();

    setTimeout(() => {
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

  openOverview() {
    this.act.emit('overview');
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
        const segment = this.transcrService.currentlevel.segments.get(this.segment_index).clone();
        segment.transcript = this.editor.rawText;
        this.transcrService.currentlevel.segments.change(this.segment_index, segment);
        const startSample = (this.segment_index > 0)
          ? this.transcrService.currentlevel.segments.get(this.segment_index - 1).time.originalSample.value
          : 0;
        this.uiService.addElementFromEvent('transcription:segment_exited', {
            value: {
              segment: {
                start: startSample,
                length: segment.time.originalSample.value - startSample,
                transcript: segment.transcript
              }
            }
          }, Date.now(), null, -1, '2D-Editor',
          {
            start: startSample,
            length: segment.time.originalSample.value - startSample,
            textlength: segment.transcript.length
          });
      }
    } else {
      const isNull = isNullOrUndefined(this.transcrService.currentlevel.segments);
      console.log(`could not save segment. segment index=${this.segment_index},
segments=${isNull}, ${this.transcrService.currentlevel.segments.length}`);
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.segment_index > -1) {
        const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
        segment.start = anno_segment.time.originalSample.value;
        segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
          - anno_segment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

        segment.start = Math.round(segment.start);
        segment.length = Math.round(segment.length);
        segment.textlength = this.editor.rawText.length;
      }

      this.uiService.addElementFromEvent('mouse_clicked', {value: event.type},
        event.timestamp, this.audiomanager.playposition,
        this.editor.caretpos, 'audio_buttons', segment);
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
      const segments_length = this.transcrService.currentlevel.segments.length;

      let segment: Segment = null;

      if (direction === 'right' && this.segment_index < segments_length - 1) {
        let i = this.segment_index + 1;
        for (i = this.segment_index + 1; i < segments_length - 1; i++) {
          if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.break_marker.code) {
            segment = this.transcrService.currentlevel.segments.get(i);
            this.segment_index = i;
            break;
          }
        }

        if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.break_marker.code) {
          segment = this.transcrService.currentlevel.segments.get(i);
          this.segment_index = i;
        }
      } else if (direction === 'left' && this.segment_index > 0) {
        let i = this.segment_index - 1;
        for (i = this.segment_index - 1; i > 0; i--) {
          if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.break_marker.code) {
            segment = this.transcrService.currentlevel.segments.get(i);
            this.segment_index = i;
            break;
          }
        }

        if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.break_marker.code) {
          segment = this.transcrService.currentlevel.segments.get(i);
          this.segment_index = i;
        }
      }

      let begin = this.audiomanager.createBrowserAudioTime(0);

      if (this.segment_index > 0) {
        begin = <BrowserAudioTime>this.transcrService.currentlevel.segments.get(this.segment_index - 1).time.clone();
      }

      if (!(segment === null || segment === undefined)) {
        this.editor.rawText = this.transcrService.currentlevel.segments.get(this.segment_index).transcript;
        this.audiochunk = new AudioChunk(new AudioSelection(begin, segment.time.clone()), this.audiochunk.audiomanager);
      }
    }
  }

  public editor_rawText(text: string) {
    this.editor.rawText = text;
  }

  onShortCutTriggered($event, type) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segment_index > -1) {
      const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
      segment.start = anno_segment.time.originalSample.value;
      segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
        - anno_segment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, type, segment);
  }

  onMarkerInsert(marker_code: string) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segment_index > -1) {
      const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
      segment.start = anno_segment.time.originalSample.value;
      segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
        - anno_segment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('shortcut', {value: marker_code}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'markers', segment);
  }

  onMarkerClick(marker_code: string) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segment_index > -1) {
      const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
      segment.start = anno_segment.time.originalSample.value;
      segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
        - anno_segment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('mouse_clicked', {value: marker_code}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor_toolbar', segment);
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segment_index > -1) {
      const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
      segment.start = anno_segment.time.originalSample.value;
      segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
        - anno_segment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, 'audio_speed', segment);

  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segment_index > -1) {
      const anno_segment = this.transcrService.currentlevel.segments.get(this.segment_index);
      segment.start = anno_segment.time.originalSample.value;
      segment.length = (this.segment_index < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segment_index + 1).time.originalSample.value
        - anno_segment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - anno_segment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, 'audio_volume', segment);
  }

  onBoundaryClicked(sample: BrowserSample) {
    const i: number = this.temp_segments.getSegmentBySamplePosition(sample);

    if (i > -1) {
      this.audiochunk.startpos = (i > 0) ? <BrowserAudioTime>this.temp_segments.get(i - 1).time.clone()
        : this.audiomanager.createBrowserAudioTime(0);
      this.audiochunk.selection.end = this.temp_segments.get(i).time.clone();
      this.loupe.viewer.av.drawnselection = this.audiochunk.selection;
      this.loupe.viewer.drawSegments();
      this.loupe.viewer.startPlayback();
    }
  }

  afterTyping(status) {
    if (status === 'stopped') {
      this.saveTranscript();
      this.highlight();
    }
  }

  saveTranscript() {
    const seg_start = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this.audiochunk.time.start.browserSample.add(new BrowserSample(20, this.audiomanager.browserSampleRate))
    );

    this.temp_segments = this.transcrService.currentlevel.segments.clone();
    // TODO ! left and rigt boundary must not be changed !
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');
    // split text at the position of every boundary marker
    let seg_texts: string[] = html.split(
      /\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="[0-9]+" alt="\[\|[0-9]+\|\]">\s?/g
    );

    const samples_array: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s?/g,
      function (match, g1, g2) {
        samples_array.push(Number(g1));
        return '';
      });

    seg_texts = seg_texts.map((a: string) => {
      return a.replace(/(<span>)|(<\/span>)|(<p>)|(<\/p>)/g, '');
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

      this.temp_segments.add(
        this.audiomanager.createBrowserAudioTime(samples_array[i]), new_raw
      );
    }

    // shift rest of text to next segment
    const found = this.temp_segments.get(seg_start + seg_texts.length - 1);

    if (!(found === null || found === undefined)) {
      this.temp_segments.get(seg_start + seg_texts.length - 1).transcript = seg_texts[seg_texts.length - 1];
    }
  }


  public highlight() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');

    const samples_array: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s?/g,
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

  /**
   * checks if next segment is the last one and contains only a break.
   * @param segment_index
   */
  public isNextSegmentLastAndBreak(segment_index: number) {
    const currentLevel = this.transcrService.currentlevel;
    const nextSegment = currentLevel.segments.get(segment_index + 1);
    return segment_index === currentLevel.segments.length - 2
      && nextSegment.transcript === this.transcrService.break_marker.code;
  }
}
