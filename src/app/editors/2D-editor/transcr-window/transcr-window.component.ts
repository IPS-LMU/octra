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
import {TranscrEditorComponent} from '../../../core/component/transcr-editor';
import {Segments} from '../../../core/obj/Annotation';
import {BrowserAudioTime, BrowserSample, Segment, SubscriptionManager} from '../../../core/shared';
import {isNullOrUndefined} from '../../../core/shared/Functions';

import {
  AppStorageService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../../core/shared/service';
import {ASRProcessStatus, ASRQueueItem, ASRQueueItemType, AsrService} from '../../../core/shared/service/asr.service';
import {AudioNavigationComponent} from '../../../media-components/components/audio/audio-navigation';
import {AudioviewerConfig} from '../../../media-components/components/audio/audioviewer';
import {LoupeComponent} from '../../../media-components/components/audio/loupe';
import {AudioRessource, AudioSelection} from '../../../media-components/obj/media/audio';
import {AudioChunk, AudioManager} from '../../../media-components/obj/media/audio/AudioManager';

@Component({
  selector: 'app-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy, OnChanges {
  get loading(): boolean {
    return this._loading;
  }

  get validationEnabled(): boolean {
    return this._validationEnabled;
  }

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

  private _validationEnabled = false;
  private _loading = false;

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
          if (this.audiomanager.hasPlayed) {
            this.transcrService.tasksBeforeSend.push(new Promise<void>((resolve) => {
              this.save();

              if (this.oldRaw === this.editor.rawText) {
                this.appStorage.saving.emit('success');
              }

              this.close();
              resolve();
            }));
          }
        }

      }));
    }

    if (!isNullOrUndefined(this.settingsService.appSettings.octra.plugins) &&
      !isNullOrUndefined(this.settingsService.appSettings.octra.plugins.asr)
      && this.settingsService.appSettings.octra.plugins.asr.enabled) {
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
  }

  @ViewChild('loupe', {static: true}) loupe: LoupeComponent;
  @ViewChild('editor', {static: true}) editor: TranscrEditorComponent;
  @ViewChild('audionav', {static: true}) audionav: AudioNavigationComponent;
  @ViewChild('window', {static: true}) window: ElementRef;
  @ViewChild('main', {static: true}) main: ElementRef;

  @Output() act: EventEmitter<string> = new EventEmitter<string>();
  @Input() easymode = false;
  @Input() audiochunk: AudioChunk;
  @Input() segmentIndex: number;

  public get mainSize(): {
    width: number,
    height: number
  } {
    if (!isNullOrUndefined(this.main)) {
      return {
        width: this.main.nativeElement.clientWidth,
        height: this.main.nativeElement.clientHeight
      };
    } else {
      return {
        width: 0,
        height: 0
      }
    }
  }

  private showWindow = false;
  private subscrmanager: SubscriptionManager;
  private tempSegments: Segments;
  public loupeSettings = new AudioviewerConfig();

  private oldRaw = '';

  public doit = (direction: string) => {
    this._loading = true;
    this.cd.markForCheck();
    this.cd.detectChanges();

    new Promise<void>((resolve) => {
      setTimeout(() => {
        this._validationEnabled = false;
        this.editor.updateRawText();
        this.save();
        this.setValidationEnabledToDefault();

        if (this.audiomanager.isPlaying) {
          this.loupe.viewer.stopPlayback(() => {
            resolve();
          });
        } else {
          resolve();
        }
      }, 50);
      // timeout to show loading status correctly
    }).then(() => {
      if (direction !== 'down') {
        this.goToSegment(direction);
        setTimeout(() => {
          this.loupe.viewer.startPlayback();
        }, 500);
      } else {
        this.close();
      }
      this._loading = false;
    });
  };

  onKeyDown = ($event) => {
    if (!this.loading) {
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
  }

  ngOnInit() {
    this._loading = false;
    this.setValidationEnabledToDefault();

    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.special_markers.boundary = true;
    this.loupe.name = 'transcr-window viewer';
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

  private setValidationEnabledToDefault() {
    this._validationEnabled = this.appStorage.usemode !== 'url'
      && (this.appStorage.usemode === 'demo' || this.settingsService.projectsettings.octra.validationEnabled);
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
          this.setValidationEnabledToDefault();
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

    const startSample = (this.segmentIndex > 0) ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value : 0;

    this.uiService.addElementFromEvent('segment', {
        value: 'exited'
      }, Date.now(), this.loupe.viewer.av.PlayCursor.timePos, -1, null,
      {
        start: startSample,
        length: this.transcrService.currentlevel.segments.get(this.segmentIndex).time.originalSample.value - startSample
      }, 'transcription window');

    this.act.emit('close');
  }

  public open() {
    this.showWindow = true;
  }

  openOverview() {
    this.act.emit('overview');
  }

  save() {
    this.saveTranscript();

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

        let selection = null;
        if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= startSample
          && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.time.originalSample.value) {
          selection = {
            start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
            length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
          };
        }
      }
    } else {
      const isNull = isNullOrUndefined(this.transcrService.currentlevel.segments);
      console.log(`could not save segment. segment index=${this.segmentIndex},
segments=${isNull}, ${this.transcrService.currentlevel.segments.length}`);
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.appStorage.logging) {
      let segment = {
        start: -1,
        length: 0
      };

      if (this.segmentIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
        segment.start = 0;
        if (this.segmentIndex > 0) {
          segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
        }

        segment.length = annoSegment.time.originalSample.value - segment.start;

        segment.start = Math.round(segment.start);
        segment.length = Math.round(segment.length);
      }

      let selection = null;
      if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
        && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
        selection = {
          start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
          length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
        };
      }

      this.uiService.addElementFromEvent('mouseclick', {value: event.type},
        event.timestamp, this.audiomanager.playposition,
        this.editor.caretpos, selection, segment, 'audio_buttons');
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
    this.editor.isTyping = false;

    if (this.segmentIndex > -1 && this.transcrService.currentlevel.segments &&
      this.segmentIndex < this.transcrService.currentlevel.segments.length) {
      const segmentsLength = this.transcrService.currentlevel.segments.length;

      let segment: Segment = null;

      let startIndex = 0;
      let limitFunc: (i: number) => boolean;
      let counterFunc: (i: number) => number;
      let appliedDirection = '';

      if (direction === 'right' && this.segmentIndex < segmentsLength - 1) {
        startIndex = this.segmentIndex + 1;
        limitFunc = j => j < segmentsLength;
        counterFunc = j => j + 1;
        appliedDirection = 'right';
      } else if (direction === 'left' && this.segmentIndex > 0) {
        startIndex = this.segmentIndex - 1;
        limitFunc = j => j >= 0;
        counterFunc = j => j - 1;
        appliedDirection = 'left';
      }

      if (appliedDirection !== '') {
        for (let i = startIndex; limitFunc(i); i = counterFunc(i)) {
          const tempSegment = this.transcrService.currentlevel.segments.get(i);

          if (tempSegment.transcript !== this.transcrService.breakMarker.code
            && tempSegment.isBlockedBy !== ASRQueueItemType.ASRMAUS
            && tempSegment.isBlockedBy !== ASRQueueItemType.MAUS) {
            segment = tempSegment;
            this.segmentIndex = i;
            break;
          }
        }

        const start = (this.segmentIndex > 0) ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value : 0;
        const valueString = (appliedDirection === 'right') ? 'entered next' : 'entered previous';
        this.uiService.addElementFromEvent('segment', {value: valueString},
          Date.now(), this.audiomanager.playposition,
          this.editor.caretpos, null, {
            start,
            length: this.transcrService.currentlevel.segments.get(this.segmentIndex).time.originalSample.value - start
          }, 'transcription window');
      }

      let begin;
      if (this.segmentIndex > 0) {
        begin = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.clone() as BrowserAudioTime;
      } else {
        begin = this.audiomanager.createBrowserAudioTime(0);
      }

      if (!(segment === null || segment === undefined)) {
        const volume = this.audiochunk.volume;
        const speed = this.audiochunk.speed;

        this.editor.initialize();
        this.editor.rawText = this.transcrService.currentlevel.segments.get(this.segmentIndex).transcript;
        this.audiochunk = new AudioChunk(new AudioSelection(begin, segment.time.clone()), this.audiochunk.audiomanager);
        this.audiochunk.volume = volume;
        this.audiochunk.speed = speed;
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
      length: 0
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
      }

      segment.length = annoSegment.time.originalSample.value - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
      && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
      selection = {
        start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
        length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
      };
    }

    this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, selection, segment, type);
  }

  onMarkerInsert(markerCode: string) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
      }

      segment.length = annoSegment.time.originalSample.value - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
      && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
      selection = {
        start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
        length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
      };
    }

    this.uiService.addElementFromEvent('shortcut', {value: markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, selection, segment, 'markers');
  }

  onMarkerClick(markerCode: string) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
      }

      segment.length = annoSegment.time.originalSample.value - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
      && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
      selection = {
        start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
        length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
      };
    }

    this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, selection, segment, 'texteditor_toolbar');
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
      }

      segment.length = annoSegment.time.originalSample.value - segment.start;
      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
      && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
      selection = {
        start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
        length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
      };
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, selection, segment, 'audio_speed');

  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audiochunk.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.originalSample.value;
      }

      segment.length = annoSegment.time.originalSample.value - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.viewer.av.drawnselection.start.originalSample.value >= segment.start
      && this.loupe.viewer.av.drawnselection.end.originalSample.value <= segment.start + segment.length) {
      selection = {
        start: this.loupe.viewer.av.drawnselection.start.originalSample.value,
        length: this.loupe.viewer.av.drawnselection.duration.originalSample.value
      };
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audiomanager.playposition, this.editor.caretpos, selection, segment, 'audio_volume');
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

  onBoundaryInserted() {
    this.uiService.addElementFromEvent('segment', {value: 'boundaries:add'}, Date.now(),
      this.audiomanager.playposition, this.editor.caretpos, null, null, 'texteditor');
  }

  afterTyping(status) {
    if (status === 'started') {
      this.oldRaw = this.editor.rawText;
    }

    if (status === 'stopped') {
      if (this.oldRaw === this.editor.rawText) {
        // this.appStorage.savingNeeded = false;
      }

      // this.highlight();
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
      && (nextSegment.transcript === this.transcrService.breakMarker.code
        || nextSegment.isBlockedBy === ASRQueueItemType.ASRMAUS
        || nextSegment.isBlockedBy === ASRQueueItemType.MAUS);
  }

  public onKeyUp() {
    this.appStorage.savingNeeded = true;
  }
}
