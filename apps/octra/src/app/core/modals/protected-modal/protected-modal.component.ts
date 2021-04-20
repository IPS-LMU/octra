import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';

@Component({
  selector: 'octra-protected-modal',
  templateUrl: './protected-modal.component.html',
  styleUrls: ['./protected-modal.component.css']
})
export class ProtectedModalComponent implements OnInit {
  modalRef: BsModalRef;
  config: ModalOptions = {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  };
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  public data = {
    text: ''
  };

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(data: {
    text: string
  }): Promise<BsModalRef> {
    return new Promise<BsModalRef>((resolve, reject) => {
      this.data.text = data.text;
      this.modalRef = this.modalService.show(this.modal, this.config);
      resolve(this.modalRef);
    });
  }
}
