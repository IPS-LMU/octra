import {createAction, props} from '@ngrx/store';
import {LoginMode, OnlineSession, URLParameters} from '../index';
import {IDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';

const context = 'Login';

export class LoginActions {
  public static loginOnline = createAction(
    `[${context}] Login Online`,
    props<{
      onlineSession: OnlineSession
    }>()
  );

  public static loginDemo = createAction(`[${context}] Login Demo`,
    props<{
      onlineSession: OnlineSession
    }>());

  public static loginLocal = createAction(
    `[${context}] Login Local`,
    props<{
      files: File[],
      sessionFile: SessionFile
    }>()
  );

  public static loginURLParameters = createAction(
    `[${context}] Login URLParameters`,
    props<{
      urlParams: URLParameters
    }>()
  );

  public static logout = createAction(
    `[${context}] Logout`,
    props<{
      removeAnnotation: boolean;
    }>()
  );

  public static setMode = createAction(`[${context}] Set Mode`,
    props<{
      mode: LoginMode;
    }>()
  );

  public static setAudioURL = createAction(`[${context}] Set Audio URL`,
    props<{
      audioURL: string;
    }>()
  );

  public static setUserData = createAction(`[${context}] Set user data`,
    props<{
      id: string;
      project: string;
      jobNumber: number;
    }>()
  );

  public static clearLocalSession = createAction(`[${context}] Clear local session`);
  public static clearOnlineSession = createAction(`[${context}] Clear online session`);

  public static setServerDataEntry = createAction(
    `[${context}] Set serverDataEntry`,
    props<{
      serverDataEntry: IDataEntry;
    }>()
  );

  public static setLoggedIn = createAction(
    `[${context}] Set loggedIn`,
    props<{
      loggedIn: boolean;
    }>()
  );

  public static setSessionFile = createAction(
    `[${context}] Set SessionFile`,
    props<{
      sessionFile: SessionFile
    }>()
  );

  public static setComment = createAction(
    `[${context}] Set user comment`,
    props<{
      comment: string;
    }>()
  );

  public static setPromptText = createAction(
    `[${context}] Set promptText`,
    props<{
      promptText: string;
    }>()
  );

  public static setServerComment = createAction(
    `[${context}] Set serverComment`,
    props<{
      serverComment: string;
    }>()
  );

  public static setJobsLeft = createAction(
    `[${context}] Set jobsLeft`,
    props<{
      jobsLeft: number;
    }>()
  );
}

