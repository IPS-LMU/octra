import {Component} from '@angular/core';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-transcription-sending-modal',
  templateUrl: './transcription-sending-modal.component.html',
  styleUrls: ['./transcription-sending-modal.component.scss']
})

export class TranscriptionSendingModalComponent extends OctraModal {
  public content: string;

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('transcriptionSendingModal');
    this.init(modalService, modalRef);
  }
}
