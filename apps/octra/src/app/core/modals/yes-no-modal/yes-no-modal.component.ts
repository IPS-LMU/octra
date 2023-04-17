import { Component } from "@angular/core";
import { OctraModal } from "../types";
import { NgbActiveModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "octra-yes-no-modal",
  templateUrl: "./yes-no-modal.component.html",
  styleUrls: ["./yes-no-modal.component.scss"]
})
export class YesNoModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: false
  };
  public message: string;

  constructor(protected override activeModal: NgbActiveModal) {
    super("yesNoModal", activeModal);
  }

}
