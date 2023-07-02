import { Component, SecurityContext } from '@angular/core';
import { OctraModal } from '../types';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-protected-modal',
  templateUrl: './protected-modal.component.html',
  styleUrls: ['./protected-modal.component.scss'],
})
export class ProtectedModalComponent extends OctraModal {
  public htmlMessage: string;

  public get sanitizedHTMLMessage() {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.htmlMessage);
  }

  constructor(
    protected override activeModal: NgbActiveModal,
    private sanitizer: DomSanitizer
  ) {
    super('messageModal', activeModal);
  }
}
