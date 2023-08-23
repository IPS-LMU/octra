import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccountLoginMethod } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { DefaultComponent } from '../default.component';

@Component({
  selector: 'octra-authentication-component',
  templateUrl: './authentication-component.component.html',
  styleUrls: ['./authentication-component.component.scss'],
})
export class AuthenticationComponent extends DefaultComponent {
  @Output() submitClick = new EventEmitter<{
    type: AccountLoginMethod;
    credentials?: {
      usernameEmail: string;
      password: string;
    };
  }>();

  @Input() authentications?: AccountLoginMethod[] = [
    AccountLoginMethod.local,
    AccountLoginMethod.shibboleth,
  ];
  @Input() type?: AccountLoginMethod;
  @Input()
  showTitle = true;

  showForgetPassword = false;
  passwordResetRequested = false;
  email?: string;

  protected readonly AccountLoginMethod = AccountLoginMethod;

  resetPassword() {
    this.api
      .requestPasswordReset({
        email: this.email!,
        redirectTo: location.href,
      })
      .subscribe({
        next: () => {
          this.passwordResetRequested = true;
        },
      });
  }

  constructor(private api: OctraAPIService) {
    super();
  }

  isAuthAllowed(type: AccountLoginMethod) {
    return this.authentications?.includes(type) ?? true;
  }
}
