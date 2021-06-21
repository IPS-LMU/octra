import {Component} from '@angular/core';
import {AppInfo} from '../../../app.info';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

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

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('transcriptionDelete', modalRef, modalService);
  }
}
