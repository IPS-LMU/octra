import { Action, ActionReducer, on } from '@ngrx/store';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import { AnnotationStateReducers } from '../../annotation/annotation.reducer';
import { undoRedo } from 'ngrx-wieder';
import { AnnotationActions } from '../../annotation/annotation.actions';
import { OnlineModeActions } from './online-mode.actions';
import { IDBActions } from '../../idb/idb.actions';
import {
  DefaultModeOptions,
  IIDBModeOptions,
} from '../../../shared/octra-database';
import { getProperties, hasProperty } from '@octra/utilities';
import { AuthenticationActions } from '../../authentication';
import { OnlineModeState } from '../../annotation';
import { LoginMode } from '../../index';
import { ProjectSettings } from "../../../obj";

export const initialState: OnlineModeState = {
  ...fromAnnotation.initialState,
  onlineSession: {},
};

// initialize ngrx-wieder with custom config
const { createUndoRedoReducer } = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.do.type,
    AnnotationActions.addAnnotationLevel.do.type,
    AnnotationActions.removeAnnotationLevel.do.type,
  ],
});

export class OnlineModeReducers {
  constructor(private mode: LoginMode) {}

  public create(): ActionReducer<OnlineModeState, Action> {
    return createUndoRedoReducer(
      initialState,
      ...(new AnnotationStateReducers(this.mode).create() as any),
      on(
        AuthenticationActions.login.success,
        (state: OnlineModeState, { auth, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                me: auth.me,
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.loginDemo,
        (state: OnlineModeState, { onlineSession, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession,
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.clearWholeSession.success,
        (state: OnlineModeState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...initialState,
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.clearOnlineSession.do,
        (state: OnlineModeState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...initialState,
              onlineSession: {
                currentProject: state.onlineSession.currentProject
              }
            };
          }
          return state;
        }
      ),
      on(
        AuthenticationActions.logout.success,
        (state: OnlineModeState, { clearSession, mode }) => {
          if (mode === this.mode) {
            return clearSession
              ? {
                  ...initialState,
                  onlineSession: {
                    ...initialState.onlineSession,
                  },
                }
              : {
                  ...state,
                  savingNeeded: false,
                  isSaving: false,
                  audio: {
                    fileName: '',
                    sampleRate: 0,
                    loaded: false,
                  },
                  histories: {},
                };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.setAudioURL.do, // TODO replace this function
        (state: OnlineModeState, { audioURL, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.setFeedback,
        (state: OnlineModeState, { feedback, mode }) => {
          if (mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                assessment: feedback
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.changeComment.do,
        (state: OnlineModeState, { comment, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                comment
              }
            };
          }
          return state;
        }
      ),
      on(
        IDBActions.loadOptions.success,
        (state: OnlineModeState, { onlineOptions, demoOptions }) => {
          let result = state;

          let options: IIDBModeOptions;
          if (this.mode === LoginMode.ONLINE) {
            options = onlineOptions;
          } else if (this.mode === LoginMode.DEMO) {
            options = demoOptions;
          } else {
            options = DefaultModeOptions;
          }

          for (const [name, value] of getProperties(options)) {
            result = this.writeOptionToStore(result, name, value);
          }

          return result;
        }
      ),
      on(
        OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success,
        (state: OnlineModeState, { currentProject, task, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                currentProject,
                task,
                comment: state.onlineSession.comment ?? task.comment ?? ''
              },
              logging: (task.tool_configuration!.value as ProjectSettings).logging.forced ?? false
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.startAnnotation.success,
        (
          state: OnlineModeState,
          {
            task,
            project,
            mode,
            projectSettings,
            guidelines,
            selectedGuidelines,
          }
        ) => {
          if (mode === LoginMode.ONLINE) {
            return {
              ...state,
              projectConfig: projectSettings,
              onlineSession: {
                ...state.onlineSession,
                currentProject: {
                  ...project,
                  statistics: {
                    ...project.statistics,
                    freeTasks: project.statistics?.freeTasks! - 1,
                  },
                },
                task,
              },
              guidelines: {
                selected: selectedGuidelines,
                list: guidelines,
              },
              changedTask: task,
            };
          }
          return state;
        }
      )
    );
  }

  writeOptionToStore(
    state: OnlineModeState,
    attribute: string,
    value: any
  ): OnlineModeState {
    const onlineSessionData: {
      comment?: string;
    } = {};

    switch (attribute) {
      case 'comment':
        onlineSessionData.comment = value;
      break;
    }

    return {
      ...state,
      onlineSession: {
        ...state.onlineSession,
        ...onlineSessionData
      }
    };
  }
}
