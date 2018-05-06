import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-yes-no-modal',
  templateUrl: './yes-no-modal.component.html',
  styleUrls: ['./yes-no-modal.component.css']
})
export class YesNoModalComponent implements OnInit {
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
