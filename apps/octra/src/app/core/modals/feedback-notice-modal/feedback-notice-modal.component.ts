import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AppStorageService } from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-feedback-notice-modal',
  templateUrl: './feedback-notice-modal.component.html',
  styleUrls: ['./feedback-notice-modal.component.css'],
  imports: [TranslocoPipe],
})
export class FeedbackNoticeModalComponent implements OnInit {
  private modal = inject(NgbActiveModal);
  private appStorageService = inject(AppStorageService);

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  ngOnInit() {}

  public close() {
    this.appStorageService.showFeedbackNotice = false;
    this.modal.close();
  }
}
