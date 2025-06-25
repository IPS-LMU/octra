import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-transcription-sending-modal',
  templateUrl: './transcription-sending-modal.component.html',
  styleUrls: ['./transcription-sending-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class TranscriptionSendingModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  public error = '';

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('transcriptionSendingModal', activeModal);

    this.activeModal = activeModal;
  }
}
