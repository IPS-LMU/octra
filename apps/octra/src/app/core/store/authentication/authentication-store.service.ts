import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { AccountLoginMethod } from '@octra/api-types';
import { AuthenticationActions } from './authentication.actions';
import { RootState } from '../index';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationStoreService {
  constructor(private store: Store<RootState>) {}

  authenticated$ = this.store.select(
    (store: RootState) => store.authentication.authenticated
  );
  authType$ = this.store.select(
    (store: RootState) => store.authentication.type
  );
  logoutMessage$ = this.store.select(
    (store: RootState) => store.authentication.logoutMessage
  );
  logoutMessageType$ = this.store.select(
    (store: RootState) => store.authentication.logoutMessageType
  );
  loginErrorMessage$ = this.store.select(
    (store: RootState) => store.authentication.loginErrorMessage
  );

  login(method: AccountLoginMethod, username?: string, password?: string) {
    this.store.dispatch(
      AuthenticationActions.login.do({ method, username, password })
    );
  }

  logout(message?: string, messageType?: string) {
    this.store.dispatch(
      AuthenticationActions.logout.do({
        message,
        messageType,
      })
    );
  }

  loginAuto(method: AccountLoginMethod, params?: any) {
    this.store.dispatch(AuthenticationActions.loginAuto.do({ method, params }));
  }

  continueSessionAfterAgreement(
    method: AccountLoginMethod,
    sessionToken: string,
    params?: any
  ) {
    this.store.dispatch(
      AuthenticationActions.continueSessionAfterAgreement.do({
        method,
        sessionToken,
        params,
      })
    );
  }

  reauthenticate(
    method: AccountLoginMethod,
    actionAfterSuccess: Action,
    username?: string,
    password?: string
  ) {
    this.store.dispatch(
      AuthenticationActions.reauthenticate.do({
        method,
        username,
        password,
        actionAfterSuccess,
      })
    );
  }

  setReAuthenticationSuccess(actionAfterSuccess: Action) {
    this.store.dispatch(
      AuthenticationActions.needReAuthentication.success({ actionAfterSuccess })
    );
  }
}
