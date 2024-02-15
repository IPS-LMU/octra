import { EventEmitter, Injectable } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgbModalWrapper } from './ng-modal-wrapper';
import { AccountLoginMethod } from '@octra/api-types';
import { Action } from '@ngrx/store';
import { ReAuthenticationModalComponent } from './re-authentication-modal/re-authentication-modal.component';
import { ErrorModalComponent } from './error-modal/error-modal.component';
import { FeedbackNoticeModalComponent } from './feedback-notice-modal/feedback-notice-modal.component';

@Injectable()
export class OctraModalService {
  onModalAction = new EventEmitter<{
    name: string;
    type: 'open' | 'close';
    result?: any;
  }>();

  constructor(private modalService: NgbModal) {}

  public openModal<T, R>(modal: T, config: NgbModalOptions, data?: any) {
    const modalRef = this.modalService.open(modal, {
      ...config,
    });

    this.applyData(modalRef, data);

    return modalRef.result as Promise<R>;
  }

  public openModalRef<T>(
    modal: any,
    config: NgbModalOptions,
    data?: any
  ): NgbModalWrapper<T> {
    const ref = this.modalService.open(modal, {
      ...config,
    }) as NgbModalWrapper<T>;
    this.applyData(ref, data);
    this.onModalAction.emit({
      type: 'open',
      name: modal.name,
    });
    ref.result.then((result) => {
      this.onModalAction.emit({
        type: 'close',
        name: modal.name,
        result,
      });
    });

    return ref;
  }

  public applyData(modalRef: NgbModalRef, data?: any) {
    if (data) {
      for (const attr in data) {
        modalRef.componentInstance[attr] = data[attr];
      }
    }
  }

  public openReAuthenticationModal(
    type: AccountLoginMethod,
    forceLogout = false,
    actionAfterSuccess?: Action
  ) {
    const ref = this.openModalRef<ReAuthenticationModalComponent>(
      ReAuthenticationModalComponent,
      ReAuthenticationModalComponent.options
    );
    ref.componentInstance.type = type;
    ref.componentInstance.forceLogout = forceLogout;
    ref.componentInstance.actionAfterSuccess = actionAfterSuccess;

    this.onModalAction.emit({
      type: 'open',
      name: 're-authentication',
    });
    ref.result.then((result) => {
      this.onModalAction.emit({
        type: 'close',
        name: 're-authentication',
        result,
      });
    });

    return ref;
  }

  openErrorModal(text: string) {
    const ref = this.openModalRef<ErrorModalComponent>(
      ErrorModalComponent,
      ErrorModalComponent.options
    );
    ref.componentInstance.text = text;

    this.onModalAction.emit({
      type: 'open',
      name: 'error',
    });
    ref.result.then((result) => {
      this.onModalAction.emit({
        type: 'close',
        name: 'error',
        result,
      });
    });
  }

  openFeedbackModal() {
    const ref = this.openModalRef<FeedbackNoticeModalComponent>(
      FeedbackNoticeModalComponent,
      FeedbackNoticeModalComponent.options
    );

    this.onModalAction.emit({
      type: 'open',
      name: 'feedback',
    });
    ref.result.then((result) => {
      this.onModalAction.emit({
        type: 'close',
        name: 'feedback',
        result,
      });
    });
  }
}
