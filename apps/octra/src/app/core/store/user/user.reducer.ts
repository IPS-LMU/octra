import { createReducer, on } from "@ngrx/store";
import { UserActions } from "./user.actions";
import { IDBActions } from "../idb/idb.actions";
import { hasProperty } from "@octra/utilities";
import { UserState } from "./index";

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
  const userProfile = {
    name: '',
    email: ''
  };

  switch (attribute) {
    case('userProfile'):
      if (value !== undefined) {
        if (hasProperty(value, 'name')) {
          userProfile.name = value.name;
        }
        if (hasProperty(value,'email')) {
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

