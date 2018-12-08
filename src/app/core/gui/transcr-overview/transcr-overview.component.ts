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
  SimpleChanges
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {AudioService, TranscriptionService} from '../../shared/service';
import {AudioTime, SubscriptionManager} from '../../shared';
import {isFunction} from 'util';
import {Segment} from '../../obj/Annotation/Segment';
import {PlayBackState} from '../../../media-components/obj/media';

@Component({
  selector: 'app-transcr-overview',
  templateUrl: './transcr-overview.component.html',
  styleUrls: ['./transcr-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrOverviewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  public selectedError: any = '';
  public shown_segments: any[] = [];
  @Input() segments: Segment[];
  @Input() public show_transcriptiontable = true;
  public show_loading = true;

  @Output('segmentclicked') segmentclicked: EventEmitter<number> = new EventEmitter<number>();

  private errortooltip: any;
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
              private cd: ChangeDetectorRef) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
    this.errortooltip.css('display', 'none');
  }

  ngOnInit() {
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  onMouseOver($event) {
    let target = jQuery($event.target);
    if (target.is('.val-error') || target.parent().is('.val-error')) {
      if (!target.is('.val-error')) {
        target = target.parent();
      }

      const errorcode = target.attr('data-errorcode');

      this.selectedError = this.transcrService.getErrorDetails(errorcode);

      if (this.selectedError !== null) {
        this.errortooltip.children('.title').text(this.selectedError.title);
        this.errortooltip.children('.description').html(this.selectedError.description);
        const y = target.offset().top - jQuery(this.errortooltip).height() - 20;
        const x = target.offset().left;
        this.errortooltip.css('margin-top', y + 'px');
        this.errortooltip.css('margin-left', x + 'px');
        this.errortooltip.fadeIn('fast');
      }
    } else {
      this.selectedError = null;
      this.errortooltip.css('display', 'none');
    }
  }

  ngAfterViewInit() {
    this.updateView();
  }

  updateView() {
    this.errortooltip = jQuery('<div></div>');
    this.errortooltip.addClass('error-tooltip');
    this.errortooltip.append(jQuery('<div></div>').addClass('title').text('Title'));
    this.errortooltip.append(jQuery('<div></div>')
      .addClass('description').text(''));

    this.errortooltip.on('mouseleave', function () {
      jQuery(this).css('display', 'none');
    });
    this.errortooltip.on('mouseout', function () {
      jQuery(this).css('display', 'none');
    });

    jQuery('body').append(this.errortooltip);

    this.errortooltip = jQuery('.error-tooltip');

    this.updateSegments();
    this.transcrService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public onSegmentClicked(segnumber: number) {
    this.segmentclicked.emit(segnumber);
  }

  /*
  ngOnChanges(event) {
    this.show_loading = true;
    if (!(event.visible === null || event.visible === undefined) && event.visible.currentValue === true) {
      this.updateSegments();
      this.transcrService.analyse();
    } else if (!(event.visible === null || event.visible === undefined) && event.visible.currentValue === false) {
      jQuery('.error-tooltip').css('display', 'none');
    }
  } */

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

        const obj = {
          start: start_time,
          end: segment.time.seconds,
          transcription: {
            text: segment.transcript,
            html: segment.transcript
          },
          validation: ''
        };

        if (typeof validateAnnotation !== 'undefined' && typeof validateAnnotation === 'function') {
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

        result.push(obj);

        start_time = segment.time.seconds;

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
      this.audio.audiomanagers[0].stopPlayback(() => {
        this.playStateSegments[this.playAllState.currentSegment].state = 'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon = 'play';

        this.cd.markForCheck();
        this.cd.detectChanges();
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

        const startSample = (segmentNumber > 0) ? this.segments[segmentNumber - 1].time.samples : 0;

        this.playAllState.currentSegment = segmentNumber;

        this.audio.audiomanagers[0].startPlayback(new AudioTime(startSample, this.audio.audiomanagers[0].originalInfo.samplerate),
          new AudioTime(segment.time.samples - startSample, this.audio.audiomanagers[0].originalInfo.samplerate), 1, 1, () => {
          }, () => {
            this.playStateSegments[segmentNumber].state = 'stopped';
            this.playStateSegments[segmentNumber].icon = 'play';

            this.cd.markForCheck();
            this.cd.detectChanges();

            setTimeout(() => {
              resolve();
            }, 1000);
          });
      } else {
        // stop playback
        this.audio.audiomanagers[0].stopPlayback(() => {
          this.playStateSegments[segmentNumber].state = 'stopped';
          this.playStateSegments[segmentNumber].icon = 'play';

          this.cd.markForCheck();
          this.cd.detectChanges();

          resolve();
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
      });
    } else {
      this.stopPlayback().then(() => {
        this.playAllState.currentSegment = -1;
      });
    }
  }

  toggleSkipCheckbox() {
    this.playAllState.skipSilence = !this.playAllState.skipSilence;
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.playAllState.currentSegment > -1) {
        this.playAllState.state = 'stopped';
        this.playAllState.icon = 'play';
        this.playStateSegments[this.playAllState.currentSegment].state = 'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon = 'play';
        this.cd.markForCheck();
        this.cd.detectChanges();
      }

      if (this.audio.audiomanagers[0].state === PlayBackState.PLAYING) {
        this.audio.audiomanagers[0].stopPlayback(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
