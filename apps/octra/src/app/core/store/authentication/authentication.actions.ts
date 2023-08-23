import { Action, createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AccountLoginMethod,
  AuthDto,
  CurrentAccountDto,
} from '@octra/api-types';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginMode } from '../index';
import { SessionFile } from '../../obj/SessionFile';

export class AdaptedAuthDto extends AuthDto {
  method!: AccountLoginMethod;
}

export class AuthenticationActions {
  static loginOnline = createActionGroup({
    source: 'auth/login online',
    events: {
      do: props<{
        mode: LoginMode;
        method: AccountLoginMethod;
        username?: string;
        password?: string;
      }>(),
      redirectToURL: props<{
        mode: LoginMode;
        url: string;
      }>(),
      success: props<{
        mode: LoginMode;
        method: AccountLoginMethod;
        auth: AuthDto;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });

  static loginDemo = createActionGroup({
    source: 'auth/login demo',
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
      success: props<{
        mode: LoginMode;
      }>(),
      fail: props<Error>(),
    },
  });

  static loginLocal = createActionGroup({
    source: 'auth/login local',
    events: {
      do: props<{
        files: File[];
        removeData: boolean;
        mode: LoginMode.LOCAL;
      }>(),
      success: props<{
        mode: LoginMode;
        files: File[];
        sessionFile: SessionFile;
        removeData: boolean;
      }>(),
      fail: props<Error>(),
    },
  });

  static loginAuto = createActionGroup({
    source: 'auth/login online automatically',
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

  static redirectToProjects = createActionGroup({
    source: 'auth/redirect to projects',
    events: {
      do: emptyProps(),
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
        clearSession: boolean;
        mode?: LoginMode;
      }>(),
      success: props<{
        message?: string;
        messageType?: string;
        clearSession: boolean;
        mode?: LoginMode;
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
        auth: AuthDto;
        method: AccountLoginMethod;
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
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
      abort: emptyProps(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });
}
