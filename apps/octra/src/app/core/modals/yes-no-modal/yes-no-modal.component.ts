import {Component} from '@angular/core';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-yes-no-modal',
  templateUrl: './yes-no-modal.component.html',
  styleUrls: ['./yes-no-modal.component.scss']
})
export class YesNoModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  public data = {
    text: ''
  };

  constructor(public modalRef: MdbModalRef<YesNoModalComponent>) {
  }


  public close(action: 'yes' | 'no') {
    this.modalRef.close(action);
  }
}
