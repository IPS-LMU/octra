import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SubscriptionManager} from 'octra-components';
import {AppStorageService, SettingsService} from '../../shared/service';
import {BugReportService} from '../../shared/service/bug-report.service';

export enum ModalDeleteAnswer {
  DELETE = 'DELETE',
  ABORT = 'ABORT'
}

@Component({
  selector: 'octra-transcription-delete-modal',
  templateUrl: './transcription-delete-modal.component.html',
  styleUrls: ['./transcription-delete-modal.component.css']
})

export class TranscriptionDeleteModalComponent implements OnInit {
  modalRef: BsModalRef;
  AppInfo = AppInfo;
  public visible = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = null;
  private actionperformed: Subject<ModalDeleteAnswer> = new Subject<ModalDeleteAnswer>();
  private subscrmanager = new SubscriptionManager();

  constructor(private modalService: BsModalService, private appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService) {
  }

  ngOnInit() {
  }

  public open(): Promise<ModalDeleteAnswer> {
    return new Promise<ModalDeleteAnswer>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
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
    this.visible = false;
    this.actionperformed.next(action as ModalDeleteAnswer);
  }
}
