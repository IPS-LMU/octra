import { Action, createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AccountLoginMethod,
  AuthDto,
  CurrentAccountDto,
} from '@octra/api-types';
import { HttpErrorResponse } from '@angular/common/http';

export class AdaptedAuthDto extends AuthDto {
  method!: AccountLoginMethod;
}

export class AuthenticationActions {
  static login = createActionGroup({
    source: 'auth/login',
    events: {
      do: props<{
        method: AccountLoginMethod;
        username?: string;
        password?: string;
      }>(),
      success: props<AdaptedAuthDto>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });

  static loginAuto = createActionGroup({
    source: 'auth/login automatically',
    events: {
      do: props<{
        method: AccountLoginMethod;
        params: any;
      }>(),
      success: props<{
        method: AccountLoginMethod;
      }>(),
      fail: props<Error>(),
    },
  });

  static continueSessionAfterAgreement = createActionGroup({
    source: 'auth/continue session after agreement',
    events: {
      do: props<{
        method: AccountLoginMethod;
        params: any;
        sessionToken: string;
      }>(),
      success: props<{
        method: AccountLoginMethod;
        me: CurrentAccountDto;
        sessionToken: string;
        params: any;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });

  static logout = createActionGroup({
    source: 'auth/logout',
    events: {
      do: props<{
        message?: string;
        messageType?: string;
      }>(),
      success: props<{
        message?: string;
        messageType?: string;
      }>(),
    },
  });

  static reauthenticate = createActionGroup({
    source: 'auth/re-authenticate',
    events: {
      do: props<{
        method: AccountLoginMethod;
        username?: string;
        password?: string;
        actionAfterSuccess: Action;
      }>(),
      success: props<{
        me?: CurrentAccountDto;
        openURL?: string;
        method: AccountLoginMethod;
        accessToken?: string;
        actionAfterSuccess: Action;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
      wait: emptyProps(),
    },
  });

  static needReAuthentication = createActionGroup({
    source: 'auth/need re-authentication',
    events: {
      do: props<{
        actionAfterSuccess: Action;
      }>(),
      success: props<{
        actionAfterSuccess: Action;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });
}
