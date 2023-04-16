import { Component } from "@angular/core";
import { OctraModal } from "../types";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

export enum TranscriptionStopModalAnswer {
  CONTINUE = "CONTINUE",
  QUIT = "QUIT"
}

@Component({
  selector: "octra-transcription-stop-modal",
  templateUrl: "./transcription-stop-modal.component.html",
  styleUrls: ["./transcription-stop-modal.component.scss"]
})

export class TranscriptionStopModalComponent extends OctraModal {
  constructor(protected override activeModal: NgbActiveModal) {
    super("transcriptionStopModal", activeModal);
  }
}
