import {createReducer, on} from '@ngrx/store';
import {UserState} from '../index';
import {isUnset} from '@octra/utilities';
import {UserActions} from './user.actions';
import {IDBActions} from '../idb/idb.actions';

export const initialState: UserState = {
  name: '',
  email: ''
};

export const reducer = createReducer(
  initialState,
  on(UserActions.setUserProfile, (state: UserState, user) => {
    return {
      ...state,
      ...user
    }
  }),
  on(IDBActions.loadOptionsSuccess, (state: UserState, {applicationOptions}) => {
      let result = state;

      for (const option of applicationOptions) {
        result = writeOptionToStore(result, option.name, option.value);
      }

      return result;
    }
  ));

function writeOptionToStore(state: UserState, attribute: string, value: any): UserState {
  switch (attribute) {
    case('userProfile'):
      const userProfile = {
        name: '',
        email: ''
      };

      if (!isUnset(value)) {
        if (value.hasOwnProperty('name')) {
          userProfile.name = value.name;
        }
        if (value.hasOwnProperty('email')) {
          userProfile.email = value.email;
        }
      }

      return {
        ...state,
        ...userProfile
      };
  }

  return state;
}

