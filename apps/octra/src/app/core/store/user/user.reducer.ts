import {createReducer, on} from '@ngrx/store';
import {UserState} from '../index';
import * as fromFeedbackActions from './user.actions';

export const initialState: UserState = {
  name: '',
  email: ''
};

export const reducer = createReducer(
  initialState,
  on(fromFeedbackActions.setUserProfile, (state, user) => {
    return {
      ...state,
      ...user
    }
  })
);

