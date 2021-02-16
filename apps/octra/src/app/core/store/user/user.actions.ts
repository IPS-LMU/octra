import {createAction, props} from '@ngrx/store';

const context = 'Feedback';
export class UserActions {
  public static setUserProfile = createAction(
    `[${context}] Set user profile`,
    props<{
      name: string;
      email: string;
    }>()
  );
}


