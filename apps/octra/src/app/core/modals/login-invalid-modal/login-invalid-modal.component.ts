import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-login-invalid-modal',
  templateUrl: './login-invalid-modal.component.html',
  styleUrls: ['./login-invalid-modal.component.scss']
})
export class LoginInvalidModalComponent{
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  protected data = {
    text: ''
  };
  private actionperformed: Subject<(void)> = new Subject<(void)>();

  constructor(private modalService: MdbModalService, public modalRef: MdbModalRef<LoginInvalidModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }
}
