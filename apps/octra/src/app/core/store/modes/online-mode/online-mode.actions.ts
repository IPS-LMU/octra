import {AnnotationActions} from '../../annotation/annotation.actions';
import {createAction, props} from '@ngrx/store';
import {OnlineSession, URLParameters} from '../../index';
import {IDataEntry} from '../../../obj/data-entry';

export class OnlineModeActions extends AnnotationActions {
  static context: 'OnlineMode';

  public static login = createAction(
    `[${OnlineModeActions.context}] Login`,
    props<{
      onlineSession: OnlineSession,
      removeData: boolean
    }>()
  );

  public static loginDemo = createAction(
    `[${OnlineModeActions.context}] Login Demo`,
    props<{
      onlineSession: OnlineSession
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
      id: string;
      project: string;
      jobNumber: number;
    }>()
  );


  public static setComment = createAction(
    `[${OnlineModeActions.context}] Set user comment`,
    props<{
      comment: string;
    }>()
  );

  public static setPromptText = createAction(
    `[${OnlineModeActions.context}] Set promptText`,
    props<{
      promptText: string;
    }>()
  );

  public static setServerComment = createAction(
    `[${OnlineModeActions.context}] Set serverComment`,
    props<{
      serverComment: string;
    }>()
  );

  public static setJobsLeft = createAction(
    `[${OnlineModeActions.context}] Set jobsLeft`,
    props<{
      jobsLeft: number;
    }>()
  );

  public static setServerDataEntry = createAction(
    `[${OnlineModeActions.context}] Set serverDataEntry`,
    props<{
      serverDataEntry: IDataEntry;
    }>()
  );
}


