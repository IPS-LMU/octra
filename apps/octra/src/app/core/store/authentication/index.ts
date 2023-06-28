import { AccountLoginMethod } from '@octra/api-types';

export * from './authentication.actions';
export * from './authentication.reducer';
export * from './authentication.effects';
export * from './authentication-store.service';

export interface AuthenticationState {
  webToken?: string;
  authenticated: boolean;
  type?: AccountLoginMethod;
  logoutMessage?: string;
  logoutMessageType?: string;
  loginErrorMessage?: string;
}
