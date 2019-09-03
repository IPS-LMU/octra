import {Component, OnInit, SecurityContext, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE'
}

@Component({
  selector: 'app-transcription-demo-end-modal',
  templateUrl: './transcription-demo-end-modal.component.html',
  styleUrls: ['./transcription-demo-end-modal.component.css']
})

export class TranscriptionDemoEndModalComponent implements OnInit {
  modalRef: BsModalRef;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<ModalEndAnswer> = new Subject<ModalEndAnswer>();

  constructor(private modalService: BsModalService, private sanitizer: DomSanitizer,
              private languageService: TranslocoService) {
  }

  ngOnInit() {
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

  public open(): Promise<ModalEndAnswer> {
    return new Promise<ModalEndAnswer>((resolve, reject) => {
      this.modalRef = this.modalService.show(this.modal, this.config);
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
    this.modalRef.hide();
    this.actionperformed.next(action as ModalEndAnswer);
  }
}
