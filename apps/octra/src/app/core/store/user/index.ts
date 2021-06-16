import {RootState} from '../index';
import {pipe} from 'rxjs';

const selectUser = (state: RootState) => state.user;
export const selectUserName = pipe(selectUser, (state) => state.name);
export const selectUserEmail = pipe(selectUser, (state) => state.email);

