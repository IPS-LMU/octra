import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import {
  AlertService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from "../../core/shared/service";
import { AppStorageService } from "../../core/shared/service/appstorage.service";
import { OCTRAEditor } from "../octra-editor";
import { AudioChunk, AudioManager, AudioSelection, SampleUnit } from "@octra/media";
import { TranscrEditorComponent } from "../../core/component/transcr-editor";
import { LoginMode } from "../../core/store";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
  ValidationPopoverComponent
} from "../../core/component/transcr-editor/validation-popover/validation-popover.component";
import {
  findElements,
  getAttr,
  selectAllTextOfNode,
  ShortcutEvent,
  ShortcutGroup,
  SubscriptionManager
} from "@octra/utilities";
import { AudioViewerComponent, AudioviewerConfig } from "@octra/ngx-components";
import { Segment, Segments } from "@octra/annotation";
import { ContextMenuAction, ContextMenuComponent } from "../../core/component/context-menu/context-menu.component";
import { TranslocoService } from "@ngneat/transloco";
import {
  PermutationsReplaceModalComponent
} from "./modals/permutations-replace-modal/permutations-replace-modal.component";
import { Subscription, timer } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

declare let validateAnnotation: any;

@Component({
  selector: "octra-trn-editor",
  templateUrl: "./trn-editor.component.html",
  styleUrls: ["./trn-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrnEditorComponent extends OCTRAEditor implements OnInit, OnDestroy {

  get textEditor(): Texteditor {
    return this._textEditor;
  }

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private sanitizer: DomSanitizer,
              private cd: ChangeDetectorRef,
              private alertService: AlertService,
              private translocoService: TranslocoService,
              private modalService: NgbModal) {
    super();
    this.subscrManager = new SubscriptionManager<Subscription>();
  }

  public static editorname = "TRN-Editor";
  public static initialized: EventEmitter<void> = new EventEmitter<void>();
  public showSignalDisplay = false;
  public lastResizing = 0;

  @ViewChild("transcrEditor", { static: false }) transcrEditor: TranscrEditorComponent;
  @ViewChild("viewer", { static: false }) viewer: AudioViewerComponent;
  @ViewChild("validationPopover", { static: true }) validationPopover: ValidationPopoverComponent;
  @ViewChild("contextMenu", { static: false }) contextMenu: ContextMenuComponent;

  public audioChunk: AudioChunk;
  audioViewerSettings: AudioviewerConfig;
  public popovers = {
    validation: {
      location: {
        x: 0,
        y: 0
      },
      visible: false,
      currentGuideline: {
        description: "",
        title: ""
      },
      mouse: {
        enter: false
      }
    }
  };

  public selectedError: any = "";
  public shownSegments: ShownSegment[] = [];

  public playAllState: {
    state: "started" | "stopped",
    icon: "play" | "stop",
    currentSegment: number,
    skipSilence: boolean
  } = {
    state: "stopped",
    icon: "play",
    currentSegment: -1,
    skipSilence: false
  };

  public playStateSegments: {
    state: "started" | "stopped",
    icon: "play" | "stop"
  }[] = [];
  private lastMouseOver = 0;
  private subscrManager: SubscriptionManager<Subscription>;

  private shortcuts: ShortcutGroup = {
    name: "TRN-Editor",
    enabled: true,
    items: [
      {
        name: "enter",
        keys: {
          mac: "ENTER",
          pc: "ENTER"
        },
        title: "save and next cell",
        focusonly: true
      },
      {
        name: "up",
        keys: {
          mac: "ALT + ARROWUP",
          pc: "ALT + ARROWUP"
        },
        title: "save and upper cell",
        focusonly: false
      },
      {
        name: "right",
        keys: {
          mac: "ALT + ARROWRIGHT",
          pc: "ALT + ARROWRIGHT"
        },
        title: "save and next cell",
        focusonly: false
      },
      {
        name: "down",
        keys: {
          mac: "ALT + ARROWDOWN",
          pc: "ALT + ARROWDOWN"
        },
        title: "save and under cell",
        focusonly: false
      },
      {
        name: "left",
        keys: {
          mac: "ALT + ARROWLEFT",
          pc: "ALT + ARROWLEFT"
        },
        title: "save and previous cell",
        focusonly: false
      }
    ]
  };

  private tableShortcuts: ShortcutGroup = {
    name: "TRN-Editor table",
    enabled: true,
    items: [
      {
        name: "select_all",
        keys: {
          mac: "CMD + A",
          pc: "CTRL + A"
        },
        title: "select all segments",
        focusonly: false
      },
      {
        name: "remove_selected",
        keys: {
          mac: "CMD + BACKSPACE",
          pc: "CTRL + BACKSPACE"
        },
        title: "remove selected completely",
        focusonly: false
      }
    ]
  };

  private audioShortcuts: ShortcutGroup = {
    name: "TRN-Editor texteditor",
    enabled: true,
    items: [
      {
        name: "play_pause",
        keys: {
          mac: "TAB",
          pc: "TAB"
        },
        title: "play pause",
        focusonly: true
      },
      {
        name: "stop",
        keys: {
          mac: "ESC",
          pc: "ESC"
        },
        title: "stop playback",
        focusonly: true
      },
      {
        name: "step_backward",
        keys: {
          mac: "SHIFT + BACKSPACE",
          pc: "SHIFT + BACKSPACE"
        },
        title: "step backward",
        focusonly: true
      },
      {
        name: "step_backwardtime",
        keys: {
          mac: "SHIFT + TAB",
          pc: "SHIFT + TAB"
        },
        title: "step backward time",
        focusonly: true
      }
    ]
  };

  private audioManager: AudioManager;
  private tempSegments: Segments;
  private selectedCell = {
    labelText: "",
    row: 0,
    column: 1
  };

  private _textEditor: Texteditor = {
    state: "inactive",
    selectedSegment: -1,
    openingBlocked: false,
    audiochunk: undefined,
    transcript: ""
  };

  contextMenuProperties: {
    x: number;
    y: number;
    actions: ContextMenuAction[]
  } = {
    x: 0,
    y: 0,
    actions: []
  };

  mergeAllWithSameLabel = () => {
    let intervals: {
      start: number,
      length: number
    }[] = [
      {
        start: 0,
        length: 0
      }
    ];

    let intervalCounter = 0;

    for (let i = 1; i < this.transcrService.currentlevel.segments.segments.length; i++) {
      const segment = this.transcrService.currentlevel.segments.segments[i];
      const previousSegment = this.transcrService.currentlevel.segments.segments[i - 1];

      if (segment.speakerLabel === previousSegment.speakerLabel) {
        intervals[intervalCounter].length++;
      } else {
        intervals.push({
          start: i,
          length: 0
        });
        intervalCounter++;
      }
    }

    intervals = intervals.filter(a => a.length > 0);
    console.log(intervals);
    for (let j = intervals.length - 1; j > -1; j--) {
      const interval = intervals[j];
      this.transcrService.currentlevel.segments.combineSegments(
        interval.start, interval.start + interval.length, this.transcrService.breakMarker.code);

      for (let i = interval.start + interval.length - 1; i > interval.start - 1; i--) {
        console.log(`remove boundary at row ${i} (${interval.start} - ${interval.start + interval.length})`);
      }
    }
    this.transcrService.validateAll();
    this.updateSegments();
    this.cd.markForCheck();
    this.cd.detectChanges();

    this.alertService.showAlert("success", this.translocoService.translate("alerts.combine segments successful"));
  };

  ngOnInit() {
    this.keyMap.register(this.shortcuts);
    this.keyMap.register(this.tableShortcuts);
    this.keyMap.register(this.audioShortcuts);

    this.audioViewerSettings = new AudioviewerConfig();
    // this..name = 'transcr-window viewer';
    this.audioViewerSettings.margin.top = 5;
    this.audioViewerSettings.margin.bottom = 0;
    this.audioViewerSettings.justifySignalHeight = true;
    this.audioViewerSettings.boundaries.enabled = false;
    this.audioViewerSettings.boundaries.readonly = true;
    this.audioViewerSettings.selection.enabled = true;
    this.audioViewerSettings.frame.color = "#222222";
    this.audioViewerSettings.roundValues = false;
    this.audioViewerSettings.showTimePerLine = true;
    this.audioViewerSettings.showProgressBars = true;
    this.audioViewerSettings.multiLine = false;
    this.audioViewerSettings.lineheight = 200;
    // this.audioViewerSettings.av.drawnSelection = undefined;
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunk = this.audioManager.mainchunk.clone();

    this.transcrService.validateAll();
    this.updateSegments();
    this.cd.markForCheck();
    this.cd.detectChanges();
    TrnEditorComponent.initialized.emit();
    this.subscrManager.add(this.keyMap.onShortcutTriggered.subscribe(this.onShortcutTriggered));

    this.contextMenuProperties.actions.push(
      {
        name: "merge selected lines",
        status: "active",
        icon: ["fas", "object-group"],
        label: this.translocoService.translate("trn-editor.context menu.merge selected lines"),
        func: this.mergeSelectedLinesContextMenu
      },
      {
        name: "remove transcripts of selected lines",
        status: "active",
        icon: ["fas", "eraser"],
        label: this.translocoService.translate("trn-editor.context menu.remove transcripts of selected lines"),
        func: this.removeTranscriptsOfSelectedLinesContextMenu
      },
      {
        name: "remove selected lines completely",
        status: "active",
        icon: ["fas", "trash"],
        label: this.translocoService.translate("trn-editor.context menu.remove selected lines completely"),
        func: this.removeSelectedLines
      }
    );
  }

  mergeSelectedLinesContextMenu = () => {
    let intervals: {
      start: number,
      length: number
    }[] = [
      {
        start: 0,
        length: 0
      }
    ];

    let intervalCounter = 0;
    let previousI = -1;

    for (let i = 0; i < this.shownSegments.length; i++) {
      const shownSegment = this.shownSegments[i];

      if (shownSegment.isSelected) {
        if (intervalCounter === 0 && previousI < 0) {
          previousI = i;
        }

        if (previousI > -1 && previousI === i - 1 && intervalCounter < intervals.length) {
          intervals[intervalCounter].length++;
        } else {
          intervals.push({
            start: i,
            length: 0
          });
          intervalCounter++;
        }

        previousI = i;
      } else {
        previousI = -1;
      }
    }

    intervals = intervals.filter(a => a.length > 0);
    console.log(intervals);
    for (let j = intervals.length - 1; j > -1; j--) {
      const interval = intervals[j];
      this.transcrService.currentlevel.segments.combineSegments(
        interval.start, interval.start + interval.length, this.transcrService.breakMarker.code);

      for (let i = interval.start + interval.length - 1; i > interval.start - 1; i--) {
        console.log(`remove boundary at row ${i} (${interval.start} - ${interval.start + interval.length})`);
      }
    }
    this.transcrService.validateAll();
    this.updateSegments();
    this.cd.markForCheck();
    this.cd.detectChanges();

    this.alertService.showAlert("success", this.translocoService.translate("alerts.combine segments ignore speakerlabel successful"));
  };

  removeTranscriptsOfSelectedLinesContextMenu = () => {
    for (let i = 0; i < this.shownSegments.length; i++) {
      const shownSegment = this.shownSegments[i];
      if (shownSegment.isSelected) {
        this.changeTranscriptOfSegment(i, "");
        shownSegment.isSelected = false;
      }
    }
  };

  removeSelectedLines = () => {
    if (this.shownSegments.length > 1) {
      for (let i = 0; i < this.shownSegments.length; i++) {
        const shownSegment = this.shownSegments[i];
        if (shownSegment.isSelected) {
          if (this.shownSegments.length > 1) {
            const oldSegmentEnd = this.transcrService.currentlevel.segments.segments[i].time.clone();
            this.transcrService.currentlevel.segments.removeByIndex(i, this.transcrService.breakMarker.code, false, false);
            if (i > 0) {
              this.transcrService.currentlevel.segments.segments[i - 1].time = oldSegmentEnd;
            }
            this.shownSegments.splice(i, 1);
            i--;
          }
        }
      }
      this.transcrService.currentLevelSegmentChange.emit(undefined);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  afterFirstInitialization() {
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  enableAllShortcuts() {
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disableAllShortcuts() {
  }

  getStartPoint(index: number) {
    return (index > 0) ? this.transcrService.currentlevel.segments.get(index - 1).time.unix : 0;
  }

  openSegment() {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }

  onLabelKeyDown($event: KeyboardEvent, labelCol: HTMLTableCellElement, index: number) {
    if ($event.code === "Enter") {
      $event.preventDefault();
      this.saveNewLabel(index, labelCol.innerText);
      labelCol.contentEditable = "false";
    } else if ($event.code === "Tab") {
      // ignore keys
      $event.preventDefault();
    }
  }

  onLabelKeyUp(labelCol: HTMLTableCellElement) {
    this.selectedCell.labelText = labelCol.innerText;
  }

  onSpeakerLabelMouseDown($event, labelCol: HTMLTableCellElement, rowNumber: number) {
    if (!(this.keyMap.pressedKeys.ctrl || this.keyMap.pressedKeys.cmd)) {
      labelCol.contentEditable = "true";
      this.selectedCell = {
        labelText: labelCol.innerText,
        row: rowNumber,
        column: 1
      };
    } else {
      this.onTableLineClick($event, rowNumber);
    }
  }

  onTimestampMouseDown($event, rowNumber: number) {
    // de-/select row
    if (this._textEditor.state !== "active") {
      this.onTableLineClick($event, rowNumber);
    }
  }

  onContextMenuClick($event: MouseEvent) {
    $event.preventDefault();
    this.contextMenuProperties.x = $event.clientX;
    this.contextMenuProperties.y = $event.pageY - 80;

    const isAnySegmentSelected = this.shownSegments.findIndex(a => a.isSelected) > -1;

    if (this.contextMenu !== undefined && isAnySegmentSelected) {
      this.contextMenu.showMenu();
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  onTranscriptCellMouseOver($event, rowNumber, scrollContainer: HTMLDivElement) {
    this.lastMouseOver = Date.now();
    let target = $event.target as HTMLElement;

    if (this.textEditor.state === "inactive") {
      if (getAttr(target, ".val-error") || getAttr(target.parentElement, ".val-error")) {
        if (!this.popovers.validation.mouse.enter) {
          if (!getAttr(target, ".val-error")) {
            target = target.parentElement;
          }

          let marginTop = 0;

          for (let i = 0; i < rowNumber; i++) {
            const segmentRows = findElements(document.body, ".segment-row");
            if (segmentRows.length > 0) {
              marginTop += segmentRows[i].offsetHeight;
            }
          }
          marginTop -= scrollContainer.scrollTop;
          const headHeight = findElements(document.body, "#table-head")[0].offsetHeight;

          const errorcode = getAttr(target, "data-errorcode");

          this.selectedError = this.transcrService.getErrorDetails(errorcode);

          if (this.selectedError !== undefined) {
            this.validationPopover.show();
            this.validationPopover.description = this.selectedError.description;
            this.validationPopover.title = this.selectedError.title;

            this.popovers.validation.location.y = headHeight + marginTop - this.validationPopover.height + target.offsetTop;
            this.cd.markForCheck();
            this.cd.detectChanges();
            this.popovers.validation.location.x = $event.offsetX;
            this.popovers.validation.mouse.enter = true;
            this.cd.markForCheck();
            this.cd.detectChanges();
          }
        }
      } else {
        this.selectedError = undefined;
        this.popovers.validation.mouse.enter = false;
        this.validationPopover.hide();
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    } else {
      this.popovers.validation.visible = false;
      this.cd.markForCheck();
      this.cd.detectChanges();
    }
  }

  onTranscriptCellMouseDown($event, i) {
    if (this.keyMap.pressedKeys.cmd || this.keyMap.pressedKeys.ctrl) {
      this.onTableLineClick($event, i);
    } else {
      this.deselectAllRows();

      this.closeTextEditor().then(() => {
        this.openTranscrEditor(i);
      });
    }
  }

  focusOnNextSpeakerLabel(segmentNumber: number) {
    const maxSegments = this.transcrService.currentlevel.segments.length;
    segmentNumber = Math.max(-1, Math.min(maxSegments, segmentNumber));
    if (segmentNumber < maxSegments - 1) {
      console.log(`focus on ${segmentNumber}`);
      const segmentLabel = findElements(document.body, ".label-column")[segmentNumber + 1];
      segmentLabel.contentEditable = "true";
      segmentLabel.focus();
      selectAllTextOfNode(segmentLabel);
      this.selectedCell = {
        labelText: this.shownSegments[segmentNumber + 1].label,
        row: segmentNumber + 1,
        column: 1
      };
    }
  }

  sanitizeHTML(str: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(str);
  }

  getShownSegment(startSamples: number, segment: Segment, i: number): ShownSegment {
    const obj: ShownSegment = {
      start: startSamples,
      end: segment.time.samples,
      label: segment.speakerLabel,
      id: segment.id,
      isSelected: false,
      transcription: {
        text: segment.transcript,
        safeHTML: undefined
      },
      validation: ""
    };

    let html = segment.transcript;
    if (this.appStorage.useMode !== LoginMode.URL) {
      if (typeof validateAnnotation !== "undefined" && typeof validateAnnotation === "function"
        && this.transcrService.validationArray[i] !== undefined) {
        if (obj.transcription.text !== "") {
          html = this.transcrService.underlineTextRed(obj.transcription.text,
            this.transcrService.validationArray[i].validation);
        }
      }

      html = this.transcrService.rawToHTML(html);
      html = html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === "[[[") {
          return "<";
        }
        return ">";
      });
    } else {
      html = this.transcrService.rawToHTML(html);
      html = html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === "[[[") {
          return "<";
        }
        return ">";
      });
    }

    html = html.replace(/(<p>)|(<\/p>)/g, "");
    obj.transcription.safeHTML = this.sanitizeHTML(html);

    return obj;
  }

  onKeyUp($event: KeyboardEvent, i: number) {
    if ($event.code === "Enter") {
      this.saveAndCloseTranscrEditor().then(() => {
        /*
        this.uiService.addElementFromEvent('segment', {
          value: 'updated'
        }, Date.now(), undefined, undefined, undefined, {
          start: startSample,
          length: segment.time.samples - startSample
        }, 'overview'); */
      });
    } else if ($event.code === "Escape") {
      // close without saving
      this._textEditor.audiochunk.stopPlayback();
      this.subscrManager.add(timer(1000).subscribe(() => {
        this.closeTextEditor();
      }));
    }
  }

  saveAndCloseTranscrEditor() {
    return new Promise<void>((resolve) => {
      if (this.textEditor.state === "inactive") {
        resolve();
      } else {
        this._textEditor.audiochunk.stopPlayback();
        let started = Date.now();
        const overallTime = started;

        this.waitForTranscrEditor().then(() => {
          console.log(`waiting ended: ${Date.now() - started}ms`);
          started = Date.now();
          this.save();
          console.log(`saving ended: ${Date.now() - started}ms`);
          started = Date.now();
          this.transcrService.validateAll();
          console.log(`validated ended: ${Date.now() - started}ms`);
          started = Date.now();
          this.transcrService.saveSegments();
          console.log(`saveSegments ended: ${Date.now() - started}ms`);

          this.textEditor.state = "inactive";
          this.textEditor.selectedSegment = -1;

          this.audioManager.removeChunk(this.textEditor.audiochunk);
          this.textEditor.audiochunk = undefined;

          started = Date.now();
          this.updateSegments();
          console.log(`updateSegments ended: ${Date.now() - started}ms`);
          started = Date.now();
          this.cd.markForCheck();
          this.cd.detectChanges();
          console.log(`detectChanges saveCloseeditor ended: ${Date.now() - started}ms`);
          console.log(`saveAndCloseEditor ended: ${Date.now() - overallTime}ms`);
          resolve();
        });
      }
    });
  }

  updateTempSegments() {
    const segStart = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this._textEditor.audiochunk.time.start.add(new SampleUnit(20, this.audioManager.sampleRate))
    );
    const currentSegment = this.transcrService.currentlevel.segments.get(segStart);

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
        return "";
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
        this.audioManager.createSampleUnit(samplesArray[i]), currentSegment.speakerLabel, segTexts[i]
      );
    }

    // shift rest of text to next segment
    const found = this.tempSegments.get(segStart + segTexts.length - 1);

    if (!(found === undefined || found === undefined)) {
      this.tempSegments.get(segStart + segTexts.length - 1).transcript = segTexts[segTexts.length - 1];
    }
  }

  save() {
    this.updateTempSegments();
    const segmentIndex = this._textEditor.selectedSegment;

    if (segmentIndex > -1 && this.transcrService.currentlevel.segments &&
      segmentIndex < this.transcrService.currentlevel.segments.length) {
      if (this.transcrEditor.html.indexOf("<img src=\"assets/img/components/transcr-editor/boundary.png\"") > -1) {
        // boundaries were inserted
        this.transcrService.currentlevel.segments.segments = this.tempSegments.segments;
        this.transcrService.currentLevelSegmentChange.emit(undefined);
      } else {
        // no boundaries inserted
        const segment = this.transcrService.currentlevel.segments.get(segmentIndex).clone();
        this.transcrEditor.updateRawText();
        segment.transcript = this.transcrEditor.rawText;
        segment.isBlockedBy = this.transcrService.currentlevel.segments.get(segmentIndex).isBlockedBy;
        this.transcrService.currentlevel.segments.change(segmentIndex, segment);
      }
    } else {
      const isNull = this.transcrService.currentlevel.segments === undefined;
      console.log(`could not save segment. segment index=${segmentIndex},
segments=${isNull}, ${this.transcrService.currentlevel.segments.length}`);
    }
  }

  test() {
    this.viewer.init();
  }

  @HostListener("window:resize", ["$event"])
  onResize($event) {
    const oldValue = this.showSignalDisplay;
    this.showSignalDisplay = true;
    if (oldValue !== this.showSignalDisplay) {
      this.cd.markForCheck();
      this.cd.detectChanges();
    }

    this.subscrManager.add(timer(60).subscribe(() => {
      if (Date.now() - this.lastResizing > 50) {
        this.showSignalDisplay = false;
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    }));
    this.lastResizing = Date.now();
  }

  closeTextEditor() {
    return new Promise<void>((resolve) => {
      if (this.textEditor.state !== "inactive") {
        this.waitForTranscrEditor().then(() => {
          this.textEditor.state = "inactive";
          this.textEditor.selectedSegment = -1;

          this.audioManager.removeChunk(this.textEditor.audiochunk);
          this.textEditor.audiochunk = undefined;
          this.cd.markForCheck();
          this.cd.detectChanges();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  playSegement(segmentNumber: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.playStateSegments[segmentNumber].state === "stopped") {
        console.log(`play segment ${segmentNumber}`);
        const segments = this.transcrService.currentlevel.segments.segments;
        console.log(segments);

        const segment: Segment = segments[segmentNumber];

        this.playStateSegments[segmentNumber].state = "started";
        this.playStateSegments[segmentNumber].icon = "stop";

        this.cd.markForCheck();
        this.cd.detectChanges();

        const startSample = (segmentNumber > 0) ? segments[segmentNumber - 1].time.samples : 0;
        const startSampleUnit = this.audio.audiomanagers[0].createSampleUnit(startSample);
        const playDuration = new AudioSelection(startSampleUnit, segment.time);

        this.playAllState.currentSegment = segmentNumber;

        this.cd.markForCheck();
        this.cd.detectChanges();

        console.log(`should be: ${segment.time.seconds - startSampleUnit.seconds}`);
        console.log(`start from ${startSampleUnit.seconds} with duration ${playDuration.duration.seconds}`);

        this.audio.audiomanagers[0].playposition = this.audio.audiomanagers[0].createSampleUnit(startSample);
        this.audio.audiomanagers[0].startPlayback(playDuration, 1, 1).then(() => {
          this.playStateSegments[segmentNumber].state = "stopped";
          this.playStateSegments[segmentNumber].icon = "play";
          this.playAllState.currentSegment = -1;
          this.cd.markForCheck();
          this.cd.detectChanges();

          resolve();
        }).catch((error) => {
          console.error(error);
        });
      } else {
        // stop playback
        this.audio.audiomanagers[0].stopPlayback().then(() => {
          this.playStateSegments[segmentNumber].state = "stopped";
          this.playStateSegments[segmentNumber].icon = "play";

          this.cd.markForCheck();
          this.cd.detectChanges();

          resolve();
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }

  playAll(nextSegment: number) {
    const segments = this.transcrService.currentlevel.segments.segments;

    const segment = segments[nextSegment];

    if (nextSegment < segments.length && this.playAllState.state === "stopped") {
      if (!this.playAllState.skipSilence ||
        (this.playAllState.skipSilence && segment.transcript !== ""
          && segment.transcript.indexOf(this.transcrService.breakMarker.code) < 0)
      ) {
        this.playAllState.currentSegment = nextSegment;
        this.playSegement(nextSegment).then(() => {
          this.playAll(++nextSegment);
        });
      } else {
        // skip segment with silence
        this.playAll(++nextSegment);
      }
    } else if (nextSegment < segments.length) {
      // last segment reached
      this.playAllState.state = "stopped";
      this.playAllState.icon = "play";

      this.cd.markForCheck();
      this.cd.detectChanges();
    } else {
      console.log(`playAll failed`);
    }
  }

  togglePlayAll() {
    this.playAllState.icon = (this.playAllState.icon === "play") ? "stop" : "play";
    this.cd.markForCheck();
    this.cd.detectChanges();

    const playpos = this.audio.audiomanagers[0].playposition = this.audio.audiomanagers[0].createSampleUnit(0);

    if (this.playAllState.icon === "stop") {
      // start
      this.stopPlayback().then(() => {
        this.uiService.addElementFromEvent("mouseclick", {
          value: "play_all"
        }, Date.now(), playpos, undefined, undefined, undefined, "overview");
        this.playAll(0);
      }).catch((err) => {
        console.error(err);
      });

    } else {
      // stop
      this.stopPlayback().then(() => {
        this.playAllState.state = "stopped";

        this.cd.markForCheck();
        this.cd.detectChanges();

        this.uiService.addElementFromEvent("mouseclick", {
          value: "stop_all"
        }, Date.now(), playpos, undefined, undefined, undefined, "overview");
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  toggleSkipCheckbox() {
    this.playAllState.skipSilence = !this.playAllState.skipSilence;
  }

  playSelectedSegment(segmentNumber: number) {
    // make sure that audio is not playing
    if ((this.playAllState.state === "started" && this.playAllState.currentSegment !== segmentNumber)
      || this.playAllState.currentSegment !== segmentNumber) {
      this.stopPlayback().then(() => {
        this.cd.markForCheck();
        this.cd.detectChanges();

        const startSample = (segmentNumber > 0) ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.samples : 0;
        this.uiService.addElementFromEvent("mouseclick", {
          value: "play_segment"
        }, Date.now(), this.audio.audiomanagers[0].playposition, undefined, undefined, {
          start: startSample,
          length: this.transcrService.currentlevel.segments.get(segmentNumber).time.samples - startSample
        }, "overview");

        this.playSegement(segmentNumber).then(() => {
          this.cd.markForCheck();
          this.cd.detectChanges();
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    } else {
      const startSample = (segmentNumber > 0) ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.samples : 0;
      this.uiService.addElementFromEvent("mouseclick", {
        value: "stop_segment"
      }, Date.now(), this.audio.audiomanagers[0].playposition, undefined, undefined, {
        start: startSample,
        length: this.transcrService.currentlevel.segments.get(segmentNumber).time.samples - startSample
      }, "overview");

      this.stopPlayback().then(() => {
        this.playAllState.icon = "play";
        this.cd.markForCheck();
        this.cd.detectChanges();
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  navigateBetweenCells(direction: "up" | "right" | "down" | "left", segmentNumber: number) {
    if (!(direction === "up" && segmentNumber === 0)) {
      this.saveAndCloseTranscrEditor().then(() => {
        const segmentsLength = this.transcrService.currentlevel.segments.length;

        switch (direction) {
          case "up":
            if (segmentNumber > -1) {
              if (this.selectedCell.column === 2) {
                // transcr editor is opened
                this.openTranscrEditor(segmentNumber - 1);
              } else {
                this.saveNewLabel(segmentNumber, this.selectedCell.labelText);
                this.focusOnNextSpeakerLabel(segmentNumber - 2);
              }
            }
            break;
          case "right":
            if (this.selectedCell.column === 2) {
              this.focusOnNextSpeakerLabel(segmentNumber);
            } else {
              this.saveNewLabel(segmentNumber, this.selectedCell.labelText);
              this.openTranscrEditor(segmentNumber);
            }
            break;
          case "down":
            if (segmentNumber < segmentsLength - 1) {
              if (this.selectedCell.column === 2) {
                // transcr editor is opened
                this.openTranscrEditor(segmentNumber + 1);
              } else {
                this.saveNewLabel(segmentNumber, this.selectedCell.labelText);
                this.focusOnNextSpeakerLabel(segmentNumber);
              }
            }
            break;
          case "left":
            if (this.selectedCell.column === 2) {
              this.focusOnNextSpeakerLabel(segmentNumber - 1);
            } else if (segmentNumber > 0) {
              this.saveNewLabel(segmentNumber, this.selectedCell.labelText);
              this.openTranscrEditor(segmentNumber - 1);
            }
            break;
        }
      });
    }
  }

  public stopPlayback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playAllState.currentSegment > -1) {
        this.playStateSegments[this.playAllState.currentSegment].state = "stopped";
        this.playStateSegments[this.playAllState.currentSegment].icon = "play";
        this.playAllState.currentSegment = -1;
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
      this.audio.audiomanagers[0].stopPlayback().then(() => {
        resolve();
      }).catch(reject);
    });
  }

  onShortcutTriggered = ($event: ShortcutEvent) => {

    const triggerUIAction = (shortcutObj, caretPos: number = -1) => {
      shortcutObj.value = `audio:${shortcutObj.value}`;
      this.uiService.addElementFromEvent("shortcut", shortcutObj, Date.now(),
        this.audioManager.playposition, caretPos, undefined, undefined, "texteditor");
    };

    const shortcutName = $event.shortcutName;
    if (shortcutName !== "") {
      switch (shortcutName) {
        case ("enter"):
          // ignore. This event is catched by the labelKeyDown event handler
          break;
        case ("up"):
          $event.event.preventDefault();
          this.navigateBetweenCells("up", Math.max(0, this.selectedCell.row));
          break;
        case ("right"):
          $event.event.preventDefault();
          this.navigateBetweenCells("right", this.selectedCell.row);
          break;
        case ("down"):
          $event.event.preventDefault();
          this.navigateBetweenCells("down", Math.min(this.transcrService.currentlevel.segments.length, this.selectedCell.row));
          break;
        case ("left"):
          $event.event.preventDefault();
          this.navigateBetweenCells("left", this.selectedCell.row);
          break;
        case("play_pause"):
          if (this._textEditor.state === "active") {
            $event.event.preventDefault();
            triggerUIAction({ shortcut: $event.shortcut, value: shortcutName });
            if (this._textEditor.audiochunk.isPlaying) {
              this._textEditor.audiochunk.pausePlayback().catch((error) => {
                console.error(error);
              });
            } else {
              this._textEditor.audiochunk.startPlayback(false).catch((error) => {
                console.error(error);
              });
            }
          }
          break;
        case("stop"):
          if (this._textEditor.state === "active") {
            $event.event.preventDefault();
            triggerUIAction({ shortcut: $event.shortcut, value: shortcutName });
            this._textEditor.audiochunk.stopPlayback().catch((error) => {
              console.error(error);
            });
          }
          break;
        case("step_backward"):
          if (this._textEditor.state === "active") {
            $event.event.preventDefault();
            triggerUIAction({ shortcut: $event.shortcut, value: shortcutName });
            this._textEditor.audiochunk.stepBackward().catch((error) => {
              console.error(error);
            });
          }
          break;
        case("step_backwardtime"):
          if (this._textEditor.state === "active") {
            $event.event.preventDefault();
            triggerUIAction({ shortcut: $event.shortcut, value: shortcutName });
            this._textEditor.audiochunk.stepBackwardTime(0.5).catch((error) => {
              console.error(error);
            });
          }
          break;
        case("select_all"):
          if (this._textEditor.state !== "active") {
            $event.event.preventDefault();
            for (const shownSegment of this.shownSegments) {
              shownSegment.isSelected = true;
            }
            this.cd.markForCheck();
            this.cd.detectChanges();
          }
          break;
        case("remove_selected"):
          if (this._textEditor.state !== "active") {
            $event.event.preventDefault();

            this.removeSelectedLines();
            this.cd.markForCheck();
            this.cd.detectChanges();
          }
          break;
      }
    }
  };

  private saveNewLabel(index: number, newLabel: string) {
    const segment = this.transcrService.currentlevel.segments.get(index).clone();
    segment.speakerLabel = newLabel;
    this.transcrService.currentlevel.segments.change(index, segment);
  }

  private openTranscrEditor(segmentIndex: number) {
    if (!this._textEditor.openingBlocked) {
      this._textEditor.openingBlocked = true;

      const overallTime = Date.now();
      this.textEditor.state = "active";
      this.textEditor.selectedSegment = segmentIndex;
      this.showSignalDisplay = true;
      this.cd.markForCheck();
      this.cd.detectChanges();

      let started = 0;

      const segments = this.transcrService.currentlevel.segments.segments;
      this.tempSegments = this.transcrService.currentlevel.segments.clone();
      const segment = segments[segmentIndex];
      const segmentStart = (segmentIndex > 0) ? segments[segmentIndex - 1].time : this.transcrService.audioManager.createSampleUnit(0);
      const audiochunk = new AudioChunk(new AudioSelection(segmentStart, segment.time), this.audioManager);

      this.audioManager.addChunk(audiochunk);
      this.textEditor.audiochunk = audiochunk;
      this.showSignalDisplay = false;
      started = Date.now();
      this.cd.markForCheck();
      this.cd.detectChanges();
      console.log(`detected Changes ended: ${Date.now() - started}ms`);

      this.subscrManager.add(
        this.transcrEditor.loaded.subscribe(() => {
          this.subscrManager.removeByTag("openingBlocked");
          this._textEditor.openingBlocked = false;
          this.transcrEditor.focus().catch((error) => {
            console.error(error);
          });
        }), "openingBlocked");

      this.transcrEditor.Settings.btnPopover = false;
      this.transcrEditor.Settings.specialMarkers.boundary = true;
      this.transcrEditor.Settings.markers = this.transcrService.guidelines.markers.items;

      this.transcrEditor.validationEnabled = this.appStorage.useMode !== LoginMode.URL &&
        (this.appStorage.useMode === LoginMode.DEMO || this.settingsService.projectsettings.octra.validationEnabled);
      started = Date.now();
      this.transcrEditor.initialize();
      console.log(`init transccrEditor ended: ${Date.now() - started}ms`);

      started = Date.now();
      this.cd.markForCheck();
      this.cd.detectChanges();
      console.log(`detected Changes ended: ${Date.now() - started}ms`);

      started = Date.now();
      this._textEditor.transcript = segment.transcript;
      console.log(`set rawtext ended: ${Date.now() - started}ms`);

      this.selectedCell = {
        labelText: "",
        row: segmentIndex,
        column: 2
      };
      console.log(`openTranscrEditor ended: ${Date.now() - overallTime}ms`);
    } else {
      console.error(`can't open texteditor because it's blocked!`);
    }
  }

  private updateSegments() {
    this.playStateSegments = [];
    const segments = this.transcrService.currentlevel.segments.segments;
    const oldShownSegments = [...this.shownSegments];
    this.shownSegments = [];

    let startTime = 0;
    const result: ShownSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const obj = this.getShownSegment(startTime, segment, i);
      const foundOldShownSegmentIndex = oldShownSegments.findIndex(a => a.id === segment.id);
      obj.isSelected = (foundOldShownSegmentIndex > -1) ? oldShownSegments[foundOldShownSegmentIndex].isSelected : false;

      result.push(obj);

      startTime = segment.time.samples;

      // set playState
      this.playStateSegments.push({
        state: "stopped",
        icon: "play"
      });
    }

    this.shownSegments = result;
  }

  private waitForTranscrEditor() {
    return new Promise<void>((resolve, reject) => {
      if (this.transcrEditor !== undefined) {
        this.transcrEditor.waitForValidationFinished().then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private deselectAllRows() {
    for (const shownSegment of this.shownSegments) {
      shownSegment.isSelected = false;
    }
  }

  private changeTranscriptOfSegment(index: number, rawTranscript: string) {
    const segment = this.transcrService.currentlevel.segments.get(index).clone();
    segment.transcript = rawTranscript;
    this.transcrService.currentlevel.segments.change(index, segment);

    const newSegment = this.getShownSegment(this.shownSegments[index].start, segment, index);
    this.shownSegments[index].transcription = newSegment.transcription;
  }

  onTableLineClick($event, rowNumber: number) {
    const selectedSegment = this.shownSegments[rowNumber];
    if (this.keyMap.pressedKeys.cmd || this.keyMap.pressedKeys.ctrl) {
      // de- select line
      selectedSegment.isSelected = !selectedSegment.isSelected;
      this.cd.markForCheck();
      this.cd.detectChanges();
    } else {
      this.deselectAllRows();
    }
  }

  openPermutationsReplaceModal() {
    const ref = this.modalService.open(PermutationsReplaceModalComponent);
    ref.result.then((action) => {
      if (action === "replaced") {
        this.updateSegments();
        this.cd.markForCheck();
        this.cd.detectChanges();

        this.alertService.showAlert("success", "finished");
      }
    });
  }

  ngOnDestroy() {
    this.subscrManager.destroy();
    this.keyMap.unregisterAll();
  }
}

interface ShownSegment {
  start: number;
  end: number;
  label: string;
  id: number;
  isSelected: boolean;
  transcription: {
    text: string;
    safeHTML: SafeHtml;
  },
  validation: string;
}

interface Texteditor {
  state: "active" | "inactive",
  selectedSegment: number,
  openingBlocked: boolean,
  audiochunk: AudioChunk,
  transcript: string,
}
