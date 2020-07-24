import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';

export enum ModalSendAnswer {
  CANCEL = 'CANCEL',
  SEND = 'SEND'
}

@Component({
  selector: 'octra-transcription-send-modal',
  templateUrl: './transcription-send-modal.component.html',
  styleUrls: ['./transcription-send-modal.component.css']
})

export class TranscriptionSendModalComponent implements OnInit {
  modalRef: BsModalRef;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<ModalSendAnswer> = new Subject<ModalSendAnswer>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(): Promise<ModalSendAnswer> {
    return new Promise<ModalSendAnswer>((resolve, reject) => {
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

  public close(action: string) {
    this.modalRef.hide();
    this.actionperformed.next(action as ModalSendAnswer);
  }
}
