import { Component, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE',
}

@Component({
  selector: 'octra-transcription-demo-end-modal',
  templateUrl: './transcription-demo-end-modal.component.html',
  styleUrls: ['./transcription-demo-end-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class TranscriptionDemoEndModalComponent extends OctraModal {
  private sanitizer = inject(DomSanitizer);
  languageService = inject(TranslocoService);
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('transcriptionDemoEnd', activeModal);

    this.activeModal = activeModal;
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }
}
