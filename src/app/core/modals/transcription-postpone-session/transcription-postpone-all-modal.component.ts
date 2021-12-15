import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-transcription-postpone-all-modal',
  templateUrl: './transcription-postpone-all-modal.component.html',
  styleUrls: ['./transcription-postpone-all-modal.component.css']
})

export class TranscriptionPostponeAllModalComponent implements OnInit {
  modalRef: BsModalRef;

  config: ModalOptions = {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true,
    class: 'modal-lg'
  };

  @ViewChild('modal', {static: true}) modal: TemplateRef<any>;
  @Input() sendError = '';

  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  public close() {
    this.modalRef.hide();
    this.actionperformed.next();
  }
}
