import {Component, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {hasProperty} from '@octra/utilities';

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css']
})
export class ErrorModalComponent {
  modalRef: BsModalRef;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  public data = {
    text: ''
  };
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: BsModalService) {
  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (hasProperty(data, 'text')) {
        this.data.text = data.text;
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
      } else {
        reject('error modal needs data.text property');
      }
    });
  }

  public close() {
    this.modalRef.hide();
    this.actionperformed.next();
  }
}
