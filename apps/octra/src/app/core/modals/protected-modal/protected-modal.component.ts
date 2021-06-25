import {Component, SecurityContext} from '@angular/core';
import {OctraModal} from '../types';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'octra-protected-modal',
  templateUrl: './protected-modal.component.html',
  styleUrls: ['./protected-modal.component.scss']
})
export class ProtectedModalComponent extends OctraModal {
  public htmlMessage: string;

  public get sanitizedHTMLMessage() {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.htmlMessage);
  }

  constructor(modalRef: MDBModalRef, modalService: MDBModalService, private sanitizer: DomSanitizer) {
    super('messageModal', modalRef, modalService);
  }

}
