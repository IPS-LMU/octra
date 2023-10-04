import { ChangeDetectionStrategy, Component } from '@angular/core';

declare const validateAnnotation: (transcript: string, guidelines: any) => any;
declare const tidyUpAnnotation: (transcript: string, guidelines: any) => any;

@Component({
  selector: 'octra-transcr-overview',
  templateUrl: './transcr-overview.component.html',
  styleUrls: ['./transcr-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranscrOverviewComponent
  // implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  /*
  get textEditor(): {
    selectedSegment: number;
    state: string;
    audiochunk: AudioChunk;
  } {
    return this._textEditor;
  }

  public selectedError: any = '';
  public shownSegments: {
    transcription: {
      html: string;
      text: string;
    };
  }[] = [];

  @Input() segments: OctraAnnotationSegment[];
  @Input() public showTranscriptionTable = true;
  public showLoading = true;

  @Output() segmentclicked: EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('validationPopover', { static: true })
  validationPopover?: ValidationPopoverComponent;
  @ViewChild('transcrEditor', { static: false })
  transcrEditor?: TranscrEditorComponent;

  private subscrmanager: SubscriptionManager<Subscription>;
  private updating = false;
  private errorY = 0;
  public playAllState: {
    state: 'started' | 'stopped';
    icon: 'play' | 'stop';
    currentSegment: number;
    skipSilence: boolean;
  } = {
    state: 'stopped',
    icon: 'play',
    currentSegment: -1,
    skipSilence: false,
  };

  public playStateSegments: {
    state: 'started' | 'stopped';
    icon: 'play' | 'stop';
  }[] = [];

  private _visible = false;

  public popovers = {
    validation: {
      location: {
        x: 0,
        y: 0,
      },
      visible: false,
      currentGuideline: {
        description: '',
        title: '',
      },
      mouse: {
        enter: false,
      },
    },
  };

  private _textEditor = {
    state: 'inactive',
    selectedSegment: -1,
    audiochunk: null,
  };

  @Input() set visible(value: boolean) {
    this._visible = value;
    if (value) {
      this.updateView();
    }
  }

  public get numberOfSegments(): number {
    return this.segments ? this.segments.length : 0;
  }

  public get transcrSegments(): number {
    return this.segments
      ? this.annotationStoreService.statistics.transcribed
      : 0;
  }

  public get pauseSegments(): number {
    return this.segments ? this.annotationStoreService.statistics.pause : 0;
  }

  public get emptySegments(): number {
    return this.segments ? this.annotationStoreService.statistics.empty : 0;
  }

  public get foundErrors(): number {
    let found = 0;

    if (this.shownSegments.length > 0) {
      let resultStr = '';
      for (let i = 0; i < this.shownSegments.length; i++) {
        resultStr += this.shownSegments[i].transcription.html;
      }

      found = (resultStr.match(/<span class='val-error'/) || []).length;
    }

    return found;
  }

  public get validationFound() {
    return (
      typeof validateAnnotation !== 'undefined' &&
      isFunction(validateAnnotation) &&
      typeof tidyUpAnnotation !== 'undefined' &&
      isFunction(tidyUpAnnotation)
    );
  }

  constructor(
    public annotationStoreService: AnnotationStoreService,
    public audio: AudioService,
    public sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    public appStorage: AppStorageService,
    private settingsService: SettingsService,
    private uiService: UserInteractionsService
  ) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnInit() {
    this.subscrmanager.add(
      this.audio.audiomanagers[0].statechange.subscribe(
        (state) => {
          if (this._visible) {
            // make sure that events from playonhover are not logged
            if (
              state !== PlayBackStatus.PLAYING &&
              state !== PlayBackStatus.INITIALIZED &&
              state !== PlayBackState.PREPARE
            ) {
              this.uiService.addElementFromEvent(
                'audio',
                { value: state.toLowerCase() },
                Date.now(),
                this.audio.audioManager.playPosition,
                undefined,
                undefined,
                undefined,
                'overview'
              );
            }
          }
        },
        (error) => {
          console.error(error);
        }
      )
    );
  }

  ngOnChanges(changes: SimpleChanges) {}

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  onMouseOver($event: MouseEvent, rowNumber: number) {
    if (this.validationPopover) {
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

            this.selectedError =
              this.annotationStoreService.getErrorDetails(errorcode);

            if (this.selectedError !== null) {
              this.validationPopover.show();
              this.validationPopover.description =
                this.selectedError.description;
              this.validationPopover.title = this.selectedError.title;
              this.cd.markForCheck();
              this.cd.detectChanges();

              this.popovers.validation.location.y =
                headHeight + marginTop - this.validationPopover.height;
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
  }

  onMouseDown($event, i) {
    if (this.transcrEditor) {
      if (this.textEditor.state === 'inactive') {
        this.textEditor.state = 'active';
        this.textEditor.selectedSegment = i;

        const segment = this.segments[i];
        const nextSegmentTime: SampleUnit =
          i < this.segments.length - 1
            ? this.segments[i + 1].time
            : this.audio.audioManager.resource.info.duration;
        const audiochunk = new AudioChunk(
          new AudioSelection(segment.time, nextSegmentTime),
          this.audio.audiomanagers[0]
        );

        this.audio.audiomanagers[0].addChunk(audiochunk);
        this.textEditor.audiochunk = audiochunk;

        this.cd.markForCheck();
        this.cd.detectChanges();

        this.transcrEditor.settings.btnPopover = false;
        this.transcrEditor.validationEnabled =
          this.appStorage.useMode !== 'url' &&
          (this.appStorage.useMode! === 'demo' ||
            this.settingsService.projectsettings?.octra?.validationEnabled ===
              true);
        this.transcrEditor.initialize();

        this.transcrEditor.transcript =
          segment.getFirstLabelWithoutName('Speaker')?.value ?? '';
        this.transcrEditor.focus();
      }
    }
  }

  onTextEditorLeave($event, i) {
    if (this.transcrEditor) {
      this.transcrEditor.updateRawText();
      this.segments[i].transcript = this.transcrEditor.rawText;
      const segment = this.segments[i];
      this.annotationStoreService.validateAll();

      this.cd.markForCheck();
      this.cd.detectChanges();

      this.updateSegments();

      this.annotationStoreService.changeCurrentItemById(segment.id, segment);
      this.textEditor.state = 'inactive';
      this.textEditor.selectedSegment = -1;
      this.audio.audiomanagers[0].removeChunk(this.textEditor.audiochunk);
      this.cd.markForCheck();
      this.cd.detectChanges();

      const startSample =
        i > 0
          ? (this.annotationStoreService.currentLevel!.items[i-1] as OctraAnnotationSegment).time.samples
          : 0;
      this.uiService.addElementFromEvent(
        'segment',
        {
          value: 'updated',
        },
        Date.now(),
        null,
        null,
        null,
        {
          start: startSample,
          length: segment.time.samples - startSample,
        },
        'overview'
      );
    }
  }

  ngAfterViewInit() {}

  updateView() {
    console.log(`update View!`);
    this.updateSegments();
    this.annotationStoreService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public onSegmentClicked(segnumber: number) {
    this.segmentclicked.emit(segnumber);
  }

  private updateSegments() {
    this.playStateSegments = [];
    if (
      this.annotationStoreService.validationArray.length > 0 ||
      this.appStorage.useMode === 'url' ||
      !this.settingsService.projectsettings.octra.validationEnabled
    ) {
      if (!this.segments || !this.annotationStoreService.guidelines) {
        this.shownSegments = [];
      }

      this.showLoading = true;
      let startTime = 0;
      const result = [];

      for (let i = 0; i < this.segments.length; i++) {
        const segment = this.segments[i];

        const obj = this.getShownSegment(
          startTime,
          segment.time.samples,
          segment.getFirstLabelWithoutName("Speaker")?.value ?? '',
          i
        );

        result.push(obj);

        startTime = segment.time.samples;

        // set playState
        this.playStateSegments.push({
          state: 'stopped',
          icon: 'play',
        });
      }

      this.shownSegments = result;
      this.showLoading = false;
    }
  }

  getShownSegment(
    startSamples: number,
    endSamples: number,
    rawText: string,
    i: number
  ): {
    start: number;
    end: number;
    transcription: {
      text: string;
      html: string;
    };
    validation: string;
  } {
    const obj = {
      start: startSamples,
      end: endSamples,
      transcription: {
        text: rawText,
        html: rawText,
      },
      validation: '',
    };

    if (this.appStorage.useMode !== 'url') {
      if (
        typeof validateAnnotation !== 'undefined' &&
        typeof validateAnnotation === 'function' &&
        this.annotationStoreService.validationArray[i]
      ) {
        obj.transcription.html = this.annotationStoreService.underlineTextRed(
          obj.transcription.text,
          this.annotationStoreService.validationArray[i].validation
        );
      }

      obj.transcription.html = this.annotationStoreService.rawToHTML(
        obj.transcription.html
      );
      obj.transcription.html = obj.transcription.html.replace(
        /((?:\[\[\[)|(?:]]]))/g,
        (g0, g1) => {
          if (g1 === '[[[') {
            return '<';
          }
          return '>';
        }
      );
    } else {
      obj.transcription.html = this.annotationStoreService.rawToHTML(
        obj.transcription.html
      );
      obj.transcription.html = obj.transcription.html.replace(
        /((?:\[\[\[)|(?:]]]))/g,
        (g0, g1) => {
          if (g1 === '[[[') {
            return '<';
          }
          return '>';
        }
      );
    }

    obj.transcription.html = obj.transcription.html.replace(
      /(<p>)|(<\/p>)/g,
      ''
    );
    return obj;
  }

  playAll(nextSegment: number) {
    const segment = this.segments[nextSegment];

    if (
      nextSegment < this.segments.length &&
      this.playAllState.state === 'stopped'
    ) {
      if (
        !this.playAllState.skipSilence ||
        (this.playAllState.skipSilence &&
          segment.getFirstLabelWithoutName("Speaker")?.value !== '' && this.annotationStoreService.breakMarker?.code &&
          segment.getFirstLabelWithoutName("Speaker")?.value?.indexOf(this.annotationStoreService.breakMarker.code) !== undefined)
      ) {
        this.playAllState.currentSegment = nextSegment;
        this.playSegement(nextSegment).then(() => {
          this.playAll(++nextSegment);
        });
      } else {
        // skip segment with silence
        this.playAll(++nextSegment);
      }
    } else if (nextSegment < this.segments.length) {
      // last segment reached
      this.playAllState.state = 'stopped';
      this.playAllState.icon = 'play';

      this.cd.markForCheck();
      this.cd.detectChanges();
    } else {
      console.log(`playAll failed`);
    }
  }

  togglePlayAll() {
    this.playAllState.icon =
      this.playAllState.icon === 'play' ? 'stop' : 'play';
    this.cd.markForCheck();
    this.cd.detectChanges();

    const playpos = this.audio.audioManager.createSampleUnit(0);

    if (this.playAllState.icon === 'stop') {
      // start
      this.stopPlayback()
        .then(() => {
          this.uiService.addElementFromEvent(
            'mouseclick',
            {
              value: 'play_all',
            },
            Date.now(),
            playpos,
            undefined,
            undefined,
            undefined,
            'overview'
          );
          this.playAll(0);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      // stop
      this.stopPlayback()
        .then(() => {
          this.playAllState.state = 'stopped';
          this.playStateSegments[this.playAllState.currentSegment].state =
            'stopped';
          this.playStateSegments[this.playAllState.currentSegment].icon =
            'play';

          this.cd.markForCheck();
          this.cd.detectChanges();

          this.uiService.addElementFromEvent(
            'mouseclick',
            {
              value: 'stop_all',
            },
            Date.now(),
            playpos,
            undefined,
            undefined,
            undefined,
            'overview'
          );
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  playSegement(segmentNumber: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.playStateSegments[segmentNumber].state === 'stopped') {
        const segment: OctraAnnotationSegment = this.segments[segmentNumber];

        this.playStateSegments[segmentNumber].state = 'started';
        this.playStateSegments[segmentNumber].icon = 'stop';
        this.cd.markForCheck();
        this.cd.detectChanges();

        const startSample =
          segmentNumber > 0
            ? this.segments[segmentNumber - 1].time.samples
            : 0;

        this.playAllState.currentSegment = segmentNumber;

        this.cd.markForCheck();
        this.cd.detectChanges();
        this.audio.audiomanagers[0].playPosition =
          this.audio.audiomanagers[0].createSampleUnit(startSample);
        this.audio.audiomanagers[0]
          .startPlayback(
            this.audio.audiomanagers[0].createSampleUnit(startSample),
            this.audio.audiomanagers[0].createSampleUnit(
              segment.time.samples - startSample
            ),
            1,
            1,
            () => {}
          )
          .then(() => {
            this.playStateSegments[segmentNumber].state = 'stopped';
            this.playStateSegments[segmentNumber].icon = 'play';
            this.cd.markForCheck();
            this.cd.detectChanges();

            setTimeout(() => {
              this.cd.markForCheck();
              this.cd.detectChanges();

              resolve();
            }, 500);
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        // stop playback
        this.audio.audiomanagers[0]
          .stopPlayback()
          .then(() => {
            this.playStateSegments[segmentNumber].state = 'stopped';
            this.playStateSegments[segmentNumber].icon = 'play';

            this.cd.markForCheck();
            this.cd.detectChanges();

            resolve();
          })
          .catch((error) => {
            console.error(error);
          });
      }
    });
  }

  playSelectedSegment(segmentNumber: number) {
    // make sure that audio is not playing
    if (
      (this.playAllState.state === 'started' &&
        this.playAllState.currentSegment !== segmentNumber) ||
      this.playAllState.currentSegment !== segmentNumber
    ) {
      this.stopPlayback()
        .then(() => {
          this.cd.markForCheck();
          this.cd.detectChanges();

          const startSample =
            segmentNumber > 0
              ? this.annotationStoreService.currentLevel?.items[segmentNumber - 1]
                  .time.originalSample.value
              : 0;
          this.uiService.addElementFromEvent(
            'mouseclick',
            {
              value: 'play_segment',
            },
            Date.now(),
            this.audio.audiomanagers[0].playPosition,
            null,
            null,
            {
              start: startSample,
              length:
                this.annotationStoreService.currentLevel.segments.get(segmentNumber)
                  .time.originalSample.value - startSample,
            },
            'overview'
          );

          this.playSegement(segmentNumber)
            .then(() => {
              this.cd.markForCheck();
              this.cd.detectChanges();
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      const startSample =
        segmentNumber > 0
          ? this.annotationStoreService.currentlevel.segments.get(segmentNumber - 1)
              .time.originalSample.value
          : 0;
      this.uiService.addElementFromEvent(
        'mouseclick',
        {
          value: 'stop_segment',
        },
        Date.now(),
        this.audio.audiomanagers[0].playPosition,
        null,
        null,
        {
          start: startSample,
          length:
            this.annotationStoreService.currentlevel.segments.get(segmentNumber).time
              .originalSample.value - startSample,
        },
        'overview'
      );

      this.stopPlayback()
        .then(() => {
          this.playAllState.icon = 'play';
          this.cd.markForCheck();
          this.cd.detectChanges();
          this.playAllState.currentSegment = -1;
        })
        .catch((error) => {
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
        this.playStateSegments[this.playAllState.currentSegment].state =
          'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon = 'play';
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
      this.audio.audiomanagers[0].stopPlayback().then(resolve).catch(reject);
    });
  }

   */
}
