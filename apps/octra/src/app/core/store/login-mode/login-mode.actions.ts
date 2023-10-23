import { AnnotationActions } from './annotation/annotation.actions';
import { Action, createAction, createActionGroup, props } from '@ngrx/store';
import { LoginMode } from '../index';
import { CurrentAccountDto, ProjectDto, TaskDto } from '@octra/api-types';
import { HttpErrorResponse } from '@angular/common/http';

export class LoginModeActions extends AnnotationActions {
  public static setFeedback = createAction(
    `annotation Set feedback`,
    props<{
      feedback: any;
      mode: LoginMode;
    }>()
  );

  static changeComment = createActionGroup({
    source: `annotation/change comment`,
    events: {
      do: props<{
        mode: LoginMode;
        comment: string;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

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
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static loadProjectAndTaskInformation = createActionGroup({
    source: `annotation/ load project and task information`,
    events: {
      do: props<{
        projectID: string;
        taskID: string;
        mode: LoginMode;
      }>(),
      success: props<{
        mode?: LoginMode;
        me?: CurrentAccountDto;
        currentProject?: ProjectDto;
        task?: TaskDto;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });

  static loadCurrentAccountInformation = createActionGroup({
    source: 'authentication/load current account information',
    events: {
      do: props<{
        mode: LoginMode;
        actionAfterSuccess: Action;
      }>(),
      success: props<{
        mode: LoginMode;
        me: CurrentAccountDto;
        actionAfterSuccess: Action;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static endTranscription = createActionGroup({
    source: 'annotation/ redirect to transcription end',
    events: {
      do: props<{ clearSession: boolean; mode: LoginMode }>(),
    },
  });
}
