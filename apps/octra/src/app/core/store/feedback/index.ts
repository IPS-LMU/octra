import {LoginState, RootState} from '../index';
import {pipe} from 'rxjs';

const selectFeedback = (state: RootState) => state.feedback;
export const selectUserProfile = pipe(selectFeedback, (state) => state.user);
export const selectUserName = pipe(selectFeedback, (state) => state.user.name);
export const selectUserEmail = pipe(selectFeedback, (state) => state.user.email);

