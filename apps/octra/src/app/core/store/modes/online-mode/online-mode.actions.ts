import { AnnotationActions } from '../../annotation/annotation.actions';
import { createAction, props } from '@ngrx/store';
import {
  CurrentProject,
  LoginData,
  LoginMode,
  OnlineSession,
  SessionData,
  TranscriptionState,
  URLParameters,
} from '../../index';
import { TaskDto } from '@octra/api-types';

export class OnlineModeActions extends AnnotationActions {
  public static readLoginData = createAction(
    `online mode Login`,
    props<{
      loginData: LoginData;
      removeData: boolean;
      mode: LoginMode.ONLINE;
    }>()
  );

  public static loginDemo = createAction(
    `online mode Login Demo`,
    props<{
      onlineSession: OnlineSession;
      mode: LoginMode.DEMO;
    }>()
  );

  public static loginURLParameters = createAction(
    `online mode Login URLParameters`,
    props<{
      urlParams: URLParameters;
    }>()
  );

  public static setComment = createAction(
    `online mode Set user comment`,
    props<{
      comment: string;
      mode: string;
    }>()
  );

  public static setPromptText = createAction(
    `online mode Set promptText`,
    props<{
      promptText: string;
      mode: string;
    }>()
  );

  public static setServerComment = createAction(
    `online mode Set serverComment`,
    props<{
      serverComment: string;
      mode: LoginMode;
    }>()
  );

  public static setJobsLeft = createAction(
    `online mode Set jobsLeft`,
    props<{
      jobsLeft: number;
      mode: LoginMode;
    }>()
  );

  public static setServerDataEntry = createAction(
    `online mode Set serverDataEntry`,
    props<{
      serverDataEntry: TaskDto;
      mode: LoginMode;
    }>()
  );

  public static setSubmitted = createAction(
    `annotation set submitted`,
    props<{
      submitted: boolean;
      mode: LoginMode;
    }>()
  );

  public static setFeedback = createAction(
    `annotation Set feedback`,
    props<{
      feedback: any;
      mode: LoginMode;
    }>()
  );

  public static startOnlineAnnotation = createAction(
    `annotation Start Annotation`,
    props<{
      mode: LoginMode;
      currentProject: CurrentProject;
      sessionData: SessionData;
      transcript?: TranscriptionState;
    }>()
  );
}
