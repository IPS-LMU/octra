import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AccountLoginMethod,
  AppPropertiesDtoAuthenticationsEnum,
  LANGUAGES,
  TIMEZONE_NAMES,
} from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { DefaultComponent } from '../default.component';
import { SignupComponent } from './signup/signup.component';

@Component({
  selector: 'octra-authentication-component',
  templateUrl: './authentication-component.component.html',
  styleUrls: ['./authentication-component.component.scss'],
  imports: [FormsModule, SignupComponent, TranslocoPipe],
})
export class AuthenticationComponent extends DefaultComponent {
  @Output() submitClick = new EventEmitter<{
    type: AccountLoginMethod;
    credentials?: {
      usernameEmail: string;
      password: string;
    };
  }>();

  @Input() authentications?: AppPropertiesDtoAuthenticationsEnum[] = [
    AccountLoginMethod.local,
    AccountLoginMethod.shibboleth,
  ];
  @Input() type?: AccountLoginMethod;
  @Input() showTitle = true;
  @Input() registrations?: boolean = false;
  @Input() passwordReset?: boolean = false;

  showForgetPassword = false;
  showSignup = false;
  passwordResetRequested = false;
  email?: string;

  credentials: {
    usernameEmail: string;
    password: string;
  } = {
    usernameEmail: '',
    password: '',
  };

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

  constructor(
    private api: OctraAPIService,
    private transloco: TranslocoService,
  ) {
    super();
  }

  isAuthAllowed(type: AccountLoginMethod) {
    return this.authentications?.includes(type) ?? true;
  }

  goBack() {
    this.showSignup = false;
    this.showForgetPassword = false;
    this.passwordResetRequested = false;
  }

  showSignUpForm() {
    this.showSignup = true;
  }

  protected readonly TIMEZONE_NAMES = TIMEZONE_NAMES;
  protected readonly LANGUAGES = LANGUAGES;
}
