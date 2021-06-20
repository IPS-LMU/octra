import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
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

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<ModalSendAnswer> = new Subject<ModalSendAnswer>();

  constructor(
    public modalRef: MdbModalRef<TranscriptionSendModalComponent>) {
  }

  public close(action: string) {
    this.modalRef.close();
    this.actionperformed.next(action as ModalSendAnswer);
  }
}
