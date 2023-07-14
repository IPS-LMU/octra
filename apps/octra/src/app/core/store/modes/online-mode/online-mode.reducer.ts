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
                  submitted: false,
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
        OnlineModeActions.setAudioURL.do,
        (state: OnlineModeState, { audioURL, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                sessionData: {
                  audioURL,
                },
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
                sessionData: {
                  ...state.onlineSession,
                  feedback,
                },
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.setComment,
        (state: OnlineModeState, { comment, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              changedTask: {
                ...(state.changedTask as any),
                comment,
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.setPromptText,
        (state: OnlineModeState, { promptText, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              changedTask: {
                ...(state.changedTask as any),
                orgtext: promptText,
              },
            };
          }
          return state;
        }
      ),
      on(
        OnlineModeActions.setServerComment,
        (state: OnlineModeState, { serverComment, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              changedTask: {
                ...(state.changedTask as any),
                comment: serverComment,
              },
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
            result = this.writeOptionToStore(result as any, name, value);
          }

          return result;
        }
      ),
      on(
        OnlineModeActions.setSubmitted,
        (state: OnlineModeState, { submitted, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              onlineSession: {
                ...state.onlineSession,
                sessionData: {
                  submitted,
                },
              },
            };
          }
          return state;
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
              },
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.startAnnotation.success,
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
    const onlineSessionData = {
      userName: '',
      email: '',
      webToken: '',
    };

    switch (attribute) {
      case 'user':
        if (value !== undefined) {
          if (hasProperty(value, 'name')) {
            onlineSessionData.userName = value.name;
          }
          if (hasProperty(value, 'email')) {
            onlineSessionData.email = value.email;
          }

          if (hasProperty(value, 'webToken')) {
            onlineSessionData.webToken = value.webToken;
          }
        }

        return state;
    }

    return state;
  }
}
