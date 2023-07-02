import { createReducer, on } from '@ngrx/store';
import { AuthenticationActions } from './authentication.actions';
import { AuthenticationState } from './index';

export const initialState: AuthenticationState = {
  authenticated: false,
};

export const authenticationReducer = createReducer(
  initialState,
  on(
    AuthenticationActions.login.success,
    AuthenticationActions.reauthenticate.success,
    (state: AuthenticationState, me) => {
      return {
        ...state,
        authenticated: me.openURL === undefined,
        type: me.method,
        webToken: me.accessToken,
      };
    }
  ),
  on(
    AuthenticationActions.login.fail,
    AuthenticationActions.reauthenticate.fail,
    AuthenticationActions.continueSessionAfterAgreement.fail,
    (state: AuthenticationState, { error }) => {
      return {
        ...state,
        authenticated: false,
        webToken: undefined,
        type: undefined,
        loginErrorMessage: error?.message,
      };
    }
  ),
  on(
    AuthenticationActions.logout.success,
    (state: AuthenticationState, dto) => {
      return {
        ...state,
        authenticated: false,
        type: undefined,
        webToken: undefined,
        logoutMessage: dto.message,
        logoutMessageType: dto.messageType,
      };
    }
  ),
  on(
    AuthenticationActions.continueSessionAfterAgreement.success,
    (state: AuthenticationState, data) => {
      return {
        ...state,
        webToken: data.sessionToken,
        type: data.method,
        authenticated: true,
      };
    }
  )
);
