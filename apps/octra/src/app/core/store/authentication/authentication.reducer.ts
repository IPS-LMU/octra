import { createReducer, on } from '@ngrx/store';
import { AuthenticationActions } from './authentication.actions';
import { AuthenticationState } from './index';
import { APIActions } from '../api';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import { AccountLoginMethod, AccountRole } from '@octra/api-types';
import { IDBActions } from '../idb/idb.actions';

export const initialState: AuthenticationState = {
  authenticated: false,
};

export const authenticationReducer = createReducer(
  initialState,
  on(
    AuthenticationActions.loginOnline.success,
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
    LoginModeActions.loadCurrentAccountInformation.success,
    (state: AuthenticationState, { me }) => {
      return {
        ...state,
        me,
      };
    }
  ),
  on(
    AuthenticationActions.loginDemo.success,
    AuthenticationActions.loginLocal.success,
    (state: AuthenticationState) => {
      return {
        ...state,
        me: {
          id: '12345',
          username: 'demoUser',
          projectRoles: [],
          systemRole: {
            label: AccountRole.user,
            i18n: {},
            badge: 'orange',
          },
          email: 'demo-user@example.com',
          email_verified: true,
          first_name: 'John',
          last_name: 'Doe',
          last_login: new Date().toISOString(),
          locale: 'en-EN',
          timezone: 'Europe/Berlin',
        },
        authenticated: true,
        type: AccountLoginMethod.local,
        webToken: 'faketoken',
      };
    }
  ),
  on(
    IDBActions.loadOptions.success,
    (state: AuthenticationState, { onlineOptions }) => {
      return {
        ...state,
        previousUser: onlineOptions.user
          ? {
              id: onlineOptions.user.id,
              username: onlineOptions.user.name,
              email: onlineOptions.user.email,
            }
          : undefined,
      };
    }
  ),
  on(
    AuthenticationActions.loginOnline.fail,
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
  on(
    LoginModeActions.loadOnlineInformationAfterIDBLoaded.success,
    (state: AuthenticationState, { me }) => ({
      ...state,
      me,
    })
  )
);
