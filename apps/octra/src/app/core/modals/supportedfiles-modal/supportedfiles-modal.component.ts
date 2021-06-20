import {Component, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-supportedfiles-modal',
  templateUrl: './supportedfiles-modal.component.html',
  styleUrls: ['./supportedfiles-modal.component.css']
})

export class SupportedFilesModalComponent {
  modalRef: MdbModalRef<SupportedFilesModalComponent>;
  AppInfo = AppInfo;
  public visible = false;
  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(private modalService: MdbModalService, private appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService) {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  public close() {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next();
  }
}
