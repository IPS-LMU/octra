import {Component, ViewChild} from '@angular/core';
import {BsModalRef, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.css']
})

export class InactivityModalComponent {
  modalRef: BsModalRef;
  public visible = false;
  public config: ModalOptions = {
    keyboard: false,
    backdrop: 'static',
    ignoreBackdropClick: true
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = undefined;
  private actionperformed: Subject<string> = new Subject<string>();

  constructor(public appStorage: AppStorageService, public settService: SettingsService) {
  }

  public open(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
    this.actionperformed.next(action);
  }
}
