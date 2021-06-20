import {Component} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

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
  private actionperformed: Subject<('yes' | 'no')> = new Subject<('yes' | 'no')>();

  constructor(private modalService: MdbModalService, public modalRef: MdbModalRef<YesNoModalComponent>) {
  }


  public close(action: 'yes' | 'no') {
    this.modalRef.close();
    this.actionperformed.next(action);
  }
}
