import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AccountPersonGender,
  COUNTRYSTATES,
  LANGUAGES,
  PolicyListItemDto,
  TIMEZONE_NAMES,
} from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { DefaultComponent } from '../../default.component';

export class PreparedPolicyListItemDto extends PolicyListItemDto {
  checked = false;

  constructor(obj: PolicyListItemDto) {
    super();
    Object.assign(this, obj);
  }
}

@Component({
  selector: 'octra-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [FormsModule, TranslocoPipe],
})
export class SignupComponent extends DefaultComponent implements OnInit {
  protected readonly TIMEZONE_NAMES = TIMEZONE_NAMES;
  protected readonly LANGUAGES = LANGUAGES;

  showSignUp = false;
  signUpLoading = false;
  errorMessage = '';
  nextAction = '';

  private readonly initialState = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password1: '',
    password2: '',
    locale: '',
    timezone: '',
    country: '',
    gender: '',
    policies: [] as PreparedPolicyListItemDto[],
    dataCorrect: false,
  };

  signUpForm = this.initialState;

  constructor(
    private api: OctraAPIService,
    private transloco: TranslocoService
  ) {
    super();
  }

  ngOnInit() {
    this.showSignUpForm();
  }

  showSignUpForm() {
    this.signUpLoading = true;

    this.subscribe(
      this.api.listLatestPolicies(),
      {
        next: (policies) => {
          this.signUpLoading = false;
          this.signUpForm.policies = policies.map(
            (a) => new PreparedPolicyListItemDto(a)
          );
        },
        error: (e) => {
          console.error(e);
        },
      },
      'signup'
    );
  }

  getTranslationPolicy(policy: PolicyListItemDto) {
    if (policy.translations.length > 0) {
      let language = this.transloco.getActiveLang();
      language = language.replace(/-.*/g, '');

      return (
        policy.translations.find((a) => a.locale === language) ??
        policy.translations.find((a) => a.locale === 'en') ??
        policy.translations[0]
      );
    }
    return undefined;
  }

  sendSignup() {
    this.api
      .registerAccount({
        country: this.signUpForm.country,
        username: this.signUpForm.username,
        first_name: this.signUpForm.firstName,
        gender: this.signUpForm.gender as AccountPersonGender,
        last_name: this.signUpForm.lastName,
        email: this.signUpForm.email,
        password: this.signUpForm.password1,
        locale: this.signUpForm.locale,
        timezone: this.signUpForm.timezone,
        acceptedPolicyTranslationIDs: this.signUpForm.policies
          .map((a) => this.getTranslationPolicy(a)?.id)
          .filter((a) => a !== undefined) as number[],
      })
      .subscribe({
        next: (response) => {
          this.nextAction = response.nextAction;
          this.clearForm();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error?.error?.message ?? error.message;
          console.error(error?.error?.message ?? error.message);
        },
      });
  }

  clearForm() {
    this.signUpForm = this.initialState;
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  protected readonly COUNTRYSTATES = COUNTRYSTATES;
}
