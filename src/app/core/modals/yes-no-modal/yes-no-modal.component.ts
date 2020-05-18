import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-yes-no-modal',
  templateUrl: './yes-no-modal.component.html',
  styleUrls: ['./yes-no-modal.component.css']
})
export class YesNoModalComponent implements OnInit {
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
  private actionperformed: Subject<('yes' | 'no')> = new Subject<('yes' | 'no')>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(data: {
    text: string
  }): Promise<'yes' | 'no'> {
    return new Promise<'yes' | 'no'>((resolve, reject) => {
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
    });
  }

  public close(action: 'yes' | 'no') {
    this.modalRef.hide();
    this.actionperformed.next(action);
  }
}
