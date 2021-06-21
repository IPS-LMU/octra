import {Component} from '@angular/core';
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

  constructor(public modalRef: MdbModalRef<SupportedFilesModalComponent>) {
  }

  public close() {
    this.modalRef.close();
  }
}
