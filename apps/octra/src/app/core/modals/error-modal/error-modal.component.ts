import {Component, TemplateRef, ViewChild} from '@angular/core';
import {OctraModal} from '../types';
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss']
})
export class ErrorModalComponent extends OctraModal {
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  text: ''

  constructor(protected override activeModal: NgbActiveModal) {
    super('errorModal', activeModal);
  }
}
