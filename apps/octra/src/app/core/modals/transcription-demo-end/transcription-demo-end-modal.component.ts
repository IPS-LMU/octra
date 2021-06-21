import {Component, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE'
}

@Component({
  selector: 'octra-transcription-demo-end-modal',
  templateUrl: './transcription-demo-end-modal.component.html',
  styleUrls: ['./transcription-demo-end-modal.component.scss']
})

export class TranscriptionDemoEndModalComponent extends OctraModal {
  constructor(modalService: MDBModalService, private sanitizer: DomSanitizer,
              public languageService: TranslocoService, modalRef: MDBModalRef) {
    super('transcriptionDemoEnd', modalRef, modalService);
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }
}
