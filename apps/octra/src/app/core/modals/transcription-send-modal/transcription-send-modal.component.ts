import {Component} from '@angular/core';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

export enum ModalSendAnswer {
  CANCEL = 'CANCEL',
  SEND = 'SEND'
}

@Component({
  selector: 'octra-transcription-send-modal',
  templateUrl: './transcription-send-modal.component.html',
  styleUrls: ['./transcription-send-modal.component.scss']
})

export class TranscriptionSendModalComponent extends OctraModal {
  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('transcriptionSendModal', modalRef, modalService);
  }
}
