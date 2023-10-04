import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { TranscriptionFeedbackComponent } from '../../component/transcription-feedback/transcription-feedback.component';
import { isFunction } from '@octra/utilities';
import { SettingsService, UserInteractionsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoginMode } from '../../store';
import { NavbarService } from '../../component/navbar/navbar.service';
import { OctraModal } from '../types';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraAnnotationSegmentLevel } from '@octra/annotation';

declare let validateAnnotation: (transcript: string, guidelines: any) => any;
declare let tidyUpAnnotation: (transcript: string, guidelines: any) => any;

@Component({
  selector: 'octra-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.scss'],
})
export class OverviewModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: false,
    backdrop: true,
  };

  @ViewChild('feedback', { static: false })
  feedback!: TranscriptionFeedbackComponent;
  @Output() transcriptionSend = new EventEmitter<void>();

  protected data = undefined;
  private shortcutID = -1;

  public get feedBackComponent(): TranscriptionFeedbackComponent {
    return this.feedback;
  }

  public get sendValidTranscriptOnly(): boolean {
    return (
      !(this.settingsService.projectsettings?.octra === undefined) &&
      !(
        this.settingsService.projectsettings.octra
          .sendValidatedTranscriptionOnly === undefined
      ) &&
      this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly
    );
  }

  public selectedError: any = '';
  public shownSegments: {
    transcription: {
      html: string;
      text: string;
    };
  }[] = [];

  public trnEditorswitch = new EventEmitter<void>();

  constructor(
    public modalService: NgbModal,
    public settingsService: SettingsService,
    public annotationStoreService: AnnotationStoreService,
    public appStorage: AppStorageService,
    private uiService: UserInteractionsService,
    private cd: ChangeDetectorRef,
    private navbarService: NavbarService,
    protected override activeModal: NgbActiveModal
  ) {
    super('overviewModal', activeModal);
  }

  public override close(fromModal = false) {
    // unsubscribe shortcut listener
    if (this.shortcutID > -1) {
      this.subscrManager.removeById(this.shortcutID);
      this.shortcutID = -1;
    }

    if (
      this.appStorage.useMode === LoginMode.ONLINE ||
      this.appStorage.useMode === LoginMode.DEMO
    ) {
      this.feedback.saveFeedbackform();
    }

    if (fromModal) {
      this.uiService.addElementFromEvent(
        'overview',
        { value: 'closed' },
        Date.now(),
        undefined,
        undefined,
        undefined,
        undefined,
        'overview'
      );
    }
    return super.close();
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.annotationStoreService.requestSegment(segnumber);
    this.close();
  }

  sendTranscription() {
    if (
      this.appStorage.useMode === LoginMode.ONLINE ||
      this.appStorage.useMode === LoginMode.DEMO
    ) {
      this.feedback.saveFeedbackform();
    }
    this.transcriptionSend.emit();
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case 'bad':
        this.appStorage.feedback = 'SEVERE';
        break;
      case 'middle':
        this.appStorage.feedback = 'SLIGHT';
        break;
      case 'good':
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    if (
      (this.sendValidTranscriptOnly &&
        this.annotationStoreService.transcriptValid) ||
      !this.sendValidTranscriptOnly
    ) {
      this.sendTranscription();
    }
  }

  public get numberOfSegments(): number {
    return this.annotationStoreService.currentLevel !== undefined &&
      this.annotationStoreService.currentLevel.items
      ? this.annotationStoreService.currentLevel.items.length
      : 0;
  }

  public get transcrSegments(): number {
    return this.annotationStoreService.currentLevel !== undefined &&
      this.annotationStoreService.currentLevel.items
      ? this.annotationStoreService.statistics.transcribed
      : 0;
  }

  public get pauseSegments(): number {
    return this.annotationStoreService.currentLevel !== undefined &&
      this.annotationStoreService.currentLevel.items
      ? this.annotationStoreService.statistics.pause
      : 0;
  }

  public get emptySegments(): number {
    return this.annotationStoreService.currentLevel !== undefined &&
      this.annotationStoreService.currentLevel.items
      ? this.annotationStoreService.statistics.empty
      : 0;
  }

  public get foundErrors(): number {
    let found = 0;

    if (this.shownSegments.length > 0) {
      let resultStr = '';
      for (const shownSegment of this.shownSegments) {
        resultStr += shownSegment.transcription.html;
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

  updateView() {
    this.updateSegments();
    this.annotationStoreService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
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

    if (this.appStorage.useMode !== LoginMode.URL) {
      if (
        typeof validateAnnotation !== 'undefined' &&
        typeof validateAnnotation === 'function' &&
        this.annotationStoreService.validationArray[i] !== undefined
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

  private updateSegments() {
    if (
      this.annotationStoreService.validationArray.length > 0 ||
      this.appStorage.useMode === LoginMode.URL ||
      !this.settingsService.projectsettings?.octra?.validationEnabled
    ) {
      if (
        !this.annotationStoreService!.currentLevel!.items ||
        !this.annotationStoreService!.guidelines
      ) {
        this.shownSegments = [];
      }

      let startTime = 0;
      const result = [];

      if (
        this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel
      ) {
        for (
          let i = 0;
          i < this.annotationStoreService.currentLevel!.items.length;
          i++
        ) {
          const segment = this.annotationStoreService.currentLevel!.items[i];

          const obj = this.getShownSegment(
            startTime,
            segment.time.samples,
            segment.getFirstLabelWithoutName('Speaker')?.value ?? '',
            i
          );

          result.push(obj);

          startTime = segment.time.samples;
        }
      }

      this.shownSegments = result;
    }
  }

  switchToTRNEditor() {
    this.navbarService.interfacechange.emit('TRN-Editor');
    this.close(false);
  }
}
