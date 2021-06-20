import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss']
})
export class ErrorModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  public data = {
    text: ''
  };
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(public modalRef: MdbModalRef<ErrorModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }
}
