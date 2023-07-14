import { AnnotationActions } from '../../annotation/annotation.actions';
import {
  Action,
  createAction,
  createActionGroup,
  emptyProps,
  props
} from "@ngrx/store";
import { CurrentProject, LoginMode } from '../../index';
import { ProjectDto, TaskDto } from "@octra/api-types";
import {
  OnlineSession,
  SessionData,
  TranscriptionState,
} from '../../annotation';
import { URLParameters } from '../../application';
import { HttpErrorResponse } from "@angular/common/http";

export class OnlineModeActions extends AnnotationActions {
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

  static clearOnlineSession = createActionGroup({
    source: `annotation/ clear online session`,
    events: {
      do: props<{
        mode: LoginMode;
        actionAfterSuccess: Action;
      }>(),
      success: props<{
        mode: LoginMode;
        actionAfterSuccess: Action;
      }>()
    },
  });

  static loadOnlineInformationAfterIDBLoaded = createActionGroup({
    source: `annotation/ load task information`,
    events: {
      do: props<{
        projectID: string;
        taskID: string;
      }>(),
      success: props<{
        mode: LoginMode;
        currentProject: ProjectDto;
        task: TaskDto
      }>(),
      fail: props<{
        error: HttpErrorResponse
      }>(),
    },
  });
}
