import { Action, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { ApplicationActions } from './application/application.actions';
import { AuthenticationActions } from './authentication';

export interface ActionError {
  statusCode?: number;
  message: string;
}

export const checkAndThrowError: (
  error: ActionError,
  lastAction: Action,
  nextAction: Action,
  store: Store,
  callback?: () => void
) => Observable<Action> = (
  error: ActionError,
  lastAction: Action,
  nextAction: Action,
  store: Store,
  callback?: () => void
) => {
  console.error(error);
  if (Object.keys(error).includes('statusCode') && error.statusCode === 0) {
    return of(
      ApplicationActions.showErrorModal.do({
        error: 'server is offline',
        showOKButton: false,
      })
    );
  }
  if (error.statusCode === 401) {
    console.error(error.message);
    store.dispatch(nextAction);
    return of(
      AuthenticationActions.needReAuthentication.do({
        actionAfterSuccess: lastAction,
        forceLogout: true,
      })
    );
  } else if (callback) {
    callback();
  }
  return of(nextAction);
};
