import { Action, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
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
  if (error.statusCode === 401) {
    console.error(error.message);
    store.dispatch(nextAction);
    return of(
      AuthenticationActions.needReAuthentication.do({
        actionAfterSuccess: lastAction,
      })
    );
  } else if (callback) {
    callback();
  }
  return of(nextAction);
};
