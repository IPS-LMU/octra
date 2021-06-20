import {Component, Input, TemplateRef, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-transcription-sending-modal',
  templateUrl: './transcription-sending-modal.component.html',
  styleUrls: ['./transcription-sending-modal.component.css']
})

export class TranscriptionSendingModalComponent {
  modalRef: MdbModalRef<TranscriptionSendingModalComponent>;

  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  @Input() sendError = '';

  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: MdbModalService) {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }
}
