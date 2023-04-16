import {Component} from '@angular/core';
import {AppInfo} from '../../../app.info';
import {OctraModal} from '../types';
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

export enum ModalDeleteAnswer {
  DELETE = 'DELETE',
  ABORT = 'ABORT'
}

@Component({
  selector: 'octra-transcription-delete-modal',
  templateUrl: './transcription-delete-modal.component.html',
  styleUrls: ['./transcription-delete-modal.component.scss']
})

export class TranscriptionDeleteModalComponent extends OctraModal {
  AppInfo = AppInfo;

  constructor(protected override activeModal: NgbActiveModal) {
    super('transcriptionDelete', activeModal);
  }
}
