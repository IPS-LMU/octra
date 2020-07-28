import {RootState} from '../index';
import {pipe} from 'rxjs';

export const selectLogin = (state: RootState) => state.login;
export const selectOnlineSession = pipe(selectLogin, (state) => state.onlineSession);
export const selectMode = pipe(selectLogin, (state) => state.mode);
export const selectLoggedIn = pipe(selectLogin, (state) => state.onlineSession.loggedIn);
export const selectCurrentMode = pipe(selectLogin, state => state.mode);
