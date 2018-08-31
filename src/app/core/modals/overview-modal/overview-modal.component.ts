import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {TranscriptionFeedbackComponent} from '../../gui/transcription-feedback/transcription-feedback.component';

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
  @Output() transcriptionSend = new EventEmitter<void>();

  protected data = null;

  public get feedBackComponent(): TranscriptionFeedbackComponent {
    return this.feedback;
  }

  private subscrmanager = new SubscriptionManager();

  private actionperformed: Subject<void> = new Subject<void>();

  constructor(public transcrService: TranscriptionService,
              public ms: BsModalService,
              private settingsService: SettingsService,
              public appStorage: AppStorageService) {
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

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;

      // this.loadForm();
      if (this.appStorage.usemode === 'online') {
        this.feedback.feedback_data = this.appStorage.feedback;
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
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next();

    if (this.appStorage.usemode === 'online') {
      this.feedback.saveFeedbackform();
    }
  }

  public beforeDismiss() {
    this.actionperformed.next();
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.close();
  }

  sendTranscription() {
    this.close();
    this.transcriptionSend.emit();
  }

  private loadForm() {
    // create emty attribute
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
  }
}
