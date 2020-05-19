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
import {SubscriptionManager} from '../../../core/shared';
import {TranscrEditorComponent} from '../../../core/component/transcr-editor';
import {isUnset} from '../../../core/shared/Functions';
import {ASRProcessStatus, ASRQueueItem, AsrService} from '../../../core/shared/service/asr.service';
import {AudioNavigationComponent, AudioViewerComponent} from 'octra-components';
import {AudioChunk, AudioManager} from 'octra-components';
import {Segment, Segments} from 'octra-components';
import {AudioRessource, AudioSelection, SampleUnit} from 'octra-components';
import {ASRQueueItemType} from 'octra-components';

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

  get audioManager(): AudioManager {
    return this.audiochunk.audioManager;
  }

  get ressource(): AudioRessource {
    return this.audiochunk.audioManager.ressource;
  }

  public get hasSegmentBoundaries() {
    return !isUnset(this.editor.rawText.match(/{[0-9]+}/));
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
          this.transcrService.tasksBeforeSend.push(new Promise<void>((resolve) => {
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
        if (item.time.sampleStart === this.audiochunk.time.start.samples
          && item.time.sampleLength === this.audiochunk.time.duration.samples) {
          if (item.status === ASRProcessStatus.FINISHED && item.result !== null) {
            this.editor.rawText = item.result;
          }
          // TODO update needed?
          // this.loupe.update(false);

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

  @ViewChild('loupe', {static: true}) loupe: AudioViewerComponent;
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
    if (!isUnset(this.main)) {
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

  private oldRaw = '';

  public doDirectionAction = (direction: string) => {
    this._loading = true;
    this.cd.markForCheck();
    this.cd.detectChanges();

    new Promise<void>((resolve) => {
      // timeout to show loading status correctly
      setTimeout(() => {
        this._validationEnabled = false;
        this.editor.updateRawText();
        this.save();
        this.setValidationEnabledToDefault();

        if (this.audioManager.isPlaying) {
          this.audiochunk.stopPlayback().then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      }, 50);
    }).then(() => {
      if (direction !== 'down') {
        this.goToSegment(direction).then(() => {
          this.audiochunk.startPlayback();
          this.cd.markForCheck();
          this.cd.detectChanges();
        }).catch((error) => {
          console.error(error);
        });
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
            this.doDirectionAction('right');
          } else {
            this.save();
            this.close();
            this.act.emit('overview');
          }
          break;
        case ('ALT + ARROWLEFT'):
          $event.event.preventDefault();
          this.doDirectionAction('left');
          break;
        case ('ALT + ARROWDOWN'):
          $event.event.preventDefault();
          this.doDirectionAction('down');
          break;
        case ('ESC'):
          this.doDirectionAction('down');
          break;
      }
    }
  }

  ngOnInit() {
    this._loading = false;
    console.log(`INIT TRANSCR WINDOW!`);
    this.setValidationEnabledToDefault();

    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;
    this.editor.Settings.special_markers.boundary = true;
    this.loupe.name = 'transcr-window viewer';
    this.loupe.settings.margin.bottom = 0;
    this.loupe.settings.justifySignalHeight = true;
    this.loupe.settings.boundaries.enabled = false;
    this.loupe.settings.boundaries.readonly = true;
    this.loupe.settings.selection.enabled = true;
    this.loupe.settings.shortcuts.set_break = null;
    this.loupe.settings.frame.color = '#222222';
    this.loupe.settings.roundValues = false;
    this.loupe.av.drawnSelection = null;

    const segments = this.transcrService.currentlevel.segments;
    this.tempSegments = segments.clone();
    this.subscrmanager.add(this.editor.loaded.subscribe(
      () => {
        if (this.segmentIndex > -1 && this.transcrService.currentlevel.segments &&
          this.segmentIndex < this.transcrService.currentlevel.segments.length) {
          this.editor_rawText(this.transcrService.currentlevel.segments.get(this.segmentIndex).transcript);
        }
        this.subscrmanager.removeByTag('editor');
      }
    ), 'editor');

    this.cd.markForCheck();
    this.cd.detectChanges();

    // TODO important update needed?
    // this.loupe.update(true);
    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  private

  setValidationEnabledToDefault() {
    this._validationEnabled = this.appStorage.usemode !== 'url'
      && (this.appStorage.usemode === 'demo' || this.settingsService.projectsettings.octra.validationEnabled);
  }

  ngOnChanges(obj) {
    if (obj.hasOwnProperty('audiochunk')) {
      const previous: AudioChunk = obj.audiochunk.previousValue;
      const current: AudioChunk = obj.audiochunk.currentValue;

      if (!isUnset(current)) {
        if (((previous === null || previous === undefined) && !(current === null || current === undefined)) ||
          (
            current.time.start.samples !== previous.time.start.samples &&
            current.time.end.samples !== previous.time.end.samples
          )) {
          console.log(`_audiochunk change ok not null`);
          // audiochunk changed
          console.log(`_audiochunk changed ${current.status}`);
          this.listenToAudioChunkStatusChanges()

          this.setValidationEnabledToDefault();

          // TODO important update needed?
          // this.loupe.update();
        }
      }
    }
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngAfterViewInit() {
    this.loupe.av.zoomY = 6;
    this.audiochunk.startpos = this.audiochunk.time.start.clone();
    this.loupe.av.drawnSelection = new AudioSelection(
      this.audioManager.createSampleUnit(0),
      this.audioManager.createSampleUnit(0)
    );

    setTimeout(() => {
      this.audiochunk.startPlayback();
    }, 500);
  }

  ngAfterContentInit() {
    this.act.emit('open');
  }

  public

  close() {
    this.showWindow = false;

    const startSample = (this.segmentIndex > 0) ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples : 0;

    this.uiService.addElementFromEvent('segment', {
        value: 'exited'
      }, Date.now(), this.loupe.av.PlayCursor.timePos, -1, null,
      {
        start: startSample,
        length: this.transcrService.currentlevel.segments.get(this.segmentIndex).time.samples - startSample
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
          ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples
          : 0;

        let selection = null;
        if (this.loupe.av.drawnSelection.start.samples >= startSample
          && this.loupe.av.drawnSelection.end.samples <= segment.time.samples) {
          selection = {
            start: this.loupe.av.drawnSelection.start.samples,
            length: this.loupe.av.drawnSelection.duration.samples
          };
        }
      }
    } else {
      const isNull = isUnset(this.transcrService.currentlevel.segments);
      console.log(`could not save segment. segment index=${this.segmentIndex},
segments=${isNull}, ${this.transcrService.currentlevel.segments.length}`);
    }
  }

  onButtonClick(event
                  :
                  {
                    type: string, timestamp
                      :
                      number
                  }
  ) {
    if (this.appStorage.logging) {
      let segment = {
        start: -1,
        length: 0
      };

      if (this.segmentIndex > -1) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
        segment.start = 0;
        if (this.segmentIndex > 0) {
          segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
        }

        segment.length = annoSegment.time.samples - segment.start;

        segment.start = Math.round(segment.start);
        segment.length = Math.round(segment.length);
      }

      let selection = null;
      if (this.loupe.av.drawnSelection.start.samples >= segment.start
        && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
        selection = {
          start: this.loupe.av.drawnSelection.start.samples,
          length: this.loupe.av.drawnSelection.duration.samples
        };
      }

      this.uiService.addElementFromEvent('mouseclick', {value: event.type},
        event.timestamp, this.audioManager.playposition,
        this.editor.caretpos, selection, segment, 'audio_buttons');
    }

    // TODO important what about this?
    // this.loupe.onButtonClick(event);
  }

  /**
   * selects the next segment on the left or on the right side
   */
  goToSegment(direction: string) {
    return new Promise<void>((resolve, reject) => {
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
          counterFunc = j => j++;
          appliedDirection = 'right';
        } else if (direction === 'left' && this.segmentIndex > 0) {
          startIndex = this.segmentIndex - 1;
          limitFunc = j => j >= 0;
          counterFunc = j => j--;
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

          const start = (this.segmentIndex > 0) ? this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples : 0;
          const valueString = (appliedDirection === 'right') ? 'entered next' : 'entered previous';
          this.uiService.addElementFromEvent('segment', {value: valueString},
            Date.now(), this.audioManager.playposition,
            this.editor.caretpos, null, {
              start,
              length: this.transcrService.currentlevel.segments.get(this.segmentIndex).time.samples - start
            }, 'transcription window');
        }

        let begin;
        if (this.segmentIndex > 0) {
          begin = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.clone();
        } else {
          begin = new SampleUnit(0, this.audioManager.sampleRate);
        }

        if (!isUnset(segment)) {
          this.editor.rawText = this.transcrService.currentlevel.segments.get(this.segmentIndex).transcript;
          this.audiochunk = this.audioManager.createNewAudioChunk(new AudioSelection(begin, segment.time.clone()));

          // resolve only after the audio viewer is ready
          const subscr = this.loupe.onInitialized.subscribe(() => {
            subscr.unsubscribe();
            resolve();
          });
        } else {
          reject(new Error('can\'t got to segment, because it\'s null'));
        }
      } else {
        resolve();
      }
    });
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
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
      }

      segment.length = annoSegment.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.av.drawnSelection.start.samples >= segment.start
      && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
      selection = {
        start: this.loupe.av.drawnSelection.start.samples,
        length: this.loupe.av.drawnSelection.duration.samples
      };
    }

    this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, selection, segment, type);
  }

  onMarkerInsert(markerCode
                   :
                   string
  ) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
      }

      segment.length = annoSegment.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.av.drawnSelection.start.samples >= segment.start
      && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
      selection = {
        start: this.loupe.av.drawnSelection.start.samples,
        length: this.loupe.av.drawnSelection.duration.samples
      };
    }

    this.uiService.addElementFromEvent('shortcut', {value: markerCode}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, selection, segment, 'markers');
  }

  onMarkerClick(markerCode: string
  ) {
    let segment = {
      start: -1,
      length: -1
    };

    if (this.segmentIndex > -1) {
      const annoSegment = this.transcrService.currentlevel.segments.get(this.segmentIndex);
      segment.start = 0;
      if (this.segmentIndex > 0) {
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
      }

      segment.length = annoSegment.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.av.drawnSelection.start.samples >= segment.start
      && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
      selection = {
        start: this.loupe.av.drawnSelection.start.samples,
        length: this.loupe.av.drawnSelection.duration.samples
      };
    }

    this.uiService.addElementFromEvent('mouseclick', {value: markerCode}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, selection, segment, 'texteditor_toolbar');
  }

  onSpeedChange(event: {
    old_value: number, new_value: number, timestamp: number
  }) {
    // TODO speed?
    // this.audiochunk.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  listenToAudioChunkStatusChanges() {
    const res = this.subscrmanager.removeByTag('audiochunkStatus');
    console.log(`deleted: ${res}`);
    this.subscrmanager.add(this.audiochunk.statuschange.subscribe((status) => {
      this.cd.markForCheck();
      this.cd.detectChanges();
    }, (error) => {
      console.error(`couldn't update view for audio chunk in transcription window.`);
      console.error(error);
    }), 'audiochunkStatus');
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
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
      }

      segment.length = annoSegment.time.samples - segment.start;
      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.av.drawnSelection.start.samples >= segment.start
      && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
      selection = {
        start: this.loupe.av.drawnSelection.start.samples,
        length: this.loupe.av.drawnSelection.duration.samples
      };
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audioManager.playposition, this.editor.caretpos, selection, segment, 'audio_speed');
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
        segment.start = this.transcrService.currentlevel.segments.get(this.segmentIndex - 1).time.samples;
      }

      segment.length = annoSegment.time.samples - segment.start;

      segment.start = Math.round(segment.start);
      segment.length = Math.round(segment.length);
    }

    let selection = null;
    if (this.loupe.av.drawnSelection.start.samples >= segment.start
      && this.loupe.av.drawnSelection.end.samples <= segment.start + segment.length) {
      selection = {
        start: this.loupe.av.drawnSelection.start.samples,
        length: this.loupe.av.drawnSelection.duration.samples
      };
    }

    this.uiService.addElementFromEvent('slider_changed', event, event.timestamp,
      this.audioManager.playposition, this.editor.caretpos, selection, segment, 'audio_volume');
  }

  onBoundaryClicked(sample: SampleUnit) {
    const i: number = this.tempSegments.getSegmentBySamplePosition(sample);

    if (i > -1) {
      this.audiochunk.startpos = (i > 0) ? this.tempSegments.get(i - 1).time.clone()
        : this.audioManager.createSampleUnit(0);
      this.audiochunk.selection.end = this.tempSegments.get(i).time.clone();
      this.loupe.av.drawnSelection = this.audiochunk.selection;
      this.audiochunk.startPlayback();
    }
  }

  onBoundaryInserted() {
    this.uiService.addElementFromEvent('segment', {value: 'boundaries:add'}, Date.now(),
      this.audioManager.playposition, this.editor.caretpos, null, null, 'texteditor');
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
      this.audiochunk.time.start.add(new SampleUnit(20, this.audioManager.sampleRate))
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
        this.audioManager.createSampleUnit(samplesArray[i]), segTexts[i]
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
