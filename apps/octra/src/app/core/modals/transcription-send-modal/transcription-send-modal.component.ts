import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

export enum ModalSendAnswer {
  CANCEL = 'CANCEL',
  SEND = 'SEND'
}

@Component({
  selector: 'octra-transcription-send-modal',
  templateUrl: './transcription-send-modal.component.html',
  styleUrls: ['./transcription-send-modal.component.css']
})

export class TranscriptionSendModalComponent {
  modalRef: MdbModalRef<TranscriptionSendModalComponent>;

  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<ModalSendAnswer> = new Subject<ModalSendAnswer>();

  constructor(private modalService: MdbModalService) {
  }

  public open(): Promise<ModalSendAnswer> {
    return new Promise<ModalSendAnswer>((resolve, reject) => {
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

  public close(action: string) {
    this.modalRef.close();
    this.actionperformed.next(action as ModalSendAnswer);
  }
}
