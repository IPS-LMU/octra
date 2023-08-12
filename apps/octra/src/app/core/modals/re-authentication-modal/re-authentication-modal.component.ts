import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AccountLoginMethod } from '@octra/api-types';
import { AuthenticationStoreService } from '../../store/authentication';
import { timer } from 'rxjs';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { Action } from '@ngrx/store';
import { DefaultComponent } from '../../component/default.component';

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

  actionAfterSuccess!: Action;

  constructor(
    public bsModalRef: NgbActiveModal,
    private authService: AuthenticationStoreService,
    private apiService: OctraAPIService
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
}
