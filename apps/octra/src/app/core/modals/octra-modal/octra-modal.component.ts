import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {AppInfo} from '../../../app.info';
import {SubscriptionManager} from '@octra/utilities';
import {APIService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {ModalService} from '../modal.service';
import {Subscription} from 'rxjs';
import {MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';
import {YesNoModalComponent} from '../yes-no-modal/yes-no-modal.component';
import {SupportedFilesModalComponent} from '../supportedfiles-modal/supportedfiles-modal.component';
import {BugreportModalComponent} from '../bugreport-modal/bugreport-modal.component';
import {ErrorModalComponent} from '../error-modal/error-modal.component';
import {TranscriptionStopModalComponent} from '../transcription-stop-modal/transcription-stop-modal.component';
import {TranscriptionDeleteModalComponent} from '../transcription-delete-modal/transcription-delete-modal.component';
import {LoginInvalidModalComponent} from '../login-invalid-modal/login-invalid-modal.component';

@Component({
  selector: 'octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.css']
})
export class OctraModalComponent implements OnInit, OnDestroy {
  loginInvalid: MdbModalRef<LoginInvalidModalComponent>;
  transcriptionDelete: MdbModalRef<TranscriptionDeleteModalComponent>;
  transcriptionStop: MdbModalRef<TranscriptionStopModalComponent>;
  error: MdbModalRef<ErrorModalComponent>;
  bugreport: MdbModalRef<BugreportModalComponent>;
  supportedfiles: MdbModalRef<SupportedFilesModalComponent>;
  yesno: MdbModalRef<YesNoModalComponent>;

  public bgdescr = '';
  public bgemail = '';
  public sendproObj = true;
  public bugsent = false;
  public data: any;
  private _subscrmanager: SubscriptionManager<Subscription>;

  public get AppInfo(): any {
    return AppInfo;
  }

  constructor(private modService: ModalService,
              public bugService: BugReportService,
              private api: APIService,
              private appStorage: AppStorageService,
              private modalService: MdbModalService) {
  }

  ngOnInit() {
    this.bgemail = (this.appStorage.userProfile.email !== undefined) ? this.appStorage.userProfile.email : '';
    this._subscrmanager = new SubscriptionManager<Subscription>();

    this._subscrmanager.add(this.modService.showmodal.subscribe(
      (result: any) => {
        this.data = result;

        if (result.type === undefined && this[result.type] !== undefined) {
          const modalRef = this.openModal(result.type);

          if (modalRef !== undefined) {
            modalRef.onClose.toPromise().then((answer: any) => {
              result.emitter.emit(answer);
            }).catch((error) => {
              console.error(error);
            });
          } else{
            console.error(`modalRef for ${result.type} not found`);
          }
        } else {
          const emitter: EventEmitter<any> = result.emitter;
          emitter.error('modal function not supported');
        }
      }));
  }

  ngOnDestroy() {
    this._subscrmanager.destroy();
  }

  openModal(name: string): MdbModalRef<any> {
    switch (name) {
      case 'yesno':
        this.yesno = this.modalService.open(YesNoModalComponent);
        return this.yesno;
      case 'supportedfiles':
        this.supportedfiles = this.modalService.open(SupportedFilesModalComponent);
        return this.supportedfiles;
      case 'bugreport':
        this.bugreport = this.modalService.open(BugreportModalComponent);
        return this.bugreport;
      case 'error':
        this.error = this.modalService.open(ErrorModalComponent);
        return this.error;
      case 'transcriptionStop':
        this.transcriptionStop = this.modalService.open(TranscriptionStopModalComponent);
        return this.transcriptionStop;
      case 'transcriptionDelete':
        this.transcriptionDelete = this.modalService.open(TranscriptionDeleteModalComponent);
        return this.transcriptionDelete;
      case 'loginInvalid':
        this.loginInvalid = this.modalService.open(LoginInvalidModalComponent);
        return this.loginInvalid;
    }
    return undefined;
  }
}
