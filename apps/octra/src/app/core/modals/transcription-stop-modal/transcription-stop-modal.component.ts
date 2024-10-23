import { Component, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { DefaultComponent } from '../../component/default.component';

export enum TranscriptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT',
  QUITRELEASE = 'QUIT RELEASE',
}

@Component({
  selector: 'octra-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.scss'],
})
export class TranscriptionStopModalComponent extends DefaultComponent {
  @ViewChild('modal', { static: true }) modal: any;

  static options: NgbModalOptions = {
    size: 'lg',
    keyboard: false,
    backdrop: 'static',
  };

  constructor(private activeModal: NgbActiveModal) {
    super();
  }

  public close(action: string) {
    this.activeModal.close(action);
  }
}
