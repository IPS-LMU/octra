import {Component} from '@angular/core';
import {OctraModal} from '../types';
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'octra-transcription-sending-modal',
  templateUrl: './transcription-sending-modal.component.html',
  styleUrls: ['./transcription-sending-modal.component.scss']
})

export class TranscriptionSendingModalComponent extends OctraModal {
  public content: string;

  constructor(protected override activeModal: NgbActiveModal) {
    super('transcriptionSendingModal', activeModal);
  }
}
