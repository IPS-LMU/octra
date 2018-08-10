import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-login-invalid-modal',
  templateUrl: './login-invalid-modal.component.html',
  styleUrls: ['./login-invalid-modal.component.css']
})
export class LoginInvalidModalComponent implements OnInit {
  modalRef: BsModalRef;
  protected data = {
    text: ''
  };
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal') modal: TemplateRef<any>;

  private actionperformed: Subject<(void)> = new Subject<(void)>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modalRef = this.modalService.show(this.modal, this.config);
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

  public close(action: void) {
    this.modalRef.hide();
    this.actionperformed.next(action);
  }
}
