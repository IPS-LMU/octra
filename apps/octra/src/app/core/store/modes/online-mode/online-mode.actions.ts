import {AnnotationActions} from '../../annotation/annotation.actions';
import {createAction, props} from '@ngrx/store';
import {LoginMode, OnlineSession, URLParameters} from '../../index';
import {IDataEntry} from '../../../obj/data-entry';

export class OnlineModeActions extends AnnotationActions {
  static context: 'OnlineMode';

  public static login = createAction(
    `[${OnlineModeActions.context}] Login`,
    props<{
      onlineSession: OnlineSession,
      removeData: boolean;
      mode: LoginMode.ONLINE;
    }>()
  );

  public static loginDemo = createAction(
    `[${OnlineModeActions.context}] Login Demo`,
    props<{
      onlineSession: OnlineSession;
      mode: LoginMode.DEMO;
    }>()
  );

  public static loginURLParameters = createAction(
    `[${OnlineModeActions.context}] Login URLParameters`,
    props<{
      urlParams: URLParameters
    }>()
  );

  public static setUserData = createAction(`[${OnlineModeActions.context}] Set user data`,
    props<{
      userName: string;
      project: string;
      jobNumber: number;
      mode: LoginMode;
    }>()
  );


  public static setComment = createAction(
    `[${OnlineModeActions.context}] Set user comment`,
    props<{
      comment: string;
      mode: string;
    }>()
  );

  public static setPromptText = createAction(
    `[${OnlineModeActions.context}] Set promptText`,
    props<{
      promptText: string;
      mode: string;
    }>()
  );

  public static setServerComment = createAction(
    `[${OnlineModeActions.context}] Set serverComment`,
    props<{
      serverComment: string;
      mode: LoginMode;
    }>()
  );

  public static setJobsLeft = createAction(
    `[${OnlineModeActions.context}] Set jobsLeft`,
    props<{
      jobsLeft: number;
      mode: LoginMode;
    }>()
  );

  public static setServerDataEntry = createAction(
    `[${OnlineModeActions.context}] Set serverDataEntry`,
    props<{
      serverDataEntry: IDataEntry;
      mode: LoginMode;
    }>()
  );

  public static setSubmitted = createAction(
    `[${AnnotationActions.context}] set submitted`,
    props<{
      submitted: boolean;
      mode: LoginMode;
    }>()
  );

  public static setFeedback = createAction(
    `[${AnnotationActions.context}] Set feedback`,
    props<{
      feedback: any;
      mode: LoginMode;
    }>()
  );
}


