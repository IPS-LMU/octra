import {RootState} from '../index';
import {pipe} from 'rxjs';

export const selectLogin = (state: RootState) => state.login;
export const selectOnlineSession = pipe(selectLogin, (state) => state.onlineSession);
export const selectJobsLeft = pipe(selectOnlineSession, (state) => state.jobsLeft);
export const selectCurrentMode = pipe(selectLogin, state => state.mode);
export const selectMode = pipe(selectLogin, (state) => state.mode);
export const selectLoggedIn = pipe(selectLogin, (state) => state.loggedIn);
export const selectSessionFile = pipe(selectLogin, (state) => state.sessionFile);
export const selectServerDataEntry = pipe(selectOnlineSession, state => state.serverDataEntry);
