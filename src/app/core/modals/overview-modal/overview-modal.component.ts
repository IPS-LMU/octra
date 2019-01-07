import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, KeymappingService, SettingsService, TranscriptionService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {TranscriptionFeedbackComponent} from '../../gui/transcription-feedback/transcription-feedback.component';
import {TranscrOverviewComponent} from '../../gui/transcr-overview';

@Component({
  selector: 'app-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.css']
})

export class OverviewModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal') modal: any;
  @ViewChild('feedback') feedback: TranscriptionFeedbackComponent;
  @ViewChild('overview') overview: TranscrOverviewComponent;
  @Output() transcriptionSend = new EventEmitter<void>();

  protected data = null;
  private shortcutID = -1;

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

  private subscrmanager = new SubscriptionManager();

  private actionperformed: Subject<void> = new Subject<void>();

  constructor(public transcrService: TranscriptionService,
              public ms: BsModalService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private keyService: KeymappingService) {
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
          console.log(`keystroke! ${keyObj.comboKey}`);
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

      if (validate) {
        this.transcrService.validateAll();
      }

      this.visible = true;

      // this.loadForm();

      if (this.appStorage.usemode === 'online') {
        this.feedback.feedback_data = (this.appStorage.feedback === null) ? {} : this.appStorage.feedback;
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
    });
  }

  public close() {
    if (this.visible) {
      this.modal.hide();
      this.visible = false;
      this.actionperformed.next();

      // unsubscribe shortcut listener
      if (this.shortcutID > -1) {
        this.subscrmanager.remove(this.shortcutID);
        this.shortcutID = -1;
      }

      if (this.appStorage.usemode === 'online') {
        this.feedback.saveFeedbackform();
      }
      this.overview.stopPlayback();
    }
  }

  public beforeDismiss() {
    this.actionperformed.next();
    this.overview.stopPlayback();
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.close();
  }

  sendTranscription() {
    if (this.appStorage.usemode === 'online') {
      this.feedback.saveFeedbackform();
    }
    this.overview.stopPlayback();
    this.transcriptionSend.emit();
  }

  /* TODO dead code?
  private loadForm() {
    // create empty attribute
    const feedback = this.transcrService.feedback;
    if (!(this.settingsService.projectsettings === null || this.settingsService.projectsettings === undefined)
      && !(feedback === null || feedback === undefined)
    ) {
      for (const g in feedback.groups) {
        if (!(g === null || g === undefined)) {
          const group = feedback.groups[g];
          for (const c in group.controls) {
            if (!(c === null || c === undefined)) {
              const control = group.controls[c];
              if (control.type.type === 'textarea') {
                this.settingsService[group.name] = control.value;
              } else {
                // radio skip checkboxes
                if (control.type.type !== 'checkbox' && !(control.custom === null || control.custom === undefined)
                  && !(control.custom.checked === null || control.custom.checked === undefined)
                  && control.custom.checked) {
                  this.settingsService[group.name] = control.value;
                }
              }
            }
          }
        }
      }
    }
  }*/

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
}
