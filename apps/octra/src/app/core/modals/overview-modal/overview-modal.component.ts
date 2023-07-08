import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { TranscriptionFeedbackComponent } from '../../component/transcription-feedback/transcription-feedback.component';
import { isFunction } from '@octra/utilities';
import {
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoginMode } from '../../store';
import { NavbarService } from '../../component/navbar/navbar.service';
import { OctraModal } from '../types';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';

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
    public transcrService: TranscriptionService,
    public modalService: NgbModal,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
    private keyService: KeymappingService,
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
    this.transcrService.requestSegment(segnumber);
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
      (this.sendValidTranscriptOnly && this.transcrService.transcriptValid) ||
      !this.sendValidTranscriptOnly
    ) {
      this.sendTranscription();
    }
  }

  public sendTranscriptionForKorbinian(type: 'NO' | 'VE' | 'EE' | 'AN') {
    this.transcrService.feedback.comment =
      this.transcrService.feedback.comment.replace(
        /(((?:NO)|(?:VE)|(?:EE)|(?:AN))(\s*;\s*)*)/g,
        ''
      );

    if (
      this.appStorage.servercomment !== '' &&
      this.transcrService.feedback.comment === ''
    ) {
      this.transcrService.feedback.comment =
        type + '; ' + this.appStorage.servercomment;
    } else if (
      (this.appStorage.servercomment === '' &&
        this.transcrService.feedback.comment !== '') ||
      (this.appStorage.servercomment !== '' &&
        this.transcrService.feedback.comment !== '')
    ) {
      this.transcrService.feedback.comment =
        type + '; ' + this.transcrService.feedback.comment;
    } else {
      this.transcrService.feedback.comment = type;
    }

    if (
      (this.sendValidTranscriptOnly && this.transcrService.transcriptValid) ||
      !this.sendValidTranscriptOnly
    ) {
      this.sendTranscription();
    }
  }

  public get numberOfSegments(): number {
    return this.transcrService.currentlevel !== undefined &&
      this.transcrService.currentlevel.segments
      ? this.transcrService.currentlevel.segments.length
      : 0;
  }

  public get transcrSegments(): number {
    return this.transcrService.currentlevel !== undefined &&
      this.transcrService.currentlevel.segments
      ? this.transcrService.statistic.transcribed
      : 0;
  }

  public get pauseSegments(): number {
    return this.transcrService.currentlevel !== undefined &&
      this.transcrService.currentlevel.segments
      ? this.transcrService.statistic.pause
      : 0;
  }

  public get emptySegments(): number {
    return this.transcrService.currentlevel !== undefined &&
      this.transcrService.currentlevel.segments
      ? this.transcrService.statistic.empty
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
    this.transcrService.analyse();

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
        this.transcrService.validationArray[i] !== undefined
      ) {
        obj.transcription.html = this.transcrService.underlineTextRed(
          obj.transcription.text,
          this.transcrService.validationArray[i].validation
        );
      }

      obj.transcription.html = this.transcrService.rawToHTML(
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
      obj.transcription.html = this.transcrService.rawToHTML(
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
      this.transcrService.validationArray.length > 0 ||
      this.appStorage.useMode === LoginMode.URL ||
      !this.settingsService.projectsettings?.octra.validationEnabled
    ) {
      if (
        !this.transcrService!.currentlevel!.segments ||
        !this.transcrService!.guidelines
      ) {
        this.shownSegments = [];
      }

      let startTime = 0;
      const result = [];

      for (
        let i = 0;
        i < this.transcrService.currentlevel!.segments.length;
        i++
      ) {
        const segment = this.transcrService.currentlevel!.segments.segments[i];

        const obj = this.getShownSegment(
          startTime,
          segment.time.samples,
          segment.transcript,
          i
        );

        result.push(obj);

        startTime = segment.time.samples;
      }

      this.shownSegments = result;
    }
  }

  switchToTRNEditor() {
    this.navbarService.interfacechange.emit('TRN-Editor');
    this.close(false);
  }
}
