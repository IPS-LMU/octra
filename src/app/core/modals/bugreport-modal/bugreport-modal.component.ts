import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, SettingsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {BugReportService} from '../../shared/service/bug-report.service';

export enum ModalAnswer {
  CANCEL = 'CANCEL',
  SEND = 'SEND'
}

@Component({
  selector: 'app-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.css']
})

export class BugreportModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public bgemail = '';
  public bgdescr = '';
  public sendpro_obj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private actionperformed: Subject<ModalAnswer> = new Subject<ModalAnswer>();
  private subscrmanager = new SubscriptionManager();

  public get isvalid(): boolean {
    if (this.sendpro_obj || this.bgdescr !== '') {
      return true;
    } else {
      return false;
    }
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService, public bugService: BugReportService, private settService: SettingsService) {
  }

  ngOnInit() {
  }

  public open(data: {
    text: string
  }): Promise<ModalAnswer> {
    return new Promise<ModalAnswer>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
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

  public close(action: string) {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next(<ModalAnswer> action);
  }

  sendBugReport() {
    this.appStorage.email = this.bgemail;

    this.subscrmanager.add(
      this.bugService.sendReport(this.bgemail, this.bgdescr, this.sendpro_obj, {
        auth_token: this.settService.app_settings.octra.bugreport.auth_token,
        url: this.settService.app_settings.octra.bugreport.url
      }).subscribe(
        (result) => {
          this.bugsent = true;
          setTimeout(() => {
            this.bgdescr = '';
            this.modal.hide();
            this.visible = false;
            this.bugsent = false;
          }, 2000);
        }
      )
    );
  }
}
