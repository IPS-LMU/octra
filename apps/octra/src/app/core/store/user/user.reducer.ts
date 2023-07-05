import { createReducer, on } from '@ngrx/store';
import { UserActions } from './user.actions';
import { UserState } from './index';

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
  })
);
