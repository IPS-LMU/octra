import { pipe } from 'rxjs';
import { RootState } from '../index';

const selectUser = (state: RootState) => state.user;
export const selectUserName = pipe(selectUser, (state) => state.name);
export const selectUserEmail = pipe(selectUser, (state) => state.email);

export interface UserState {
  name: string;
  email: string;
}
