import {Component} from '@angular/core';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

export enum TranscriptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT'
}

@Component({
  selector: 'octra-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.scss']
})

export class TranscriptionStopModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  constructor(public modalRef: MdbModalRef<TranscriptionStopModalComponent>) {
  }

  public close(action: string) {
    this.modalRef.close(action);
  }
}
