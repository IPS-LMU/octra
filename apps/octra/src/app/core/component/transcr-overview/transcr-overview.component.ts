import { NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { Actions, ofType } from '@ngrx/effects';
import { ASRContext, OctraAnnotation, OctraAnnotationAnyLevel, OctraAnnotationSegment, OctraAnnotationSegmentLevel } from '@octra/annotation';
import { sum } from '@octra/api-types';
import { AudioSelection, PlayBackStatus, SampleUnit } from '@octra/media';
import { AudioViewerComponent, AudioViewerConfig, AudioViewerShortcutEvent } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { contains, hasProperty, isFunction } from '@octra/utilities';
import { AudioChunk, Shortcut, ShortcutGroup } from '@octra/web-media';
import { HotkeysEvent } from 'hotkeys-js';
import { tap, timer } from 'rxjs';
import { AudioService, SettingsService, UserInteractionsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { RoutingService } from '../../shared/service/routing.service';
import { ShortcutService } from '../../shared/service/shortcut.service';
import { ApplicationActions } from '../../store/application/application.actions';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AudioNavigationComponent } from '../audio-navigation';
import { DefaultComponent } from '../default.component';
import { TranscrEditorComponent, TranscrEditorConfig } from '../transcr-editor';
import { ValidationPopoverComponent } from '../transcr-editor/validation-popover/validation-popover.component';

@Component({
  selector: 'octra-transcr-overview',
  templateUrl: './transcr-overview.component.html',
  styleUrls: ['./transcr-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    NgStyle,
    ValidationPopoverComponent,
    OctraUtilitiesModule,
    TranslocoPipe,
    TranscrEditorComponent,
    AudioViewerComponent,
    AudioNavigationComponent,
  ],
})
export class TranscrOverviewComponent extends DefaultComponent implements OnInit, OnDestroy, OnChanges {
  annotationStoreService = inject(AnnotationStoreService);
  audio = inject(AudioService);
  sanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);
  protected appStorage = inject(AppStorageService);
  protected settingsService = inject(SettingsService);
  private uiService = inject(UserInteractionsService);
  protected routingService = inject(RoutingService);
  private shortcutService = inject(ShortcutService);
  private actions = inject(Actions);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  get selectedUnit(): {
    selectedSegment: number;
    state: string;
    audioChunk?: AudioChunk;
    transcriptText?: string;
    annotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
  } {
    return this._selectedUnit;
  }

  editorConfig: TranscrEditorConfig = new TranscrEditorConfig({
    btnPopover: false,
  });

  @ViewChild('transcrEditor', { static: false })
  transcrEditor?: TranscrEditorComponent;

  public selectedError: any = '';
  public shownSegments: {
    start: SampleUnit;
    end: SampleUnit;
    id: number;
    transcription: {
      text: string;
      html: string;
    };
    validation: string;
    playState: {
      state: 'started' | 'stopped';
      icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
    };
  }[] = [];

  viewerSettings?: AudioViewerConfig;

  _internLevel?: OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>;

  @Input() targetName = 'overview';
  @Input() public showTranscriptionTable = true;
  @Input() showStatistics = true;
  @Input() showSignal = false;

  public showLoading = true;

  @Output() segmentclicked = new EventEmitter<{
    itemID: number;
    levelID: number;
  }>();
  @Output() statusChange = new EventEmitter<{ status: 'loading' | 'ready' | 'updated' }>();

  @ViewChild('viewer', { static: false }) viewer!: AudioViewerComponent;

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

  private _selectedUnit: {
    state: string;
    selectedSegment: number;
    audioChunk?: AudioChunk;
    transcriptText?: string;
    annotation?: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
  } = {
    state: 'inactive',
    selectedSegment: -1,
    audioChunk: undefined,
    transcriptText: '',
  };

  onAudioPlayPause = ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent?.shortcut ?? '',
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    if (this.selectedUnit.audioChunk?.isPlaying) {
      this.selectedUnit.audioChunk.pausePlayback().catch((error: any) => {
        console.error(error);
      });
    } else {
      this.selectedUnit.audioChunk.startPlayback(false).catch((error: any) => {
        console.error(error);
      });
    }
  };

  onAudioStop = ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent?.shortcut ?? '',
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.selectedUnit.audioChunk.stopPlayback().catch((error: any) => {
      console.error(error);
    });
  };

  onStepBackward = ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent?.shortcut ?? '',
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.selectedUnit.audioChunk.stepBackward().catch((error: any) => {
      console.error(error);
    });
  };

  onStepBackwardTime = ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    this.triggerUIAction({
      shortcut: hotkeyEvent?.shortcut ?? '',
      shortcutName: shortcut.name,
      value: shortcut.name,
      type: 'audio',
      timestamp: Date.now(),
    });
    this.selectedUnit.audioChunk.stepBackwardTime(0.5).catch((error: any) => {
      console.error(error);
    });
  };

  moveToPreviousUnit = async ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    await this.doDirection('up');
  };

  moveToNextUnit = async ($event: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => {
    await this.doDirection('down');
  };

  onUndo = (keyboardEvent: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent, shortcutGroup?: ShortcutGroup) => {
    this.appStorage.undo();
  };
  onRedo = (keyboardEvent: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent, shortcutGroup?: ShortcutGroup) => {
    this.appStorage.redo();
  };

  private viewerShortcuts: ShortcutGroup = {
    name: 'signal-display',
    enabled: true,
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'TAB',
          pc: 'TAB',
        },
        title: 'play pause',
        focusonly: true,
        callback: this.onAudioPlayPause,
      },
      {
        name: 'stop',
        keys: {
          mac: 'ESC',
          pc: 'ESC',
        },
        title: 'stop playback',
        focusonly: true,
        callback: this.onAudioStop,
      },
      {
        name: 'step_backward',
        keys: {
          mac: 'SHIFT + BACKSPACE',
          pc: 'SHIFT + BACKSPACE',
        },
        title: 'step backward',
        focusonly: true,
        callback: this.onStepBackward,
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + TAB',
          pc: 'SHIFT + TAB',
        },
        title: 'step backward time',
        focusonly: true,
        callback: this.onStepBackwardTime,
      },
      {
        name: 'move_to_previous_unit',
        keys: {
          mac: 'SHIFT + ARROWUP',
          pc: 'SHIFT + ARROWUP',
        },
        title: 'move to previous unit',
        focusonly: true,
        callback: this.moveToPreviousUnit,
      },
      {
        name: 'move_to_next_unit',
        keys: {
          mac: 'SHIFT + ARROWDOWN',
          pc: 'SHIFT + ARROWDOWN',
        },
        title: 'move to next unit',
        focusonly: true,
        callback: this.moveToNextUnit,
      },
      {
        name: 'undo',
        keys: {
          mac: 'CMD + Z',
          pc: 'CTRL + Z',
        },
        title: 'undo',
        focusonly: false,
        callback: this.onUndo,
      },
      {
        name: 'redo',
        keys: {
          mac: 'SHIFT + CMD + Z',
          pc: 'CTRL + Y',
        },
        title: 'redo',
        focusonly: false,
        callback: this.onRedo,
      },
    ],
  };

  private triggerUIAction($event: AudioViewerShortcutEvent) {
    if (
      $event.value === undefined ||
      !(
        // cursor move by keyboard events are note saved because this would be too much
        (
          contains($event.value, 'cursor') ||
          contains($event.value, 'segment_enter') ||
          contains($event.value, 'playonhover') ||
          contains($event.value, 'asr')
        )
      )
    ) {
      $event.value = `${$event.type}:${$event.value}`;

      let selection:
        | {
            start: number;
            length: number;
          }
        | undefined = {
        start: -1,
        length: -1,
      };

      if (hasProperty($event, 'selection') && $event.selection !== undefined) {
        selection.start = $event.selection.start.samples;
        selection.length = $event.selection.duration.samples;
      } else {
        selection = undefined;
      }

      const textSelection = this.transcrEditor?.textSelection;
      let playPosition = this.audio.audioManager.playPosition;
      if (!this.selectedUnit.audioChunk?.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.av.MouseClickPos!;
        }
      }

      this.uiService.addElementFromEvent('shortcut', $event, $event.timestamp, playPosition, textSelection, selection, undefined, 'table-row-viewer');
    }
  }

  public get numberOfSegments(): number {
    if (this._internLevel && this._internLevel.type === 'SEGMENT') {
      return this._internLevel.items ? this._internLevel.items.length : 0;
    }
    return -1;
  }

  public get transcrSegments(): number {
    return this._internLevel?.items ? this.annotationStoreService.statistics.transcribed : 0;
  }

  public get pauseSegments(): number {
    return this._internLevel?.items ? this.annotationStoreService.statistics.pause : 0;
  }

  public get emptySegments(): number {
    return this._internLevel?.items ? this.annotationStoreService.statistics.empty : 0;
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

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.audio?.audioManager?.stopPlayback().catch((err) => {
      console.error(err);
    });
    this.shortcutService.disableGroup(this.viewerShortcuts.name);
  }

  init(level: OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>) {
    this._internLevel = level.clone();
    this.updateView();
  }

  ngOnInit() {
    this.viewerShortcuts.name = `${this.targetName}`;
    this.shortcutService.registerShortcutGroup(this.viewerShortcuts);
    this.shortcutService.enableGroup(this.viewerShortcuts.name);

    if (!this.showSignal) {
      this.subscribe(this.audio.audiomanagers[0].statechange, {
        next: (state) => {
          // make sure that events from playonhover are not logged
          if (state !== PlayBackStatus.PLAYING && state !== PlayBackStatus.INITIALIZED && state !== PlayBackStatus.PREPARE) {
            this.uiService.addElementFromEvent(
              'audio',
              { value: state.toLowerCase() },
              Date.now(),
              this.audio.audioManager.playPosition,
              undefined,
              undefined,
              undefined,
              this.targetName,
            );
          }
        },
        error: (error) => {
          console.error(error);
        },
      });
    }

    this.subscribe(this.annotationStoreService.currentLevelIndex$, {
      next: (index) => {
        this.init(this.annotationStoreService.transcript.levels[index]);
      },
    });
    this.subscribe(
      this.actions.pipe(
        ofType(ApplicationActions.undoSuccess, ApplicationActions.redoSuccess),
        tap((a) => {
          this.init(this.annotationStoreService.transcript.levels[this.annotationStoreService.currentLevelIndex]);
        }),
      ),
    );
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  async onMouseOver($event: MouseEvent, rowNumber: number, row: HTMLDivElement, validationPopover: ValidationPopoverComponent) {
    if (validationPopover) {
      if (this.selectedUnit.state === 'inactive') {
        let target = $event.target as HTMLElement;
        if (target.getAttribute('class') === 'val-error' || target.parentElement!.getAttribute('class') === 'val-error') {
          if (!this.popovers.validation.mouse.enter) {
            if (target.getAttribute('class') !== 'val-error') {
              target = target.parentElement!;
            }

            const errorcode = target.getAttribute('data-errorcode')!;
            this.selectedError = await this.annotationStoreService.getErrorDetails(errorcode);

            if (this.selectedError !== null) {
              validationPopover.show();
              validationPopover.description = this.selectedError.description;
              validationPopover.title = this.selectedError.title;

              this.popovers.validation.location.y = -validationPopover.height;
              this.popovers.validation.location.x = 0;
              this.popovers.validation.mouse.enter = true;
              this.cd.markForCheck();
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
    if (this._internLevel?.items && this._internLevel.type === 'SEGMENT') {
      if (this.selectedUnit.state !== 'inactive') {
        this.audio?.audioManager?.stopPlayback();
      }

      this.selectedUnit.state = 'active';
      this.selectedUnit.selectedSegment = i;

      const segment = this._internLevel?.items[i] as OctraAnnotationSegment;
      const previousSegmentTime: SampleUnit =
        i > 0 ? (this._internLevel?.items[i - 1] as OctraAnnotationSegment).time : this.audio.audioManager.createSampleUnit(0);

      const audioChunk = this.audio.audiomanagers[0].createNewAudioChunk(new AudioSelection(previousSegmentTime, segment.time));
      this.selectedUnit.audioChunk = audioChunk;

      this.viewerSettings = new AudioViewerConfig();
      this.viewerSettings.margin.top = 0;
      this.viewerSettings.margin.bottom = 0;
      this.viewerSettings.lineheight = 100;
      this.viewerSettings.justifySignalHeight = true;
      this.viewerSettings.boundaries.enabled = false;
      this.viewerSettings.boundaries.readonly = true;
      this.viewerSettings.selection.enabled = true;
      this.viewerSettings.frame.color = '#AAAAAA';
      this.viewerSettings.roundValues = false;
      this.viewerSettings.showTimePerLine = true;
      this.viewerSettings.showProgressBars = true;
      this.viewerSettings.multiLine = false;
      this.viewerSettings.shortcuts.enabled = true;

      this._selectedUnit.transcriptText = segment.getFirstLabelWithoutName('Speaker')?.value ?? '';
      this._selectedUnit.annotation = this.annotationStoreService.transcript;
      // this.transcrEditor.focus();
      this.cd.markForCheck();
      this.appStorage.disableUndoRedo(false);

      if (this.viewer) {
        this.viewer.name = 'transcr-window viewer';
        this.viewer.av.drawnSelection = undefined;
      }
    }
  }

  changeLevel(index: number) {
    this.annotationStoreService.setLevelIndex(index);
  }

  async onTextEditorLeave(i: number, save = false) {
    if (this.transcrEditor && this._internLevel?.items && this._internLevel.type === 'SEGMENT') {
      this.transcrEditor.updateRawText();

      if (save) {
        const level = this._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment<ASRContext>>;
        const item = level.items[i].clone();
        item.replaceFirstLabelWithoutName('Speaker', () => this.transcrEditor.rawText);
        this._internLevel = level?.changeItem(item);
        const segment = level?.items[i] as OctraAnnotationSegment;
        this.annotationStoreService.changeCurrentItemById(segment.id, segment);
      }

      this.selectedUnit.state = 'inactive';
      this.selectedUnit.selectedSegment = -1;
      if (this.selectedUnit.audioChunk) {
        this.selectedUnit.audioChunk.stopPlayback();
        this.playAllState.icon = 'bi bi-play-fill';
        this.playAllState.state = 'stopped';
        this.playAllState.currentSegment = -1;
        this.audio.audiomanagers[0].removeChunk(this.selectedUnit.audioChunk);
      }
      if (save) {
        await this.updateSegments();
      }
      this.cd.markForCheck();

      this.appStorage.enableUndoRedo(false);

      if (save) {
        const level = this._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment<ASRContext>>;
        const segment = level?.items[i] as OctraAnnotationSegment;
        const startSample = i > 0 ? (this.annotationStoreService.currentLevel!.items[i - 1] as OctraAnnotationSegment).time.samples : 0;
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
          this.targetName,
        );
      }
    }
  }

  async updateView() {
    await this.updateSegments();
    if (this.showStatistics) {
      this.annotationStoreService.analyse();
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
    this.statusChange.emit({ status: 'updated' });
  }

  public onSegmentClicked(event: MouseEvent, itemID: number) {
    if (!this.showSignal) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.segmentclicked.emit({
        levelID: this._internLevel!.id!,
        itemID,
      });
    }
  }

  private async updateSegments() {
    this.annotationStoreService.validateAll();

    if (
      this._internLevel &&
      (this.annotationStoreService.validationArray.length > 0 ||
        this.appStorage.useMode === 'url' ||
        (this.routingService.staticQueryParams.guidelines_url && this.routingService.staticQueryParams.functions_url) ||
        !this.settingsService.projectsettings?.octra?.validationEnabled)
    ) {
      if (!this._internLevel?.items || !this.annotationStoreService.guidelines) {
        this.shownSegments = [];
        this._internLevel?.clear();
      }

      this.statusChange.emit({ status: 'loading' });
      this.showLoading = true;
      let startTime = 0;
      const result: {
        start: SampleUnit;
        end: SampleUnit;
        id: number;
        transcription: {
          text: string;
          html: string;
        };
        validation: string;
        playState: {
          state: 'started' | 'stopped';
          icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
        };
      }[] = [];

      if (this._internLevel.type === 'SEGMENT') {
        const level = this._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
        for (let i = 0; i < level.items.length; i++) {
          const segment = level.items[i];

          const obj: {
            start: SampleUnit;
            end: SampleUnit;
            id: number;
            transcription: {
              text: string;
              html: string;
            };
            validation: string;
            playState: {
              state: 'started' | 'stopped';
              icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
            };
          } = await this.getShownSegment(
            new SampleUnit(startTime, segment.time.sampleRate),
            segment.time,
            i,
            segment.id,
            this.annotationStoreService.validationArray.filter((a) => a.level === level.id),
            segment.getFirstLabelWithoutName('Speaker')?.value ?? '',
          );

          result.push(obj);

          startTime = segment.time.samples;
        }
      }

      this.shownSegments = result;
      this.showLoading = false;
      this.statusChange.emit({ status: 'ready' });
      this.validationErrors = this.readValidationErrors();
    }
  }

  ngOnChanges(changes: SimpleChanges) {}

  async getShownSegment(
    start: SampleUnit,
    end: SampleUnit,
    i: number,
    id: number,
    validation: any[],
    rawText?: string,
  ): Promise<{
    start: SampleUnit;
    end: SampleUnit;
    id: number;
    transcription: {
      text: string;
      html: string;
    };
    validation: string;
    playState: {
      state: 'started' | 'stopped';
      icon: 'bi bi-play-fill' | 'bi bi-stop-fill';
    };
  }> {
    const obj = {
      start,
      end,
      id,
      transcription: {
        text: rawText ?? '',
        html: rawText ?? '',
      },
      validation: '',
      playState: {
        state: 'stopped' as any,
        icon: 'bi bi-play-fill' as any,
      },
    };

    if (
      this.appStorage.useMode !== 'url' ||
      (this.routingService.staticQueryParams.guidelines_url && this.routingService.staticQueryParams.functions_url)
    ) {
      if (typeof validateAnnotation !== 'undefined' && typeof validateAnnotation === 'function' && validation[i].validation.length > 0) {
        obj.transcription.html = this.annotationStoreService.underlineTextRed(obj.transcription.text, validation[i].validation);
      }

      obj.transcription.html = await this.annotationStoreService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:⌈)|(?:⌉))/, (g0, g1) => {
        if (g1 === '⌈') {
          return '<';
        }
        return '>';
      });
    } else {
      obj.transcription.html = await this.annotationStoreService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:⌈)|(?:⌉))/g, (g0, g1) => {
        if (g1 === '⌈') {
          return '<';
        }
        return '>';
      });
    }

    obj.transcription.html = obj.transcription.html.replace(/(<p>)|(<\/p>)/g, '');

    return obj;
  }

  playAll(nextSegment: number) {
    if (!this._internLevel || this._internLevel.type !== 'SEGMENT') {
      return;
    }

    const segment = this._internLevel.items[nextSegment];

    if (nextSegment < this._internLevel.items.length && this.playAllState.state !== 'stopped') {
      if (
        !this.playAllState.skipSilence ||
        (this.playAllState.skipSilence &&
          segment.getFirstLabelWithoutName('Speaker')?.value !== '' &&
          this.annotationStoreService.breakMarker?.code &&
          segment.getFirstLabelWithoutName('Speaker')?.value?.indexOf(this.annotationStoreService.breakMarker.code) !== undefined)
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

  private scrollToSegmentIndex(segmentIndex: number) {
    const container = this.el.nativeElement as HTMLDivElement;
    const index = segmentIndex > 0 ? segmentIndex - 1 : segmentIndex;
    const segmentRow = container.querySelector(`#transcr-overview-segment-${index}`) as HTMLTableRowElement;
    const thead = container.querySelector('#table-head') as HTMLElement;
    this.renderer.setStyle(container, 'scroll-margin-top', `${thead.offsetHeight + 50}px`);

    const isTop = segmentRow.offsetTop < container.scrollTop;
    const isBelow = segmentRow.offsetTop > container.scrollTop + container.offsetHeight;

    if (isBelow || isTop) {
      // scroll only if outside view
      container.scrollTo(0, Math.max(0, segmentRow.offsetTop));
      this.cd.markForCheck();
    }
  }

  togglePlayAll() {
    this.playAllState.icon = this.playAllState.icon === 'bi bi-play-fill' ? 'bi bi-stop-fill' : 'bi bi-play-fill';
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
            this.targetName,
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
          if (this.playAllState.currentSegment > -1) {
            this.shownSegments[this.playAllState.currentSegment].playState.state = 'stopped';
            this.shownSegments[this.playAllState.currentSegment].playState.icon = 'bi bi-play-fill';
          }

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
            this.targetName,
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
      const level = this._internLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;

      if (this.shownSegments[segmentNumber].playState.state === 'stopped') {
        this.scrollToSegmentIndex(segmentNumber);
        const segment: OctraAnnotationSegment = level.items[segmentNumber];

        this.shownSegments[segmentNumber].playState.state = 'started';
        this.shownSegments[segmentNumber].playState.icon = 'bi bi-stop-fill';
        this.cd.markForCheck();

        const startSample = segmentNumber > 0 ? level.items[segmentNumber - 1].time.samples : 0;
        this.playAllState.currentSegment = segmentNumber;

        this.cd.markForCheck();
        this.audio.audiomanagers[0].playPosition = this.audio.audiomanagers[0].createSampleUnit(startSample);
        this.audio.audiomanagers[0]
          .startPlayback(new AudioSelection(this.audio.audiomanagers[0].createSampleUnit(startSample), segment.time.clone()), 1, 1)
          .then(() => {
            this.shownSegments[segmentNumber].playState.state = 'stopped';
            this.shownSegments[segmentNumber].playState.icon = 'bi bi-play-fill';
            this.playAllState.currentSegment = -1;
            this.cd.markForCheck();

            this.subscribe(timer(100), {
              next: () => {
                this.cd.markForCheck();

                resolve();
              },
            });
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        // stop playback
        this.audio.audiomanagers[0]
          .stopPlayback()
          .then(() => {
            this.shownSegments[segmentNumber].playState.state = 'stopped';
            this.shownSegments[segmentNumber].playState.icon = 'bi bi-play-fill';
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

  playSelectedSegment(event: MouseEvent, segmentNumber: number) {
    // make sure that audio is not playing
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (
      (this.playAllState.state === 'started' && this.playAllState.currentSegment !== segmentNumber) ||
      this.playAllState.currentSegment !== segmentNumber
    ) {
      this.stopPlayback()
        .then(() => {
          this.cd.markForCheck();

          const startSample =
            segmentNumber > 0 ? (this.annotationStoreService.currentLevel?.items[segmentNumber - 1] as OctraAnnotationSegment).time.samples : 0;
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
              length: (this.annotationStoreService.currentLevel?.items[segmentNumber] as OctraAnnotationSegment).time.samples - startSample,
            },
            this.targetName,
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
        segmentNumber > 0 ? (this.annotationStoreService.currentLevel!.items[segmentNumber - 1] as OctraAnnotationSegment).time.samples : 0;
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
          length: (this.annotationStoreService.currentLevel!.items[segmentNumber] as OctraAnnotationSegment).time.samples - startSample,
        },
        this.targetName,
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
    await this.onTextEditorLeave(i, true);
    if (this._internLevel?.items && i < this._internLevel.items.length - 1) {
      this.onMouseDown(i + 1);
    } else {
      this.cd.markForCheck();
    }
  }

  async doDirection(direction: 'down' | 'up') {
    const i = this._selectedUnit.selectedSegment;
    if (this._selectedUnit.selectedSegment > -1) {
      await this.onTextEditorLeave(i, true);
    }

    if (this._internLevel?.items) {
      if (direction === 'down') {
        this.onMouseDown(Math.min(i, this._internLevel.items.length - 2) + 1);
      } else {
        this.onMouseDown(Math.max(i, 1) - 1);
      }
    }

    await this.updateSegments();
    this.cd.markForCheck();
  }

  toggleSkipCheckbox() {
    this.playAllState.skipSilence = !this.playAllState.skipSilence;
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playAllState.currentSegment > -1) {
        this.shownSegments[this.playAllState.currentSegment].playState.state = 'stopped';
        this.shownSegments[this.playAllState.currentSegment].playState.icon = 'bi bi-play-fill';
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

    for (const validationArrayElement of this.annotationStoreService.validationArray) {
      const index = result.findIndex((a) => a.id === validationArrayElement.level);
      if (index < 0) {
        result.push({
          id: validationArrayElement.level,
          level: this.annotationStoreService?.transcript?.levels?.find((a) => a.id === validationArrayElement.level)!.name!,
          errors: validationArrayElement.validation.length,
        });
      } else {
        result[index].errors += validationArrayElement.validation.length;
      }
    }

    return result;
  }
}
