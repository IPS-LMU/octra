import {Component} from '@angular/core';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-supportedfiles-modal',
  templateUrl: './supportedfiles-modal.component.html',
  styleUrls: ['./supportedfiles-modal.component.scss']
})

export class SupportedFilesModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };
  AppInfo = AppInfo;

  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(public modalRef: MdbModalRef<SupportedFilesModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }
}
