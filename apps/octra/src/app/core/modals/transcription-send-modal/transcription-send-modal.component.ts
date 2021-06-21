import {Component} from '@angular/core';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

export enum ModalSendAnswer {
  CANCEL = 'CANCEL',
  SEND = 'SEND'
}

@Component({
  selector: 'octra-transcription-send-modal',
  templateUrl: './transcription-send-modal.component.html',
  styleUrls: ['./transcription-send-modal.component.scss']
})

export class TranscriptionSendModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  constructor(
    public modalRef: MdbModalRef<TranscriptionSendModalComponent>) {
  }

  public close(action: string) {
    this.modalRef.close(action as ModalSendAnswer);
  }
}
