import { HttpErrorResponse } from '@angular/common/http';
import { Action, createActionGroup, emptyProps, props } from '@ngrx/store';
import { OAnnotJSON } from '@octra/annotation';
import {
  AccountLoginMethod,
  AuthDto,
  CurrentAccountDto,
  ProjectDto,
  TaskDto,
} from '@octra/api-types';
import { SessionFile } from '../../obj/SessionFile';
import { LoginMode } from '../index';

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
        annotation?: OAnnotJSON;
        removeData: boolean;
        mode: LoginMode.LOCAL;
      }>(),
      prepare: props<{
        mode: LoginMode;
        files: File[];
        annotation?: OAnnotJSON;
        sessionFile: SessionFile;
        removeData: boolean;
      }>(),
      success: props<{
        mode: LoginMode;
        files: File[];
        annotation?: OAnnotJSON;
        sessionFile: SessionFile;
        removeData: boolean;
      }>(),
      fail: props<Error>(),
    },
  });

  static loginURL = createActionGroup({
    source: 'auth/login URL',
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
      success: props<{
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
      }>(),
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
        keepPreviousInformation?: boolean;
      }>(),
      success: props<{
        message?: string;
        messageType?: string;
        clearSession: boolean;
        keepPreviousInformation?: boolean;
        mode?: LoginMode;
        project: ProjectDto;
        task: TaskDto;
        currentEditor: string;
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
        actionAfterSuccess?: Action;
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
        forceAuthentication?: AccountLoginMethod;
        forceLogout: boolean;
        actionAfterSuccess?: Action;
      }>(),
      success: props<{
        actionAfterSuccess?: Action;
      }>(),
      abort: emptyProps(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });
}
