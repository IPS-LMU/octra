import {Component} from '@angular/core';
import {OctraModal} from '../types';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';

export enum TranscriptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT'
}

@Component({
  selector: 'octra-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.scss']
})

export class TranscriptionStopModalComponent extends OctraModal {
  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('transcriptionStopModal');
    this.init(modalService, modalRef);
  }
}
