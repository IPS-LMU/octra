import { Component, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-protected-modal',
  templateUrl: './protected-modal.component.html',
  styleUrls: ['./protected-modal.component.scss'],
})
export class ProtectedModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;
  private sanitizer = inject(DomSanitizer);

  public htmlMessage = '';

  public get sanitizedHTMLMessage() {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.htmlMessage);
  }

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('messageModal', activeModal);

    this.activeModal = activeModal;
  }
}
