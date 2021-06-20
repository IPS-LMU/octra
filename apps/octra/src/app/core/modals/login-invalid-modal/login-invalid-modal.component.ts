import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-login-invalid-modal',
  templateUrl: './login-invalid-modal.component.html',
  styleUrls: ['./login-invalid-modal.component.css']
})
export class LoginInvalidModalComponent{
  modalRef: MdbModalRef<LoginInvalidModalComponent>;
  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  protected data = {
    text: ''
  };
  private actionperformed: Subject<(void)> = new Subject<(void)>();

  constructor(private modalService: MdbModalService) {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modalRef = this.modalService.open(this.modal, this.config);
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
    this.modalRef.close();
    this.actionperformed.next();
  }
}
