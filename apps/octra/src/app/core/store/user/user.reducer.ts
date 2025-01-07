import { createReducer, on } from '@ngrx/store';
import { IDBActions } from '../idb/idb.actions';
import { UserState } from './index';
import { UserActions } from './user.actions';

export const initialState: UserState = {
  name: '',
  email: '',
};

export const reducer = createReducer(
  initialState,
  on(UserActions.setUserProfile, (state: UserState, user) => {
    return {
      ...state,
      ...user,
    };
  }),
  on(
    IDBActions.loadOptions.success,
    (state: UserState, { applicationOptions }) => ({
      ...state,
      ...(applicationOptions.userProfile ?? {}),
    })
  )
);
