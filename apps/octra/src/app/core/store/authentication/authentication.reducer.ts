import { createReducer, on } from '@ngrx/store';
import { AuthenticationActions } from './authentication.actions';
import { AuthenticationState } from './index';
import { APIActions } from '../api';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { AccountLoginMethod, AccountRole } from '@octra/api-types';

export const initialState: AuthenticationState = {
  authenticated: false,
};

export const authenticationReducer = createReducer(
  initialState,
  on(
    AuthenticationActions.login.success,
    AuthenticationActions.reauthenticate.success,
    (state: AuthenticationState, { auth, method }) => {
      return {
        ...state,
        me: auth.me,
        authenticated: auth.openURL === undefined,
        type: method,
        webToken: auth.accessToken,
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
        me: undefined,
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
        me: undefined,
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
  ),
  on(APIActions.init.success, (state: AuthenticationState, data: any) => {
    return {
      ...state,
      webToken: data.webToken,
      type: data.authType,
      authenticated: data.authenticated,
    };
  }),
  on(OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success, (state: AuthenticationState, {me}) => ({
    ...state,
    me
  })),
  on(OnlineModeActions.loginDemo, (state: AuthenticationState, data) => {
    return {
      ...state,
      webToken: '8u8asu8dua8sda98dj8adam9d8amd7a',
      type: AccountLoginMethod.local,
      authenticated: true,
      me: {
        id: '23424',
        username: 'demo_user',
        email: 'johndoe@example.com',
        email_verified: true,
        first_name: 'John',
        last_name: 'Doe',
        systemRole: AccountRole.user as any,
        timezone: 'Europe/Berlin',
        locale: 'en-EN',
        projectRoles: [],
      },
    };
  })
);
