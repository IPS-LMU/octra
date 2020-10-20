import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {OCTRAEditor} from '../octra-editor';
import {AudioChunk, AudioManager, AudioSelection, SampleUnit} from '@octra/media';
import {TranscrEditorComponent} from '../../core/component/transcr-editor';
import {LoginMode} from '../../core/store';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ValidationPopoverComponent} from '../../core/component/transcr-editor/validation-popover/validation-popover.component';
import {isUnset} from '@octra/utilities';
import {AudioViewerComponent, AudioviewerConfig} from '@octra/components';
import {Segments} from '@octra/annotation';

declare var validateAnnotation: any;

@Component({
  selector: 'octra-trn-editor',
  templateUrl: './trn-editor.component.html',
  styleUrls: ['./trn-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrnEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit {

  get textEditor(): { selectedSegment: number; state: string, audiochunk: AudioChunk } {
    return this._textEditor;
  }

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private sanitizer: DomSanitizer,
              private cd: ChangeDetectorRef) {
    super();
  }

  public static editorname = 'TRN-Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();
  public showSignalDisplay = false;
  public lastResizing = 0;

  @ViewChild('transcrEditor', {static: false}) transcrEditor: TranscrEditorComponent;
  @ViewChild('viewer', {static: false}) viewer: AudioViewerComponent;
  @ViewChild('validationPopover', {static: true}) validationPopover: ValidationPopoverComponent;
  public audioChunk: AudioChunk;

  audioViewerSettings: AudioviewerConfig;

  private _textEditor = {
    state: 'inactive',
    selectedSegment: -1,
    audiochunk: null
  };

  public playStateSegments: {
    state: 'started' | 'stopped',
    icon: 'play' | 'stop'
  }[] = [];


  public popovers = {
    validation: {
      location: {
        x: 0,
        y: 0
      },
      visible: false,
      currentGuideline: {
        description: '',
        title: ''
      },
      mouse: {
        enter: false
      }
    }

  };

  public selectedError: any = '';
  public shownSegments: {
    label: string;
    transcription: {
      html: string,
      text: string
    }
  }[] = [];

  private audioManager: AudioManager;
  private tempSegments: Segments;

  ngAfterViewInit() {
  }

  ngOnInit() {
    this.audioViewerSettings = new AudioviewerConfig();
    // this..name = 'transcr-window viewer';
    this.audioViewerSettings.margin.top = 5;
    this.audioViewerSettings.margin.bottom = 0;
    this.audioViewerSettings.justifySignalHeight = true;
    this.audioViewerSettings.boundaries.enabled = false;
    this.audioViewerSettings.boundaries.readonly = true;
    this.audioViewerSettings.selection.enabled = true;
    this.audioViewerSettings.shortcuts.set_break = null;
    this.audioViewerSettings.frame.color = '#222222';
    this.audioViewerSettings.roundValues = false;
    this.audioViewerSettings.showTimePerLine = true;
    this.audioViewerSettings.showProgressBars = true;
    this.audioViewerSettings.multiLine = false;
    // this.audioViewerSettings.av.drawnSelection = null;
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunk = this.audioManager.mainchunk.clone();

    this.updateSegments();
    this.cd.markForCheck();
    this.cd.detectChanges();
    TrnEditorComponent.initialized.emit();
  }

  afterFirstInitialization() {
  }

  enableAllShortcuts() {
  }

  disableAllShortcuts() {
  }

  getStartPoint(index: number) {
    return (index > 0) ? this.transcrService.currentlevel.segments.get(index - 1).time.unix : 0
  }

  openSegment(index: number) {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }

  onLabelMouseLeave(labelCol: HTMLTableCellElement, index: number) {
    const newLabel = labelCol.innerText;
    const segment = this.transcrService.currentlevel.segments.get(index).clone();
    segment.speakerLabel = newLabel;
    this.transcrService.currentlevel.segments.change(index, segment);
    labelCol.contentEditable = 'false';
  }

  onLabelMouseEnter(labelCol: HTMLTableCellElement) {
    labelCol.contentEditable = 'true';
  }

  onMouseOver($event, rowNumber) {
    if (this.textEditor.state === 'inactive') {
      let target = jQuery($event.target);
      if (target.is('.val-error') || target.parent().is('.val-error')) {
        if (!this.popovers.validation.mouse.enter) {
          if (!target.is('.val-error')) {
            target = target.parent();
          }

          let marginTop = 0;

          for (let i = 0; i < rowNumber; i++) {
            const elem = jQuery(jQuery('.segment-row').get(i));
            marginTop += elem.outerHeight();
          }

          marginTop += target.position().top;

          const headHeight = jQuery('#table-head').outerHeight();

          const errorcode = target.attr('data-errorcode');

          this.selectedError = this.transcrService.getErrorDetails(errorcode);

          if (this.selectedError !== null) {
            this.validationPopover.show();
            this.validationPopover.description = this.selectedError.description;
            this.validationPopover.title = this.selectedError.title;
            this.cd.markForCheck();
            this.cd.detectChanges();

            this.popovers.validation.location.y = headHeight + marginTop - this.validationPopover.height;
            this.popovers.validation.location.x = $event.offsetX - 24;
            this.popovers.validation.mouse.enter = true;
            this.cd.markForCheck();
            this.cd.detectChanges();
          }
        }
      } else {
        this.selectedError = null;
        this.popovers.validation.mouse.enter = false;
        this.validationPopover.hide();
      }
    } else {
      this.popovers.validation.visible = false;
    }
  }

  onMouseDown($event, i) {
    if (this.textEditor.state === 'inactive') {
      this.textEditor.state = 'active';
      this.textEditor.selectedSegment = i;
      this.showSignalDisplay = true;
      this.cd.markForCheck();
      this.cd.detectChanges();

      const segments = this.transcrService.currentlevel.segments.segments;
      this.tempSegments = this.transcrService.currentlevel.segments.clone();
      const segment = segments[i];
      const segmentStart = (i > 0) ? segments[i - 1].time : this.transcrService.audioManager.createSampleUnit(0);
      const audiochunk = new AudioChunk(new AudioSelection(segmentStart, segment.time), this.audioManager);

      this.audioManager.addChunk(audiochunk);
      this.textEditor.audiochunk = audiochunk;
      this.showSignalDisplay = false;
      this.cd.markForCheck();
      this.cd.detectChanges();

      this.transcrEditor.Settings.btnPopover = false;
      this.transcrEditor.Settings.specialMarkers.boundary = true;
      this.transcrEditor.Settings.markers = this.transcrService.guidelines.markers.items;

      this.transcrEditor.validationEnabled = this.appStorage.useMode !== LoginMode.URL &&
        (this.appStorage.useMode === LoginMode.DEMO || this.settingsService.projectsettings.octra.validationEnabled);
      this.transcrEditor.initialize();

      this.cd.markForCheck();
      this.cd.detectChanges();

      this.transcrEditor.rawText = segment.transcript;

      this.transcrEditor.focus();
    }
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  private updateSegments() {
    this.playStateSegments = [];
    const segments = this.transcrService.currentlevel.segments.segments;
    this.shownSegments = [];

    let startTime = 0;
    const result = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      const obj = this.getShownSegment(startTime, segment.time.samples, segment.speakerLabel, segment.transcript, i);

      result.push(obj);

      startTime = segment.time.samples;

      // set playState
      this.playStateSegments.push({
        state: 'stopped',
        icon: 'play'
      });
    }

    this.shownSegments = result;
  }


  getShownSegment(startSamples: number, endSamples: number, label: string, rawText: string, i: number): {
    start: number,
    end: number,
    label: string,
    transcription: {
      text: string,
      html: string
    },
    validation: string
  } {
    const obj = {
      start: startSamples,
      end: endSamples,
      label,
      transcription: {
        text: rawText,
        html: rawText
      },
      validation: ''
    };

    if (this.appStorage.useMode !== LoginMode.URL) {
      if (typeof validateAnnotation !== 'undefined' && typeof validateAnnotation === 'function'
        && !isUnset(this.transcrService.validationArray[i])) {
        obj.transcription.html = this.transcrService.underlineTextRed(obj.transcription.text,
          this.transcrService.validationArray[i].validation);
      }

      obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === '[[[') {
          return '<';
        }
        return '>';
      });
    } else {
      obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === '[[[') {
          return '<';
        }
        return '>';
      });
    }

    obj.transcription.html = obj.transcription.html.replace(/(<p>)|(<\/p>)/g, '');
    return obj;
  }

  onKeyUp($event: KeyboardEvent, i: number) {
    if ($event.code === 'Enter') {
      setTimeout(() => {
        this.save();
        this.transcrService.validateAll();
        this.transcrService.saveSegments();

        this.textEditor.state = 'inactive';
        this.textEditor.selectedSegment = -1;

        this.audioManager.removeChunk(this.textEditor.audiochunk);
        this.textEditor.audiochunk = null;

        this.updateSegments();
        this.cd.markForCheck();
        this.cd.detectChanges();

        const startSample = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.samples : 0;

        /*
        this.uiService.addElementFromEvent('segment', {
          value: 'updated'
        }, Date.now(), null, null, null, {
          start: startSample,
          length: segment.time.samples - startSample
        }, 'overview'); */
      }, 1000);
    }
  }

  updateTempSegments() {
    const segStart = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this._textEditor.audiochunk.time.start.add(new SampleUnit(20, this.audioManager.sampleRate))
    );

    this.tempSegments = this.transcrService.currentlevel.segments.clone();

    const html = this.transcrEditor.getRawText();
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


  save() {
    this.updateTempSegments();
    const segmentIndex = this._textEditor.selectedSegment;

    if (segmentIndex > -1 && this.transcrService.currentlevel.segments &&
      segmentIndex < this.transcrService.currentlevel.segments.length) {
      if (this.transcrEditor.html.indexOf('<img src="assets/img/components/transcr-editor/boundary.png"') > -1) {
        // boundaries were inserted
        this.transcrService.currentlevel.segments.segments = this.tempSegments.segments;
        this.transcrService.currentlevel.segments.onsegmentchange.emit(null);
      } else {
        // no boundaries inserted
        const segment = this.transcrService.currentlevel.segments.get(segmentIndex).clone();
        this.transcrEditor.updateRawText();
        segment.transcript = this.transcrEditor.rawText;
        segment.isBlockedBy = this.transcrService.currentlevel.segments.get(segmentIndex).isBlockedBy;
        this.transcrService.currentlevel.segments.change(segmentIndex, segment);
      }
    } else {
      const isNull = isUnset(this.transcrService.currentlevel.segments);
      console.log(`could not save segment. segment index=${segmentIndex},
segments=${isNull}, ${this.transcrService.currentlevel.segments.length}`);
    }
  }

  test() {
    this.viewer.init();
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    const oldValue = this.showSignalDisplay;
    this.showSignalDisplay = true;
    if (oldValue !== this.showSignalDisplay) {
      this.cd.markForCheck();
      this.cd.detectChanges();
    }

    setTimeout(() => {
      if (Date.now() - this.lastResizing > 50) {
        this.showSignalDisplay = false;
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    }, 60);
    this.lastResizing = Date.now();
  }
}
