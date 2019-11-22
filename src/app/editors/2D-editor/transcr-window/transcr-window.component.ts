import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import {AudioRessource, AudioSelection} from '../../../media-components/obj/media/audio';
import {Segments} from '../../../core/obj/Annotation';
import {TranscrEditorComponent} from '../../../core/component/transcr-editor';
import {LoupeComponent} from '../../../media-components/components/audio/loupe';
import {AudioNavigationComponent} from '../../../media-components/components/audio/audio-navigation';
import {AudioChunk, AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {isNullOrUndefined} from '../../../core/shared/Functions';
import {AudioviewerConfig} from '../../../media-components/components/audio/audioviewer';
import {ASRProcessStatus, ASRQueueItem, AsrService} from '../../../core/shared/service/asr.service';

@Component({
  selector: 'app-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy, OnChanges {

  @Output('shortcuttriggered')
  get shortcuttriggered(): EventEmitter<string> {
    return this.loupe.shortcuttriggered;
  }

  @Output('marker_insert')
  get marker_insert(): EventEmitter<string> {
    return this.editor.markerInsert;
  }

  @Output('marker_click')
  get marker_click(): EventEmitter<string> {
    return this.editor.markerClick;
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

  public get hasSegmentBoundaries() {
    return !isNullOrUndefined(this.editor.rawText.match(/{[0-9]+}/));
  }

  constructor(public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              public cd: ChangeDetectorRef,
              private asrService: AsrService) {

    this.subscrmanager = new SubscriptionManager();

    if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
      this.subscrmanager.add(this.keyMap.beforeKeyDown.subscribe((event) => {
        if (event.comboKey === 'ALT + SHIFT + 1' ||
          event.comboKey === 'ALT + SHIFT + 2' ||
          event.comboKey === 'ALT + SHIFT + 3') {
          this.transcrService.tasksBeforeSend.push(new Promise<void>((resolve) => {
            this.saveTranscript();
            this.save();

            if (this.oldRaw === this.editor.rawText) {
              this.appStorage.saving.emit('success');
            }

            this.close();
            resolve();
          }));
        }

      }));
    }

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        if (item.time.sampleStart === this.audiochunk.time.start.originalSample.value
          && item.time.sampleLength === this.audiochunk.time.duration.originalSample.value) {
          if (item.status === ASRProcessStatus.FINISHED && item.result !== null) {
            this.editor.rawText = item.result;
          }
          this.loupe.update(false);

          this.cd.markForCheck();
          this.cd.detectChanges();
        }
      },
      (error) => {
        console.error(error);
      },
      () => {
      }));
  }

  @ViewChild('loupe', {static: true}) loupe: LoupeComponent;
  @ViewChild('editor', {static: true}) editor: TranscrEditorComponent;
  @ViewChild('audionav', {static: true}) audionav: AudioNavigationComponent;
  @ViewChild('window', {static: true}) window: ElementRef;
  @Output() act: EventEmitter<string> = new EventEmitter<string>();
  @Input() easymode = false;
  @Input() audiochunk: AudioChunk;
  @Input() segmentIndex: number;

  private showWindow = false;
  private subscrmanager: SubscriptionManager;
  private tempSegments: Segments;
  public loupeSettings = new AudioviewerConfig();

  private oldRaw = '';

  public doit = (direction: string) => {
    this.save();

    new Promise<void>((resolve) => {
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
        if (this.hasSegmentBoundaries || (!this.isNextSegmentLastAndBreak(this.segmentIndex)
          && this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)) {
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
    this.loupe.viewer.name = 'transcription window';
    this.loupeSettings.justifySignalHeight = true;
    this.loupeSettings.boundaries.enabled = false;
    this.loupeSettings.boundaries.readonly = true;
    this.loupeSettings.shortcuts.set_break = null;
    this.loupeSettings.frame.color = '#222222';
    this.loupeSettings.roundValues = false;
    this.loupe.viewer.av.drawnselection = null;

    const segments = this.transcrService.currentlevel.segments;
    this.tempSegments = segments.clone();
    this.subscrmanager.add(this.editor.loaded.subscribe(
      () => {
        if (this.segmentIndex > -1 && this.transcrService.currentlevel.segments &&
          this.segmentIndex < this.transcrService.currentlevel.segments.length) {
          this.editor_rawText(this.transcrService.currentlevel.segments.get(this.segmentIndex).transcript);
        }
      }
    ));

    this.cd.markForCheck();
    this.cd.detectChanges();

    this.loupe.update(true);
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
    this.loupe.zoomY = 6;
    this.audiochunk.startpos = this.audiochunk.time.start.clone() as BrowserAudioTime;
    this.loupe.viewer.av.drawnselection = new AudioSelection(
      this.audiomanager.createBrowserAudioTime(0),
      this.audiomanager.createBrowserAudioTime(0)
    );

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
    console.log(`SAVE from transcr window`);
    if (this.segmentIndex > -1 && this.transcrService.currentlevel.segments &&
      this.segmentIndex < this.transcrService.currentlevel.segments.length) {
      if (this.editor.html.indexOf('<img src="assets/img/components/transcr-editor/boundary.png"') > -1) {
        // boundaries were inserted
        this.transcrService.currentlevel.segments.segments = this.tempSegments.segments;
        this.transcrService.currentlevel.segments.onsegmentchange.emit(null);
      } else {
        // no boundaries inserted
        const segment = this.transcrService.currentlevel.segments.get(this.segmentIndex).clone();
        this.editor.updateRawText();
        segment.transcript = this.editor.rawText;
        segment.isBlockedBy = this.transcrService.currentlevel.segments.get(this.segmentIndex).isBlockedBy;
        const result = this.transcrService.currentlevel.segments.change(this.segmentIndex, segment);

        const startSample = (this.segmentIndex > 0)
          ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value
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
      console.log(`could not save segment. segment index=${this.segmentIndex},
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

      if (this.segmentIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

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
   */
  goToSegment(direction: string) {
    if (this.segmentIndex > -1 && this.transcrService.currentlevel.segments &&
      this.segmentIndex < this.transcrService.currentlevel.segments.length) {
      const segmentsLength = this.transcrService.currentlevel.segments.length;

      let segment: Segment = null;

      if (direction === 'right' && this.segmentIndex < segmentsLength - 1) {
        let i;
        for (i = this.segmentIndex + 1; i < segmentsLength - 1; i++) {
          if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.breakMarker.code) {
            segment = this.transcrService.currentlevel.segments.get(i);
            this.segmentIndex = i;
            break;
          }
        }

        if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.breakMarker.code) {
          segment = this.transcrService.currentlevel.segments.get(i);
          this.segmentIndex = i;
        }
      } else if (direction === 'left' && this.segmentIndex > 0) {
        let i = this.segmentIndex - 1;
        for (i = this.segmentIndex - 1; i > 0; i--) {
          if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.breakMarker.code) {
            segment = this.transcrService.currentlevel.segments.get(i);
            this.segmentIndex = i;
            break;
          }
        }

        if (this.transcrService.currentlevel.segments.get(i).transcript !== this.transcrService.breakMarker.code) {
          segment = this.transcrService.currentlevel.segments.get(i);
          this.segmentIndex = i;
        }
      }

      let begin = this.audiomanager.createBrowserAudioTime(0);

      if (this.segmentIndex > 0) {
        begin = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.clone() as BrowserAudioTime;
      }

      if (!(segment === null || segment === undefined)) {
        this.editor.rawText = this.transcrService.currentlevel.segments.get(this.segmentIndex).transcript;
        this.audiochunk = new AudioChunk(new AudioSelection(begin, segment.time.clone()), this.audiochunk.audiomanager);
      }
      this.cd.markForCheck();
      this.cd.detectChanges();
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

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = annoSegment.time.originalSample.value;
      segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
        - annoSegment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, type, segment);
  }

  onMarkerInsert(markerCode: string) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = annoSegment.time.originalSample.value;
      segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
        - annoSegment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('shortcut', {value: markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'markers', segment);
  }

  onMarkerClick(markerCode: string) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = annoSegment.time.originalSample.value;
      segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
        - annoSegment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('mouse_clicked', {value: markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, 'texteditor_toolbar', segment);
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    const segment = {
      start: -1,
      length: -1,
      textlength: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = annoSegment.time.originalSample.value;
      segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
        - annoSegment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

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

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = annoSegment.time.originalSample.value;
      segment.length = (this.segmentIndex < this.transcrService.currentlevel.segments.length - 1)
        ? this.transcrService.currentlevel.segments.get(this.segmentIndex + 1).time.originalSample.value
        - annoSegment.time.originalSample.value
        : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
      segment.textlength = this.editor.rawText.length;
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, 'audio_volume', segment);
  }

  onBoundaryClicked(sample: BrowserSample) {
    const i: number = this.tempSegments.getSegmentBySamplePosition(sample);

    if (i > -1) {
      this.audiochunk.startpos = (i > 0) ? this.tempSegments.get(i - 1).time.clone() as BrowserAudioTime
        : this.audiomanager.createBrowserAudioTime(0);
      this.audiochunk.selection.end = this.tempSegments.get(i).time.clone();
      this.loupe.viewer.av.drawnselection = this.audiochunk.selection;
      this.loupe.viewer.drawSegments();
      this.loupe.viewer.startPlayback();
    }
  }

  afterTyping(status) {
    if (status === 'started') {
      this.oldRaw = this.editor.rawText;
    }

    if (status === 'stopped') {
      if (this.oldRaw === this.editor.rawText) {
        this.appStorage.savingNeeded = false;
        this.oldRaw = this.editor.rawText;
      }

      this.saveTranscript();
      this.highlight();
    }
  }

  saveTranscript() {
    const segStart = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this.audiochunk.time.start.browserSample.add(new BrowserSample(20, this.audiomanager.browserSampleRate))
    );

    this.tempSegments = this.transcrService.currentlevel.segments.clone();
    const html = this.editor.getRawText();
    // split text at the position of every boundary marker
    const segTexts: string[] = html.split(
      /\s?{[0-9]+}\s?/g
    );

    const samplesArray: number[] = [];
    html.replace(/\s?{([0-9]+)}\s?/g,
      (match, g1, g2) => {
        samplesArray.push(Number(g1));
        return '';
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

    for (let i = 0; i < segTexts.length - 1; i++) {
      this.tempSegments.add(
        this.audiomanager.createBrowserAudioTime(samplesArray[i]), segTexts[i]
      );
    }

    // shift rest of text to next segment
    const found = this.tempSegments.get(segStart + segTexts.length - 1);

    if (!(found === null || found === undefined)) {
      this.tempSegments.get(segStart + segTexts.length - 1).transcript = segTexts[segTexts.length - 1];
    }
  }


  public highlight() {
    const html: string = this.editor.html.replace(/&nbsp;/g, ' ');

    const samplesArray: number[] = [];
    html.replace(/\s?<img src="assets\/img\/components\/transcr-editor\/boundary.png"[\s\w="-:;äüößÄÜÖ]*data-samples="([0-9]+)" alt="\[\|[0-9]+\|\]">\s?/g,
      function (match, g1, g2) {
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

  /**
   * checks if next segment is the last one and contains only a break.
   */
  public isNextSegmentLastAndBreak(segmentIndex: number) {
    const currentLevel = this.transcrService.currentlevel;
    const nextSegment = currentLevel.segments.get(segmentIndex + 1);
    return segmentIndex === currentLevel.segments.length - 2
      && nextSegment.transcript === this.transcrService.breakMarker.code;
  }

  public onKeyUp() {
    this.appStorage.savingNeeded = true;
  }
}
