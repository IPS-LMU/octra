import { AccountLoginMethod, AuthDtoMe } from '@octra/api-types';

export * from './authentication-store.service';
export * from './authentication.actions';
export * from './authentication.effects';
export * from './authentication.reducer';

export interface AuthenticationState {
  serverOnline?: boolean;
  webToken?: string;
  authenticated: boolean;
  type?: AccountLoginMethod;
  me?: AuthDtoMe;
  previousUser?: {
    id: string;
    username: string;
    email: string;
  };
  logoutMessage?: string;
  logoutMessageType?: string;
  loginErrorMessage?: string;
}
