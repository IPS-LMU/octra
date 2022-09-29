import {Component, TemplateRef, ViewChild} from '@angular/core';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss']
})
export class ErrorModalComponent extends OctraModal {
  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  text: ''

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('errorModal');
    this.init(modalService, modalRef);
  }
}
