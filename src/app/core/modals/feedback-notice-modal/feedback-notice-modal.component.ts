import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import {AppStorageService} from '../../shared/service';

@Component({
  selector: 'app-feedback-notice-modal',
  templateUrl: './feedback-notice-modal.component.html',
  styleUrls: ['./feedback-notice-modal.component.css']
})
export class FeedbackNoticeModalComponent implements OnInit {
  @ViewChild('modal', {static: true}) modal: any;
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: BsModalService, private appStorageService: AppStorageService) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal);

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
    this.appStorageService.showFeedbackNotice = false;
    this.modal.hide();
    this.actionperformed.next();
  }
}
