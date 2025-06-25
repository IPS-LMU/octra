import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AppInfo } from '../../../app.info';
import { OctraModal } from '../types';

export enum ModalDeleteAnswer {
  DELETE = 'DELETE',
  ABORT = 'ABORT',
}

@Component({
  selector: 'octra-transcription-delete-modal',
  templateUrl: './transcription-delete-modal.component.html',
  styleUrls: ['./transcription-delete-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class TranscriptionDeleteModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  AppInfo = AppInfo;

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('transcriptionDelete', activeModal);

    this.activeModal = activeModal;
  }
}
