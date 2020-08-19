import {createReducer, on} from '@ngrx/store';
import {UserState} from '../index';
import * as fromFeedbackActions from './user.actions';
import * as fromIDBActions from '../idb/idb.actions';

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
  on(fromIDBActions.loadOptionsSuccess, (state, {variables}) => {
      let result = state;

      for (const variable of variables) {
        result = saveOptionToStore(state, variable.name, variable.value);
      }

      return result;
    }
  ));

function saveOptionToStore(state: UserState, attribute: string, value: any): UserState {
  console.log(`save Option ${attribute} to store with value "${JSON.stringify(value)}"...`);
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
        ...userProfile
      };
    default:
      console.error(`can't find case for attribute ${attribute}`);
  }

  return state;
}

