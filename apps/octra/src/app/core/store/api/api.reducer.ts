import { createReducer, on } from '@ngrx/store';
import { APIActions } from './api.actions';
import { APIState } from './index';

export const initialState: APIState = {
  initialized: false,
};

export const apiReducer = createReducer(
  initialState,
  on(APIActions.init.success, (state: APIState, { url }) => {
    return {
      ...state,
      url,
      initialized: true,
    };
  }),
);
