import { EventEmitter, inject, Injectable, OnDestroy } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { Action, Store } from '@ngrx/store';
import { AccountLoginMethod } from '@octra/api-types';
import { BugreportModalComponent } from '@octra/ngx-components';
import { SubscriptionManager } from '@octra/utilities';
import { AppStorageService } from '../shared/service/appstorage.service';
import { BugReportService } from '../shared/service/bug-report.service';
import { LoginMode, RootState } from '../store';
import { UserActions } from '../store/user/user.actions';
import { ErrorModalComponent } from './error-modal/error-modal.component';
import { FeedbackNoticeModalComponent } from './feedback-notice-modal/feedback-notice-modal.component';
import { NgbModalWrapper } from './ng-modal-wrapper';
import { ReAuthenticationModalComponent } from './re-authentication-modal/re-authentication-modal.component';
import { TranslocoService } from '@jsverse/transloco';

@Injectable()
export class OctraModalService implements OnDestroy {
  private modalService = inject(NgbModal);
  private bugService = inject(BugReportService);
  private appStorage = inject(AppStorageService);
  private store = inject<Store<RootState>>(Store);
  private transloco = inject(TranslocoService);

  onModalAction = new EventEmitter<{
    name: string;
    type: 'open' | 'close';
    result?: any;
  }>();
  private subscrManager = new SubscriptionManager();

  ngOnDestroy(): void {
    this.subscrManager.destroy();
  }

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
    data?: Partial<T>,
  ): NgbModalWrapper<T> {
    const ref = this.modalService.open(modal, {
      ...config,
    }) as NgbModalWrapper<T>;
    const name = (ref.componentInstance! as any).name;
    this.applyData(ref, data);
    this.onModalAction.emit({
      type: 'open',
      name,
    });
    ref.result.then((result) => {
      this.onModalAction.emit({
        type: 'close',
        name,
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
    actionAfterSuccess?: Action,
  ) {
    const ref = this.openModalRef<ReAuthenticationModalComponent>(
      ReAuthenticationModalComponent,
      ReAuthenticationModalComponent.options,
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
      ErrorModalComponent.options,
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

  openFeedbackNoticeModal() {
    const ref = this.openModalRef<FeedbackNoticeModalComponent>(
      FeedbackNoticeModalComponent,
      FeedbackNoticeModalComponent.options,
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

  openBugreportModal() {
    this.bugService.getPackage();
    const ref = this.openModalRef<BugreportModalComponent>(BugreportModalComponent, BugreportModalComponent.options, {
      pkgText: this.bugService.pkgText,
      showSenderFields: this.appStorage.useMode !== LoginMode.ONLINE || !this.appStorage.loggedIn,
      _profile: {
        ...((this.appStorage.useMode !== LoginMode.ONLINE || !this.appStorage.loggedIn
          ? this.appStorage.snapshot.user
          : {
              email: this.appStorage.snapshot.authentication?.me?.email,
              name: `${this.appStorage.snapshot.authentication?.me?.first_name} ${this.appStorage.snapshot.authentication?.me?.last_name}`,
            }) ?? {}),
      },
      i18n: {
        abort: this.transloco.translate('g.abort'),
        description: this.transloco.translate('g.description'),
        addProtocol: this.transloco.translate('bug report.add protocol'),
        introduction: this.transloco.translate('bug report.description'),
        error: this.transloco.translate('bug report.error'),
        eMail: this.transloco.translate('g.e-mail'),
        giveFeedback: this.transloco.translate('bug report.give feedback'),
        sending: this.transloco.translate('bug report.sending'),
        bugReportSent: this.transloco.translate('bug report.sent'),
        name: this.transloco.translate('g.name'),
        protocol: this.transloco.translate('g.protocol'),
        screenshots: this.transloco.translate('g.screenshots'),
        sendFeedback: this.transloco.translate('g.send now')
      },
    });

    this.subscrManager.add(
      ref.componentInstance.profileChange.subscribe({
        next: ({ email, name }: any) => {
          this.store.dispatch(UserActions.setUserProfile({ email, name }));
        },
      }),
    );

    this.subscrManager.add(
      ref.componentInstance.send.subscribe({
        next: ({ name, email, message, sendProtocol, screenshots }: any) => {
          console.log('Sending bug report...');
          ref.componentInstance.sendStatus = 'sending';
          ref.componentInstance.waitForSendResponse(this.bugService.sendReport(name, email, message, sendProtocol, screenshots));
        },
      }),
    );

    return ref.result;
  }
}
