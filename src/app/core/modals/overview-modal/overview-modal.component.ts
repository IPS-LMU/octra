import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {TranscrOverviewComponent} from '../../gui/transcr-overview';
import {TranscriptionFeedbackComponent} from '../../gui/transcription-feedback/transcription-feedback.component';
import {SubscriptionManager} from 'octra-components';
import {KeymappingService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.css']
})

export class OverviewModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('feedback', {static: false}) feedback: TranscriptionFeedbackComponent;
  @ViewChild('overview', {static: true}) overview: TranscrOverviewComponent;
  @Output() transcriptionSend = new EventEmitter<void>();

  protected data = null;
  private shortcutID = -1;
  private subscrmanager = new SubscriptionManager();
  private actionperformed: Subject<void> = new Subject<void>();

  public get feedBackComponent(): TranscriptionFeedbackComponent {
    return this.feedback;
  }

  public get sendValidTranscriptOnly(): boolean {
    return (
      !(this.settingsService.projectsettings.octra === null || this.settingsService.projectsettings.octra === undefined)
      && !(
        this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly === null
        || this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly === undefined
      )
      && this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly
    );
  }

  constructor(public transcrService: TranscriptionService,
              public ms: BsModalService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private keyService: KeymappingService,
              private uiService: UserInteractionsService) {
  }

  ngOnInit() {
    this.subscrmanager.add(this.modal.onHide.subscribe(
      () => {
        this.visible = false;
        this.actionperformed.next();
      }
    ));
    this.subscrmanager.add(this.modal.onHidden.subscribe(
      () => {
        this.visible = false;
        this.actionperformed.next();
      }
    ));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  public open(validate = true): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);

      if (this.settingsService.isTheme('shortAudioFiles')) {
        this.shortcutID = this.subscrmanager.add(this.keyService.onkeyup.subscribe((keyObj: any) => {
          switch (keyObj.comboKey) {
            case('CTRL + 1'):
              this.sendTranscriptionForShortAudioFiles('good');
              break;
            case('CTRL + 2'):
              this.sendTranscriptionForShortAudioFiles('middle');
              break;
            case('CTRL + 3'):
              this.sendTranscriptionForShortAudioFiles('bad');
              break;
          }
        }));
      }

      if (this.settingsService.isTheme('korbinian')) {
        this.shortcutID = this.subscrmanager.add(this.keyService.onkeyup.subscribe((keyObj: any) => {
          switch (keyObj.comboKey) {
            case('CTRL + 1'):
              this.sendTranscriptionForKorbinian('NO');
              break;
            case('CTRL + 2'):
              this.sendTranscriptionForKorbinian('VE');
              break;
            case('CTRL + 3'):
              this.sendTranscriptionForKorbinian('EE');
              break;
            case('CTRL + 4'):
              this.sendTranscriptionForKorbinian('AN');
              break;
          }
        }));
      }

      if (validate && this.appStorage.usemode !== 'url') {
        this.transcrService.validateAll();
      }

      this.visible = true;

      if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
        this.feedback.feedbackData = (this.appStorage.feedback === null) ? {} : this.appStorage.feedback;
      }

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

      this.uiService.addElementFromEvent('overview', {value: 'opened'},
        Date.now(), null, null, null, null, 'overview');
    });
  }

  public close(fromModal = false) {
    if (this.visible) {
      this.modal.hide();
      this.visible = false;
      this.actionperformed.next();

      // unsubscribe shortcut listener
      if (this.shortcutID > -1) {
        this.subscrmanager.removeById(this.shortcutID);
        this.shortcutID = -1;
      }

      if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
        this.feedback.saveFeedbackform();
      }
      this.overview.stopPlayback().catch((error) => {
        console.error(error);
      });

      if (fromModal) {
        this.uiService.addElementFromEvent('overview', {value: 'closed'},
          Date.now(), null, null, null, null, 'overview');
      }
    }
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.close();
  }

  sendTranscription() {
    if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
      this.feedback.saveFeedbackform();
    }
    this.overview.stopPlayback().catch((error) => {
      console.error(error);
    });
    this.transcriptionSend.emit();
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case('bad'):
        this.appStorage.feedback = 'SEVERE';
        break;
      case('middle'):
        this.appStorage.feedback = 'SLIGHT';
        break;
      case('good'):
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    if (this.sendValidTranscriptOnly && this.transcrService.transcriptValid || !this.sendValidTranscriptOnly) {
      this.sendTranscription();
    }
  }

  public sendTranscriptionForKorbinian(type: 'NO' | 'VE' | 'EE' | 'AN') {
    this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(((?:NO)|(?:VE)|(?:EE)|(?:AN))(\s*;\s*)*)/g, '');

    if (this.appStorage.servercomment !== '' && this.transcrService.feedback.comment === '') {
      this.transcrService.feedback.comment = type + '; ' + this.appStorage.servercomment;
    } else if ((this.appStorage.servercomment === '' && this.transcrService.feedback.comment !== '')
      || (this.appStorage.servercomment !== '' && this.transcrService.feedback.comment !== '')) {
      this.transcrService.feedback.comment = type + '; ' + this.transcrService.feedback.comment;
    } else {
      this.transcrService.feedback.comment = type;
    }

    if (this.sendValidTranscriptOnly && this.transcrService.transcriptValid || !this.sendValidTranscriptOnly) {
      this.sendTranscription();
    }
  }
}
