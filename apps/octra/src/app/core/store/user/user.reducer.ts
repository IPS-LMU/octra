import {createReducer, on} from '@ngrx/store';
import {UserState} from '../index';
import * as fromFeedbackActions from './user.actions';
import * as IDBActions from '../idb/idb.actions';

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
  }),
  on(IDBActions.loadOptionsSuccess, (state, {variables}) => {
      let result = state;

      for (const variable of variables) {
        result = saveOptionToStore(result, variable.name, variable.value);
      }

      return result;
    }
  ));

function saveOptionToStore(state: UserState, attribute: string, value: any): UserState {
  switch (attribute) {
    case('_userProfile'):
      const userProfile = {
        name: '',
        email: ''
      };

      if (value.hasOwnProperty('name')) {
        userProfile.name = value.name;
      }
      if (value.hasOwnProperty('email')) {
        userProfile.email = value.email;
      }

      return {
        ...state,
        ...userProfile
      };
  }

  return state;
}

