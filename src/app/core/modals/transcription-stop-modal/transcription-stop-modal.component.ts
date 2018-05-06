import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';

export enum TranscriptiptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT'
}

@Component({
  selector: 'app-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.css']
})

export class TranscriptionStopModalComponent implements OnInit {
  modalRef: BsModalRef;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal') modal: TemplateRef<any>;

  private actionperformed: Subject<TranscriptiptionStopModalAnswer> = new Subject<TranscriptiptionStopModalAnswer>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(): Promise<TranscriptiptionStopModalAnswer> {
    return new Promise<TranscriptiptionStopModalAnswer>((resolve, reject) => {
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

  public close(action: TranscriptiptionStopModalAnswer) {
    this.modalRef.hide();
    this.actionperformed.next(action);
  }
}
