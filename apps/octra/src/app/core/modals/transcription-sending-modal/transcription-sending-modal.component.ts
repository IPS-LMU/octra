import {Component, Input} from '@angular/core';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-transcription-sending-modal',
  templateUrl: './transcription-sending-modal.component.html',
  styleUrls: ['./transcription-sending-modal.component.scss']
})

export class TranscriptionSendingModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  };

  @Input() sendError = '';

  constructor(private modalService: MdbModalService, public modalRef: MdbModalRef<TranscriptionSendingModalComponent>) {
  }

  public close() {
    this.modalRef.close();
  }
}
