import { Component, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { OctraModal } from '../types';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE',
}

@Component({
  selector: 'octra-transcription-demo-end-modal',
  templateUrl: './transcription-demo-end-modal.component.html',
  styleUrls: ['./transcription-demo-end-modal.component.scss'],
})
export class TranscriptionDemoEndModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  constructor(
    modalService: NgbModal,
    private sanitizer: DomSanitizer,
    public languageService: TranslocoService,
    protected override activeModal: NgbActiveModal
  ) {
    super('transcriptionDemoEnd', activeModal);
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }
}
