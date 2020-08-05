import {createAction, props} from '@ngrx/store';

const context = 'Feedback';

export const setUserProfile = createAction(
  `[${context}] Set user profile`,
  props<{
    user: {
      name: string;
      email: string;
    }
  }>()
);


