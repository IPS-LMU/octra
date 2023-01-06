import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';

export enum TranscriptionStopModalAnswer {
  CONTINUE = 'CONTINUE',
  QUIT = 'QUIT',
  QUITRELEASE = 'QUIT RELEASE'
}

@Component({
  selector: 'app-transcription-stop-modal',
  templateUrl: './transcription-stop-modal.component.html',
  styleUrls: ['./transcription-stop-modal.component.css']
})

export class TranscriptionStopModalComponent implements OnInit {
  @ViewChild('modal', {static: true}) modal: any;

  config: ModalOptions = {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false
  };

  private actionperformed: Subject<TranscriptionStopModalAnswer> = new Subject<TranscriptionStopModalAnswer>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(): Promise<TranscriptionStopModalAnswer> {
    return new Promise<TranscriptionStopModalAnswer>((resolve, reject) => {
      this.modal.show();
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
    this.modal.hide();
    this.actionperformed.next(action as TranscriptionStopModalAnswer);
  }
}
