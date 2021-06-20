import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {hasProperty} from '@octra/utilities';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css']
})
export class ErrorModalComponent {
  modalRef: MdbModalRef<ErrorModalComponent>;
  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  public data = {
    text: ''
  };
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: MdbModalService) {
  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (hasProperty(data, 'text')) {
        this.data.text = data.text;
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
      } else {
        reject('error modal needs data.text property');
      }
    });
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }
}
