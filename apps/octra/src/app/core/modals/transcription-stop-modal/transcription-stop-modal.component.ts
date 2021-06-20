import {Component, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

export enum TranscriptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT'
}

@Component({
  selector: 'octra-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.css']
})

export class TranscriptionStopModalComponent {
  modalRef: MdbModalRef<TranscriptionStopModalComponent>;

  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;

  private actionperformed: Subject<TranscriptionStopModalAnswer> = new Subject<TranscriptionStopModalAnswer>();

  constructor(private modalService: MdbModalService) {
  }

  public open(): Promise<TranscriptionStopModalAnswer> {
    return new Promise<TranscriptionStopModalAnswer>((resolve, reject) => {
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
    this.actionperformed.next(action as TranscriptionStopModalAnswer);
  }
}
