import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {AppStorageService, AudioService, TranscriptionService} from '../../shared/service';
import {AudioChunk, AudioSelection, BrowserAudioTime, OriginalAudioTime, SubscriptionManager} from '../../shared';
import {Segment} from '../../obj/Annotation';
import {PlayBackState} from '../../../media-components/obj/media';
import {ValidationPopoverComponent} from '../../component/transcr-editor/validation-popover/validation-popover.component';
import {isFunction, isNullOrUndefined} from '../../shared/Functions';
import {TranscrEditorComponent} from '../../component/transcr-editor';

@Component({
  selector: 'app-transcr-overview',
  templateUrl: './transcr-overview.component.html',
  styleUrls: ['./transcr-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrOverviewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  get textEditor(): { selectedSegment: number; state: string, audiochunk: AudioChunk } {
    return this._textEditor;
  }

  public selectedError: any = '';
  public shown_segments: {
    transcription: {
      html: string,
      text: string
    }
  }[] = [];

  @Input() segments: Segment[];
  @Input() public show_transcriptiontable = true;
  public show_loading = true;

  @Output() segmentclicked: EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('validationPopover') validationPopover: ValidationPopoverComponent;
  @ViewChild('transcrEditor') transcrEditor: TranscrEditorComponent;

  private subscrmanager: SubscriptionManager;
  private updating = false;
  private errorY = 0;
  private playAllState: {
    state: 'started' | 'stopped',
    icon: 'play' | 'stop',
    currentSegment: number,
    skipSilence: boolean
  } = {
    state: 'stopped',
    icon: 'play',
    currentSegment: -1,
    skipSilence: false
  };

  private playStateSegments: {
    state: 'started' | 'stopped',
    icon: 'play' | 'stop'
  }[] = [];

  private _visible = false;

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

  private _textEditor = {
    state: 'inactive',
    selectedSegment: -1,
    audiochunk: null
  };

  @Input('visible') set visible(value: boolean) {
    this._visible = value;
    if (value) {
      this.updateView();
    }
  }

  public get numberOfSegments(): number {
    return (this.segments) ? this.segments.length : 0;
  }

  public get transcrSegments(): number {
    return (this.segments) ? this.transcrService.statistic.transcribed : 0;
  }

  public get pauseSegments(): number {
    return (this.segments) ? this.transcrService.statistic.pause : 0;
  }

  public get emptySegments(): number {
    return (this.segments) ? this.transcrService.statistic.empty : 0;
  }

  public get foundErrors(): number {
    let found = 0;

    if (this.shown_segments.length > 0) {
      let result_str = '';
      for (let i = 0; i < this.shown_segments.length; i++) {
        result_str += this.shown_segments[i].transcription.html;
      }

      found = (result_str.match(/<span class='val-error'/g) || []).length;
    }

    return found;
  }

  public get validationFound() {
    return ((typeof validateAnnotation !== 'undefined') && isFunction(validateAnnotation) &&
      (typeof tidyUpAnnotation !== 'undefined') && isFunction(tidyUpAnnotation));
  }

  constructor(public transcrService: TranscriptionService,
              public audio: AudioService,
              public sanitizer: DomSanitizer,
              private cd: ChangeDetectorRef,
              private appStorage: AppStorageService) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnInit() {
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
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

          const headHeight = jQuery('#table-head').outerHeight();

          const errorcode = target.attr('data-errorcode');

          this.selectedError = this.transcrService.getErrorDetails(errorcode);

          if (this.selectedError !== null) {
            this.validationPopover.show();
            this.validationPopover.description = this.selectedError.description;
            this.validationPopover.title = this.selectedError.title;
            this.cd.markForCheck();
            this.cd.detectChanges();

            this.popovers.validation.location.y = headHeight + marginTop - this.validationPopover.height + 10;
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

      const segment = this.segments[i];
      const nextSegmentTime: BrowserAudioTime | OriginalAudioTime = (i < this.segments.length - 1)
        ? this.segments[i + 1].time : this.audio.audiomanagers[0].originalInfo.duration;
      const audiochunk = new AudioChunk(new AudioSelection(segment.time, nextSegmentTime), this.audio.audiomanagers[0]);

      this.audio.audiomanagers[0].addChunk(audiochunk);
      this.textEditor.audiochunk = audiochunk;

      this.cd.markForCheck();
      this.cd.detectChanges();

      this.transcrEditor.Settings.btnPopover = false;
      this.transcrEditor.initialize();

      this.transcrEditor.rawText = segment.transcript;
      this.transcrEditor.focus();
    }
  }

  onTextEditorLeave($event, i) {
    this.segments[i].transcript = this.transcrEditor.rawText;
    const segment = this.segments[i];
    this.transcrService.validateAll();
    this.updateSegments();

    this.transcrService.currentlevel.segments.change(i, segment);
    this.transcrService.saveSegments();
    this.textEditor.state = 'inactive';
    this.textEditor.selectedSegment = -1;
    this.audio.audiomanagers[0].removeChunk(this.textEditor.audiochunk);
    this.textEditor.audiochunk = null;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
    this.updateView();
  }

  updateView() {
    this.updateSegments();
    this.transcrService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public onSegmentClicked(segnumber: number) {
    this.segmentclicked.emit(segnumber);
  }

  private updateSegments() {
    this.playStateSegments = [];
    if (this.transcrService.validationArray.length > 0) {
      if (!this.segments || !this.transcrService.guidelines) {
        this.shown_segments = [];
      }

      this.show_loading = true;
      let start_time = 0;
      const result = [];

      for (let i = 0; i < this.segments.length; i++) {
        const segment = this.segments[i];

        const obj = this.getShownSegment(start_time, segment.time.browserSample.value, segment.transcript, i);

        result.push(obj);

        start_time = segment.time.browserSample.value;

        // set playState
        this.playStateSegments.push({
          state: 'stopped',
          icon: 'play'
        });
      }

      this.shown_segments = result;
      this.show_loading = false;
    }
  }

  getShownSegment(startSamples: number, endSamples: number, rawText: string, i: number): {
    start: number,
    end: number,
    transcription: {
      text: string,
      html: string
    },
    validation: string
  } {
    const obj = {
      start: startSamples,
      end: endSamples,
      transcription: {
        text: rawText,
        html: rawText
      },
      validation: ''
    };

        if (typeof validateAnnotation !== 'undefined' && typeof validateAnnotation === 'function'
          && !isNullOrUndefined(this.transcrService.validationArray[i])) {
          obj.transcription.html = this.transcrService.underlineTextRed(obj.transcription.text,
            this.transcrService.validationArray[i].validation);
        } else {
          obj.transcription.html = segment.transcript;
        }

    obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);
    obj.transcription.html = obj.transcription.html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
      if (g1 === '[[[') {
        return '<';
      }
      return '>';
    });

    obj.transcription.html = obj.transcription.html.replace(/(<p>)|(<\/p>)/g, '');
    return obj;
  }

  playAll(nextSegment: number) {
    const segment = this.segments[nextSegment];

    if (nextSegment < this.segments.length && this.playAllState.state === 'started') {
      if (!this.playAllState.skipSilence ||
        (this.playAllState.skipSilence && segment.transcript !== ''
          && segment.transcript.indexOf(this.transcrService.break_marker.code) < 0)
      ) {
        this.playAllState.currentSegment = nextSegment;
        this.playSegement(nextSegment).then(() => {
          this.playAll(++nextSegment);
        });
      } else {
        // skip segment with silence
        this.playAll(++nextSegment);
      }
    } else {
      // last segment reached
      this.playAllState.state = 'stopped';
      this.playAllState.icon = 'play';

      this.cd.markForCheck();
      this.cd.detectChanges();
    }
  }

  togglePlayAll() {
    this.playAllState.state = (this.playAllState.state === 'started') ? 'stopped' : 'started';
    this.playAllState.icon = (this.playAllState.icon === 'play') ? 'stop' : 'play';
    this.cd.markForCheck();
    this.cd.detectChanges();

    if (this.playAllState.state === 'started') {
      // start
      this.playAll(0);
    } else {
      // stop
      this.audio.audiomanagers[0].stopPlayback().then(() => {
        this.playStateSegments[this.playAllState.currentSegment].state = 'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon = 'play';

        this.cd.markForCheck();
        this.cd.detectChanges();
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  playSegement(segmentNumber: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.playStateSegments[segmentNumber].state === 'stopped') {
        const segment: Segment = this.segments[segmentNumber];

        this.playStateSegments[segmentNumber].state = 'started';
        this.playStateSegments[segmentNumber].icon = 'stop';
        this.cd.markForCheck();
        this.cd.detectChanges();

        const startSample = (segmentNumber > 0) ? this.segments[segmentNumber - 1].time.browserSample.value : 0;

        this.playAllState.currentSegment = segmentNumber;

        this.audio.audiomanagers[0].startPlayback(
          this.audio.audiomanagers[0].createBrowserAudioTime(startSample),
          this.audio.audiomanagers[0].createBrowserAudioTime(segment.time.browserSample.value - startSample)
          , 1, 1, () => {
          }).then(() => {
          this.playStateSegments[segmentNumber].state = 'stopped';
          this.playStateSegments[segmentNumber].icon = 'play';

          this.cd.markForCheck();
          this.cd.detectChanges();

          setTimeout(() => {
            resolve();
          }, 1000);
        }).catch((error) => {
          console.error(error);
        });
      } else {
        // stop playback
        this.audio.audiomanagers[0].stopPlayback().then(() => {
          this.playStateSegments[segmentNumber].state = 'stopped';
          this.playStateSegments[segmentNumber].icon = 'play';

          this.cd.markForCheck();
          this.cd.detectChanges();

          resolve();
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }

  playSelectedSegment(segmentNumber: number) {
    // make sure that audio is not playing
    if ((this.playAllState.state === 'started' && this.playAllState.currentSegment !== segmentNumber)
      || this.playAllState.currentSegment !== segmentNumber) {
      this.stopPlayback().then(() => {
        this.playSegement(segmentNumber);
      }).catch((error) => {
        console.error(error);
      });
    } else {
      this.stopPlayback().then(() => {
        this.playAllState.currentSegment = -1;
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  toggleSkipCheckbox() {
    this.playAllState.skipSilence = !this.playAllState.skipSilence;
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playAllState.currentSegment > -1) {
        this.playAllState.state = 'stopped';
        this.playAllState.icon = 'play';
        this.playStateSegments[this.playAllState.currentSegment].state = 'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon = 'play';
        this.cd.markForCheck();
        this.cd.detectChanges();
      }

      if (this.audio.audiomanagers[0].state === PlayBackState.PLAYING) {
        this.audio.audiomanagers[0].stopPlayback().then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  }
}
