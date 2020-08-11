import {createAction, props} from '@ngrx/store';
import {LoginMode, OnlineSession, URLParameters} from '../index';
import {IDataEntry} from '../../obj/data-entry';

const context = 'Login';

export const loginOnline = createAction(
  `[${context}] Login Online`,
  props<{
    onlineSession: OnlineSession
  }>()
);

export const loginDemo = createAction(`[${context}] Login Demo`,
  props<{
    audioURL: string;
    serverComment: string;
    jobsLeft: number;
  }>());

export const loginLocal = createAction(
  `[${context}] Login Local`,
  props<{
    files: File[]
  }>()
);

export const loginURLParameters = createAction(
  `[${context}] Login URLParameters`,
  props<{
    urlParams: URLParameters
  }>()
);

export const logout = createAction(
  `[${context}] Logout`
);

export const setMode = createAction(`[${context}] Set Mode`,
  props<{
    mode: LoginMode;
  }>()
);

export const setAudioURL = createAction(`[${context}] Set Audio URL`,
  props<{
    audioURL: string;
  }>()
);

export const setUserData = createAction(`[${context}] Set user data`,
  props<{
    id: string;
    project: string;
    jobNumber: number;
  }>()
);

export const clearLocalSession = createAction(`[${context}] Clear local session`);
export const clearOnlineSession = createAction(`[${context}] Clear online session`);

export const setServerDataEntry = createAction(
  `[${context}] Set serverDataEntry`,
  props<{
    serverDataEntry: IDataEntry;
  }>()
);

export const setLoggedIn = createAction(
  `[${context}] Set loggedIn`,
  props<{
    loggedIn: boolean;
  }>()
);

export const setSessionFile = createAction(
  `[${context}] Set SessionFile`,
  props<{
    sessionFile: {
      type: string;
      name: string;
      size: number;
    };
  }>()
);

export const setComment = createAction(
  `[${context}] Set user comment`,
  props<{
    comment: string;
  }>()
);

export const setPromptText = createAction(
  `[${context}] Set promptText`,
  props<{
    promptText: string;
  }>()
);

export const setServerComment = createAction(
  `[${context}] Set serverComment`,
  props<{
    serverComment: string;
  }>()
);


