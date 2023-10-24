import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AccountLoginMethod } from '@octra/api-types';
import { AuthenticationStoreService } from '../../store/authentication';
import { timer } from 'rxjs';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { Action } from '@ngrx/store';
import { DefaultComponent } from '../../component/default.component';
import { SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoginMode } from '../../store';

@Component({
  selector: 'octra-re-authentication-modal',
  templateUrl: './re-authentication-modal.component.html',
  styleUrls: ['./re-authentication-modal.component.scss'],
})
export class ReAuthenticationModalComponent
  extends DefaultComponent
  implements OnInit
{
  public static options: NgbModalOptions = {
    backdrop: 'static',
    centered: true,
    keyboard: false,
    size: 'xl',
  };

  initialized = false;
  type?: AccountLoginMethod;
  authenticationRunning = false;

  forceLogout = false;

  actionAfterSuccess?: Action;

  constructor(
    public activeModal: NgbActiveModal,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
    private authService: AuthenticationStoreService,
    public apiService: OctraAPIService
  ) {
    super();
  }

  init() {
    this.initialized = true;
  }

  callback() {}

  ngOnInit(): void {}

  onSubmit($event: {
    type: AccountLoginMethod;
    credentials?: {
      usernameEmail: string;
      password: string;
    };
  }) {
    if ($event.type === 'shibboleth') {
      this.authenticationRunning = false;
      this.subscrManager.add(
        timer(2000).subscribe({
          next: () => {
            this.authenticationRunning = true;
          },
        })
      );
    }
    this.authService.reauthenticate(
      $event.type,
      this.actionAfterSuccess,
      $event.credentials?.usernameEmail,
      $event.credentials?.password
    );
  }

  onAuthenticatedClick() {
    this.subscrManager.add(
      this.apiService.getMyAccountInformation().subscribe({
        next: (account) => {
          this.authService.setReAuthenticationSuccess(this.actionAfterSuccess);
        },
        error: (error) => {
          this.authenticationRunning = true;
        },
      })
    );
  }

  abort() {
    if (
      this.appStorage.snapshot.application.mode === LoginMode.ONLINE &&
      this.forceLogout
    ) {
      this.appStorage.logout();
      this.activeModal.close();
    } else {
      this.appStorage.abortReAuthentication();
      this.activeModal.close();
    }
  }

  protected readonly LoginMode = LoginMode;
}
