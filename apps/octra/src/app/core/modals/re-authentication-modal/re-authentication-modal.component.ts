import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Action } from '@ngrx/store';
import { AccountLoginMethod } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { map, timer } from 'rxjs';
import { AuthenticationComponent } from '../../component/authentication-component/authentication-component.component';
import { DefaultComponent } from '../../component/default.component';
import { SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoginMode } from '../../store';
import { AuthenticationStoreService } from '../../store/authentication';

@Component({
  selector: 'octra-re-authentication-modal',
  templateUrl: './re-authentication-modal.component.html',
  styleUrls: ['./re-authentication-modal.component.scss'],
  imports: [AuthenticationComponent, TranslocoPipe],
})
export class ReAuthenticationModalComponent
  extends DefaultComponent
  implements OnInit
{
  activeModal = inject(NgbActiveModal);
  settingsService = inject(SettingsService);
  appStorage = inject(AppStorageService);
  private authService = inject(AuthenticationStoreService);
  apiService = inject(OctraAPIService);

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
      this.subscribe(timer(2000), {
        next: () => {
          this.authenticationRunning = true;
        },
      });
    }
    this.authService.reauthenticate(
      $event.type,
      this.actionAfterSuccess,
      $event.credentials?.usernameEmail,
      $event.credentials?.password,
    );
  }

  onAuthenticatedClick() {
    this.subscribe(
      this.appStorage.useMode === 'online'
        ? this.apiService.getMyAccountInformation()
        : timer(500).pipe(map((a) => undefined)),
      {
        next: () => {
          this.authService.setReAuthenticationSuccess(this.actionAfterSuccess);
        },
        error: (error) => {
          this.authenticationRunning = true;
        },
      },
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
