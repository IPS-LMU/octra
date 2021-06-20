import {Component, SecurityContext, TemplateRef, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE'
}

@Component({
  selector: 'octra-transcription-demo-end-modal',
  templateUrl: './transcription-demo-end-modal.component.html',
  styleUrls: ['./transcription-demo-end-modal.component.css']
})

export class TranscriptionDemoEndModalComponent {
  modalRef: MdbModalRef<TranscriptionDemoEndModalComponent>;

  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<ModalEndAnswer> = new Subject<ModalEndAnswer>();

  constructor(private modalService: MdbModalService, private sanitizer: DomSanitizer,
              public languageService: TranslocoService) {
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

  public open(): Promise<ModalEndAnswer> {
    return new Promise<ModalEndAnswer>((resolve, reject) => {
      this.modalRef = this.modalService.open(this.modal, this.config);
      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  public close(action: string) {
    this.modalRef.close();
    this.actionperformed.next(action as ModalEndAnswer);
  }
}
