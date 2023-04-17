import { Component } from "@angular/core";
import { OctraModal } from "../types";
import { NgbActiveModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "octra-transcription-sending-modal",
  templateUrl: "./transcription-sending-modal.component.html",
  styleUrls: ["./transcription-sending-modal.component.scss"]
})

export class TranscriptionSendingModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true
  };

  public content: string;

  constructor(protected override activeModal: NgbActiveModal) {
    super("transcriptionSendingModal", activeModal);
  }
}
