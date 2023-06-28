import { Component, ElementRef, ViewChild } from "@angular/core";
import { OctraModal } from "../types";
import { NgbActiveModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "octra-help-modal",
  templateUrl: "./help-modal.component.html",
  styleUrls: ["./help-modal.component.scss"]
})
export class HelpModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    size: "xl",
    backdrop: true
  };
  public visible = false;

  @ViewChild("modal", { static: true }) modal: any;
  @ViewChild("content", { static: false }) contentElement: ElementRef;

  constructor(protected override activeModal: NgbActiveModal) {
    super("HelpModalComponent", activeModal);
  }
}
