import {Component, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

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

export class TranscriptionDemoEndModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };

  constructor(private modalService: MdbModalService, private sanitizer: DomSanitizer,
              public languageService: TranslocoService, public modalRef: MdbModalRef<TranscriptionDemoEndModalComponent>) {
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

  public close(action: string) {
    this.modalRef.close(action);
  }
}
