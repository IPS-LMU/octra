import {createReducer, on} from '@ngrx/store';
import {FeedbackState} from '../index';
import * as fromFeedbackActions from './feedback.actions';

export const initialState: FeedbackState = {
  user: {
    name: '',
    email: ''
  }
};

export const reducer = createReducer(
  initialState,
  on(fromFeedbackActions.setUserProfile, (state, {user}) => {
    return {
      ...state,
      user
    }
  })
);

