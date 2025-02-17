import { NgClass, NgStyle } from '@angular/common';
import {
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
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ASRContext,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
} from '@octra/annotation';
import { sum } from '@octra/api-types';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { isFunction, SubscriptionManager } from '@octra/utilities';
import { AudioChunk } from '@octra/web-media';
import { Subscription, timer } from 'rxjs';
import {
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { TranscrEditorComponent, TranscrEditorConfig } from '../transcr-editor';
import { TranscrEditorComponent as TranscrEditorComponent_1 } from '../transcr-editor/transcr-editor.component';
import { ValidationPopoverComponent } from '../transcr-editor/validation-popover/validation-popover.component';

@Component({
  selector: 'octra-transcr-overview',
  templateUrl: './transcr-overview.component.html',
  styleUrls: ['./transcr-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    NgStyle,
    TranscrEditorComponent_1,
    ValidationPopoverComponent,
    OctraUtilitiesModule,
    TranslocoPipe,
  ],
})
export class TranscrOverviewComponent implements OnInit, OnDestroy, OnChanges {
  get textEditor(): {
    selectedSegment: number;
    state: string;
    audioChunk?: AudioChunk;
  } {
    return this._textEditor;
  }

  editorConfig: TranscrEditorConfig = new TranscrEditorConfig({
    btnPopover: false,
  });

  @ViewChild('transcrEditor', { static: false })
  transcrEditor?: TranscrEditorComponent;

  public selectedError: any = '';
  public shownSegments: {
    transcription: {
      html: string;
      text: string;
    };
  }[] = [];
  public transcript = '';

  @Input() currentLevel?: OctraAnnotationAnyLevel<
    OctraAnnotationSegment<ASRContext>
  >;
  _internLevel?: OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>;

  @Input() public showTranscriptionTable = true;
  public showLoading = true;

  @Output() segmentclicked: EventEmitter<number> = new EventEmitter<number>();

  private subscrmanager: SubscriptionManager<Subscription>;

  public playAllState: {
    state: 'started' | 'stopped';
    icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
    currentSegment: number;
    skipSilence: boolean;
  } = {
    state: 'stopped',
    icon: 'bi bi-play-fill',
    currentSegment: -1,
    skipSilence: false,
  };

  public playStateSegments: {
    state: 'started' | 'stopped';
    icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
  }[] = [];

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

  private _textEditor: {
    state: string;
    selectedSegment: number;
    audioChunk?: AudioChunk;
  } = {
    state: 'inactive',
    selectedSegment: -1,
    audioChunk: undefined,
  };

  public get numberOfSegments(): number {
    if (this.currentLevel && this.currentLevel.type === 'SEGMENT') {
      return this.currentLevel.items ? this.currentLevel.items.length : 0;
    }
    return -1;
  }

  public get transcrSegments(): number {
    return this.currentLevel?.items
      ? this.annotationStoreService.statistics.transcribed
      : 0;
  }

  public get pauseSegments(): number {
    return this.currentLevel?.items
      ? this.annotationStoreService.statistics.pause
      : 0;
  }

  public get emptySegments(): number {
    return this.currentLevel?.items
      ? this.annotationStoreService.statistics.empty
      : 0;
  }

  public get foundErrors(): number {
    return sum(this.validationErrors.map((a) => a.errors));
  }

  validationErrors: {
    id: number;
    level: string;
    errors: number;
  }[] = [];

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
    protected appStorage: AppStorageService,
    protected settingsService: SettingsService,
    private uiService: UserInteractionsService
  ) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
    this.playAllState.state = 'stopped';
    this.audio.audioManager.stopPlayback().catch((err) => {
      console.error(err);
    });
  }

  ngOnInit() {
    this.subscrmanager.add(
      this.audio.audiomanagers[0].statechange.subscribe({
        next: (state) => {
          // make sure that events from playonhover are not logged
          if (
            state !== PlayBackStatus.PLAYING &&
            state !== PlayBackStatus.INITIALIZED &&
            state !== PlayBackStatus.PREPARE
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
        },
        error: (error) => {
          console.error(error);
        },
      })
    );

    this.updateView();
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  async onMouseOver(
    $event: MouseEvent,
    rowNumber: number,
    row: HTMLDivElement,
    validationPopover: ValidationPopoverComponent
  ) {
    if (validationPopover) {
      if (this.textEditor.state === 'inactive') {
        let target = $event.target as HTMLElement;
        if (
          target.getAttribute('class') === 'val-error' ||
          target.parentElement!.getAttribute('class') === 'val-error'
        ) {
          if (!this.popovers.validation.mouse.enter) {
            if (target.getAttribute('class') !== 'val-error') {
              target = target.parentElement!;
            }

            const errorcode = target.getAttribute('data-errorcode')!;
            this.selectedError =
              await this.annotationStoreService.getErrorDetails(errorcode);

            if (this.selectedError !== null) {
              validationPopover.show();
              validationPopover.description = this.selectedError.description;
              validationPopover.title = this.selectedError.title;
              this.cd.markForCheck();
              this.cd.detectChanges();

              this.popovers.validation.location.y = -validationPopover.height;
              this.popovers.validation.location.x = 0;
              this.popovers.validation.mouse.enter = true;
              this.cd.markForCheck();
              this.cd.detectChanges();
            }
          }
        } else {
          this.selectedError = null;
          this.popovers.validation.mouse.enter = false;
          validationPopover.hide();
        }
      } else {
        this.popovers.validation.visible = false;
      }
    }
  }

  onMouseDown(i: number) {
    if (this.currentLevel?.items && this.currentLevel.type === 'SEGMENT') {
      if (this.textEditor.state === 'inactive') {
        this.textEditor.state = 'active';
        this.textEditor.selectedSegment = i;

        const segment = this.currentLevel?.items[i] as OctraAnnotationSegment;
        const nextSegmentTime: SampleUnit =
          i < this.currentLevel?.items.length - 1
            ? (this.currentLevel?.items[i + 1] as OctraAnnotationSegment).time
            : this.audio.audioManager.resource.info.duration;
        const audiochunk = new AudioChunk(
          new AudioSelection(segment.time, nextSegmentTime),
          this.audio.audiomanagers[0]
        );

        this.audio.audiomanagers[0].addChunk(audiochunk);
        this.textEditor.audioChunk = audiochunk;

        this.transcript =
          segment.getFirstLabelWithoutName('Speaker')?.value ?? '';
        // this.transcrEditor.focus();
      }
    }
  }

  async onTextEditorLeave(i: number) {
    if (
      this.transcrEditor &&
      this._internLevel?.items &&
      this._internLevel.type === 'SEGMENT'
    ) {
      this.transcrEditor.updateRawText();
      (
        this._internLevel?.items[i] as OctraAnnotationSegment
      ).changeFirstLabelWithoutName('Speaker', this.transcrEditor.rawText);
      const segment = this._internLevel?.items[i] as OctraAnnotationSegment;
      this.annotationStoreService.validateAll();

      this.cd.markForCheck();

      await this.updateSegments();

      this.annotationStoreService.changeCurrentItemById(segment.id, segment);
      this.textEditor.state = 'inactive';
      this.textEditor.selectedSegment = -1;
      this.audio.audiomanagers[0].removeChunk(this.textEditor.audioChunk!);
      this.cd.markForCheck();

      const startSample =
        i > 0
          ? (
              this.annotationStoreService.currentLevel!.items[
                i - 1
              ] as OctraAnnotationSegment
            ).time.samples
          : 0;
      this.uiService.addElementFromEvent(
        'segment',
        {
          value: 'updated',
        },
        Date.now(),
        undefined,
        undefined,
        undefined,
        {
          start: startSample,
          length: segment.time.samples - startSample,
        },
        'overview'
      );
    }
  }

  async updateView() {
    await this.updateSegments();
    this.annotationStoreService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public onSegmentClicked(segnumber: number) {
    this.segmentclicked.emit(segnumber);
  }

  private async updateSegments() {
    this.playStateSegments = [];
    this.annotationStoreService.validateAll();
    if (
      this._internLevel &&
      (this.annotationStoreService.validationArray.length > 0 ||
        this.appStorage.useMode === 'url' ||
        !this.settingsService.projectsettings?.octra?.validationEnabled)
    ) {
      if (
        !this.currentLevel?.items ||
        !this.annotationStoreService.guidelines
      ) {
        this.shownSegments = [];
        this._internLevel?.clear();
      }

      this.showLoading = true;
      let startTime = 0;
      const result = [];

      if (this._internLevel.type === 'SEGMENT') {
        const level = this
          ._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
        for (let i = 0; i < level.items.length; i++) {
          const segment = level.items[i];

          const obj = await this.getShownSegment(
            startTime,
            segment.time.samples,
            i,
            this.annotationStoreService.validationArray.filter(
              (a) => a.level === level.id
            ),
            segment.getFirstLabelWithoutName('Speaker')?.value ?? ''
          );

          result.push(obj);

          startTime = segment.time.samples;

          // set playState
          this.playStateSegments.push({
            state: 'stopped',
            icon: 'bi bi-play-fill',
          });
        }
      }

      this.shownSegments = result;
      this.showLoading = false;
      this.validationErrors = this.readValidationErrors();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentLevel'].currentValue) {
      this._internLevel = (
        changes['currentLevel']
          .currentValue as OctraAnnotationAnyLevel<OctraAnnotationSegment>
      ).clone();
    }
  }

  async getShownSegment(
    startSamples: number,
    endSamples: number,
    i: number,
    validation: any[],
    rawText?: string
  ): Promise<{
    start: number;
    end: number;
    transcription: {
      text: string;
      html: string;
    };
    validation: string;
  }> {
    const obj = {
      start: startSamples,
      end: endSamples,
      transcription: {
        text: rawText ?? '',
        html: rawText ?? '',
      },
      validation: '',
    };

    if (this.appStorage.useMode !== 'url') {
      if (
        typeof validateAnnotation !== 'undefined' &&
        typeof validateAnnotation === 'function' &&
        validation[i].validation.length > 0
      ) {
        obj.transcription.html = this.annotationStoreService.underlineTextRed(
          obj.transcription.text,
          validation[i].validation
        );
      }

      obj.transcription.html = await this.annotationStoreService.rawToHTML(
        obj.transcription.html
      );
      obj.transcription.html = obj.transcription.html.replace(
        /((?:✉✉✉)|(?:📩📩📩))/,
        (g0, g1) => {
          if (g1 === '✉✉✉') {
            return '<';
          }
          return '>';
        }
      );
    } else {
      obj.transcription.html = await this.annotationStoreService.rawToHTML(
        obj.transcription.html
      );
      obj.transcription.html = obj.transcription.html.replace(
        /((?:✉✉✉)|(?:📩📩📩))/g,
        (g0, g1) => {
          if (g1 === '✉✉✉') {
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
    if (!this._internLevel || this._internLevel.type !== 'SEGMENT') {
      return;
    }

    const segment = this._internLevel.items[nextSegment];

    if (
      nextSegment < this._internLevel.items.length &&
      this.playAllState.state !== 'stopped'
    ) {
      if (
        !this.playAllState.skipSilence ||
        (this.playAllState.skipSilence &&
          segment.getFirstLabelWithoutName('Speaker')?.value !== '' &&
          this.annotationStoreService.breakMarker?.code &&
          segment
            .getFirstLabelWithoutName('Speaker')
            ?.value?.indexOf(this.annotationStoreService.breakMarker.code) !==
            undefined)
      ) {
        this.playAllState.currentSegment = nextSegment;
        this.playSegment(nextSegment).then(() => {
          this.playAll(++nextSegment);
        });
      } else {
        // skip segment with silence
        this.playAll(++nextSegment);
      }
    } else if (nextSegment < this._internLevel.items.length) {
      // last segment reached
      this.playAllState.state = 'stopped';
      this.playAllState.icon = 'bi bi-play-fill';

      this.cd.markForCheck();
    } else {
      console.log(`playAll failed`);
    }
  }

  togglePlayAll() {
    this.playAllState.icon =
      this.playAllState.icon === 'bi bi-play-fill'
        ? 'bi bi-stop-fill'
        : 'bi bi-play-fill';
    this.cd.markForCheck();

    const playpos = this.audio.audioManager.createSampleUnit(0);

    if (this.playAllState.icon === 'bi bi-stop-fill') {
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
          this.playAllState.state = 'started';
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
            'bi bi-play-fill';

          this.cd.markForCheck();

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

  playSegment(segmentNumber: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this._internLevel?.items) {
        resolve();
        return;
      }
      const level = this
        ._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;

      if (this.playStateSegments[segmentNumber].state === 'stopped') {
        const segment: OctraAnnotationSegment = level.items[segmentNumber];

        this.playStateSegments[segmentNumber].state = 'started';
        this.playStateSegments[segmentNumber].icon = 'bi bi-stop-fill';
        this.cd.markForCheck();

        const startSample =
          segmentNumber > 0 ? level.items[segmentNumber - 1].time.samples : 0;

        this.playAllState.currentSegment = segmentNumber;

        this.cd.markForCheck();
        this.audio.audiomanagers[0].playPosition =
          this.audio.audiomanagers[0].createSampleUnit(startSample);
        this.audio.audiomanagers[0]
          .startPlayback(
            new AudioSelection(
              this.audio.audiomanagers[0].createSampleUnit(startSample),
              segment.time.clone()
            ),
            1,
            1
          )
          .then(() => {
            this.playStateSegments[segmentNumber].state = 'stopped';
            this.playStateSegments[segmentNumber].icon = 'bi bi-play-fill';
            this.playAllState.currentSegment = -1;
            this.cd.markForCheck();

            this.subscrmanager.add(
              timer(100).subscribe({
                next: () => {
                  this.cd.markForCheck();

                  resolve();
                },
              })
            );
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
            this.playStateSegments[segmentNumber].icon = 'bi bi-play-fill';
            this.playAllState.currentSegment = -1;

            this.cd.markForCheck();

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

          const startSample =
            segmentNumber > 0
              ? (
                  this.annotationStoreService.currentLevel?.items[
                    segmentNumber - 1
                  ] as OctraAnnotationSegment
                ).time.samples
              : 0;
          this.uiService.addElementFromEvent(
            'mouseclick',
            {
              value: 'play_segment',
            },
            Date.now(),
            this.audio.audiomanagers[0].playPosition,
            undefined,
            undefined,
            {
              start: startSample,
              length:
                (
                  this.annotationStoreService.currentLevel?.items[
                    segmentNumber
                  ] as OctraAnnotationSegment
                ).time.samples - startSample,
            },
            'overview'
          );

          this.playSegment(segmentNumber)
            .then(() => {
              this.cd.markForCheck();
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
          ? (
              this.annotationStoreService.currentLevel!.items[
                segmentNumber - 1
              ] as OctraAnnotationSegment
            ).time.samples
          : 0;
      this.uiService.addElementFromEvent(
        'mouseclick',
        {
          value: 'stop_segment',
        },
        Date.now(),
        this.audio.audiomanagers[0].playPosition,
        undefined,
        undefined,
        {
          start: startSample,
          length:
            (
              this.annotationStoreService.currentLevel!.items[
                segmentNumber
              ] as OctraAnnotationSegment
            ).time.samples - startSample,
        },
        'overview'
      );

      this.stopPlayback()
        .then(() => {
          this.playAllState.icon = 'bi bi-play-fill';
          this.playAllState.currentSegment = -1;
          this.cd.markForCheck();
          this.playAllState.currentSegment = -1;
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  async onEnterPressed(i: number) {
    await this.onTextEditorLeave(i);
    if (this._internLevel?.items && i < this._internLevel.items.length - 1) {
      this.onMouseDown(i + 1);
    }
    this.annotationStoreService.validateAll();
    await this.updateSegments();
    this.cd.markForCheck();
  }

  toggleSkipCheckbox() {
    this.playAllState.skipSilence = !this.playAllState.skipSilence;
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playAllState.currentSegment > -1) {
        this.playStateSegments[this.playAllState.currentSegment].state =
          'stopped';
        this.playStateSegments[this.playAllState.currentSegment].icon =
          'bi bi-play-fill';
        this.cd.markForCheck();
      }
      this.audio.audiomanagers[0].stopPlayback().then(resolve).catch(reject);
    });
  }

  private readValidationErrors() {
    const result: {
      id: number;
      level: string;
      errors: number;
    }[] = [];

    for (const validationArrayElement of this.annotationStoreService
      .validationArray) {
      const index = result.findIndex(
        (a) => a.id === validationArrayElement.level
      );
      if (index < 0) {
        result.push({
          id: validationArrayElement.level,
          level: this.annotationStoreService.transcript.levels.find(
            (a) => a.id === validationArrayElement.level
          )!.name,
          errors: validationArrayElement.validation.length,
        });
      } else {
        result[index].errors += validationArrayElement.validation.length;
      }
    }

    return result;
  }
}
