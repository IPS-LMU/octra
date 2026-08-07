import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, SecurityContext, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { AccountLoginMethod, AppPropertiesDtoAuthenticationsEnum, LANGUAGES, TIMEZONE_NAMES } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { DefaultComponent } from '../default.component';
import { SignupComponent } from './signup/signup.component';

@Component({
  selector: 'octra-authentication-component',
  templateUrl: './authentication-component.component.html',
  styleUrls: ['./authentication-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, SignupComponent, TranslocoPipe],
})
export class AuthenticationComponent extends DefaultComponent {
  protected api = inject(OctraAPIService);
  private sanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);

  @Output() submitClick = new EventEmitter<{
    type: AccountLoginMethod;
    credentials?: {
      usernameEmail: string;
      password: string;
    };
  }>();

  @Input() authentications?: AppPropertiesDtoAuthenticationsEnum[] = [AccountLoginMethod.local, AccountLoginMethod.shibboleth];
  @Input() type?: AccountLoginMethod;
  @Input() showTitle = true;
  @Input() registrations?: boolean = false;
  @Input() passwordReset?: boolean = false;
  @Input() set octraBackendURL(value: string | undefined) {
    this._octraBackendURL = value ? this.sanitizer.sanitize(SecurityContext.URL, value) : undefined;
  }
  protected _octraBackendURL?: SafeUrl | null;

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
          this.cd.markForCheck();
        },
      });
  }

  isAuthAllowed(type: AccountLoginMethod) {
    return this.authentications?.includes(type) ?? true;
  }

  goBack() {
    this.showSignup = false;
    this.showForgetPassword = false;
    this.passwordResetRequested = false;
    this.cd.markForCheck();
  }

  showSignUpForm() {
    this.showSignup = true;
    this.cd.markForCheck();
  }
}
