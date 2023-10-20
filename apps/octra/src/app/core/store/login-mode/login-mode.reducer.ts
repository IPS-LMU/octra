import { Action, ActionReducer, on } from '@ngrx/store';
import * as fromAnnotation from './annotation/annotation.reducer';
import { AnnotationStateReducers } from './annotation/annotation.reducer';
import { undoRedo } from 'ngrx-wieder';
import { AnnotationActions } from './annotation/annotation.actions';
import { LoginModeActions } from './login-mode.actions';
import { IDBActions } from '../idb/idb.actions';
import {
  DefaultModeOptions,
  IIDBModeOptions,
} from '../../shared/octra-database';
import { getProperties } from '@octra/utilities';
import { AuthenticationActions } from '../authentication';
import { LoginMode } from '../index';
import { ProjectSettings } from '../../obj';
import { ApplicationActions } from '../application/application.actions';
import { AnnotationState } from './annotation';
import {
  ASRContext,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { SessionFile } from '../../obj/SessionFile';

export const initialState: AnnotationState = {
  ...fromAnnotation.initialState,
  currentSession: {},
};

// initialize ngrx-wieder with custom config
const { createUndoRedoReducer } = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.do.type,
    AnnotationActions.addAnnotationLevel.do.type,
    AnnotationActions.addCurrentLevelItems.do.type,
    AnnotationActions.removeAnnotationLevel.do.type,
    AnnotationActions.changeCurrentLevelItems.do.type,
    AnnotationActions.removeCurrentLevelItems.do.type,
    AnnotationActions.changeCurrentItemById.do.type,
  ],
});

export class LoginModeReducers {
  constructor(private mode: LoginMode) {}

  public create(): ActionReducer<AnnotationState, Action> {
    return createUndoRedoReducer(
      initialState,
      ...(new AnnotationStateReducers(this.mode).create() as any),
      on(
        LoginModeActions.clearWholeSession.success,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...initialState,
            };
          }
          return state;
        }
      ),
      on(
        LoginModeActions.clearOnlineSession.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...initialState,
              currentEditor: state.currentEditor,
              currentSession: {
                currentProject: state.currentSession.currentProject,
              },
            };
          }
          return state;
        }
      ),
      on(
        AuthenticationActions.logout.success,
        LoginModeActions.endTranscription.do,
        (state: AnnotationState, { clearSession, mode }) => {
          return mode === this.mode && clearSession
            ? {
                ...initialState,
                currentSession: {
                  ...initialState.currentSession,
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
      ),
      on(
        LoginModeActions.setFeedback,
        (state: AnnotationState, { feedback, mode }) => {
          if (mode === mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                assessment: feedback,
              },
            };
          }
          return state;
        }
      ),
      on(
        LoginModeActions.changeComment.do,
        (state: AnnotationState, { comment, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                comment,
              },
            };
          }
          return state;
        }
      ),
      on(
        IDBActions.loadOptions.success,
        (
          state: AnnotationState,
          { onlineOptions, demoOptions, localOptions }
        ) => {
          let result = state;

          let options: IIDBModeOptions;
          if (this.mode === LoginMode.ONLINE) {
            options = onlineOptions;
          } else if (this.mode === LoginMode.DEMO) {
            options = demoOptions;
          } else if (this.mode === LoginMode.LOCAL) {
            options = localOptions;
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
        LoginModeActions.loadProjectAndTaskInformation.success,
        (state: AnnotationState, { currentProject, task, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                currentProject,
                task,
                comment: state.currentSession.comment ?? task?.comment ?? '',
              },
              logging: {
                ...state.logging,
                enabled:
                  (task?.tool_configuration?.value as ProjectSettings)?.logging
                    ?.forced === true
                    ? true
                    : state.logging.enabled,
              },
            };
          }
          return state;
        }
      ),
      on(
        LoginModeActions.loadProjectAndTaskInformation.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                loadFromServer: true,
              },
            };
          }
          return state;
        }
      ),
      on(
        LoginModeActions.startOnlineAnnotation.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript: new OctraAnnotation<
                ASRContext,
                OctraAnnotationSegment<ASRContext>
              >(),
              currentSession: {},
            };
          }
          return state;
        }
      ),
      on(
        AuthenticationActions.loginLocal.prepare,
        (
          state: AnnotationState,
          { mode, sessionFile, removeData, files, annotation }
        ) => {
          if (this.mode === mode) {
            if (removeData || annotation) {
              if (!annotation) {
                return {
                  ...state,
                  transcript: new OctraAnnotation<
                    ASRContext,
                    OctraAnnotationSegment<ASRContext>
                  >(),
                  currentSession: {},
                  sessionFile,
                };
              } else {
                const deserialized = OctraAnnotation.deserialize(annotation);
                return {
                  ...state,
                  transcript: deserialized,
                  currentSession: {},
                  sessionFile,
                };
              }
            } else {
              return {
                ...state,
                currentSession: {},
                sessionFile,
              };
            }
          }
          return state;
        }
      ),
      on(
        LoginModeActions.startOnlineAnnotation.success,
        (
          state: AnnotationState,
          {
            task,
            project,
            mode,
            projectSettings,
            guidelines,
            selectedGuidelines,
          }
        ) => {
          if (this.mode === mode) {
            return {
              ...state,
              projectConfig: projectSettings,
              logging: {
                ...state.logging,
                enabled:
                  projectSettings.logging.forced === true
                    ? true
                    : state.logging.enabled,
                startTime: Date.now(),
                startReference:
                  state.logging.logs.length > 0
                    ? state.logging.logs[state.logging.logs.length - 1]
                    : undefined,
              },
              currentSession: {
                ...state.currentSession,
                loadFromServer: true,
                currentProject: {
                  ...project,
                  statistics: project.statistics
                    ? {
                        ...project.statistics,
                        tasks:
                          project.statistics?.tasks.map((a) => {
                            if (a.type === 'annotation') {
                              return {
                                ...a,
                                status: {
                                  ...a.status,
                                  free: a.status.free - 1,
                                },
                              };
                            }
                            return a;
                          }) ?? [],
                      }
                    : undefined,
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
      ),
      on(
        ApplicationActions.setAppLanguage,
        (state: AnnotationState, { language }) => {
          if (state.guidelines?.list && state.guidelines?.list.length > 0) {
            let guideline = state.guidelines.list.find(
              (a) => a.filename === `guidelines_${language}.json`
            );
            // fallback to english
            guideline =
              guideline ??
              state.guidelines.list.find(
                (a) => a.filename === `guidelines_en.json`
              );
            // fallback to first language
            guideline = guideline ?? state.guidelines.list[0];

            return {
              ...state,
              guidelines: {
                ...state.guidelines,
                selected: guideline,
              },
            };
          }
          return state;
        }
      )
    );
  }

  writeOptionToStore(
    state: AnnotationState,
    attribute: string,
    value: any
  ): AnnotationState {
    switch (attribute) {
      case 'comment':
        state.currentSession = {
          ...state.currentSession,
          comment: value,
        };
        break;
      case 'project':
        state = {
          ...state,
          previousSession: {
            ...state.previousSession,
            project: {
              id: value.id as string,
            },
          } as any,
        };
        break;
      case 'transcriptID':
        state = {
          ...state,
          previousSession: {
            ...state.previousSession,
            task: {
              id: value,
            },
          } as any,
        };
        break;
      case 'sessionfile':
        state = {
          ...state,
          sessionFile: SessionFile.fromAny(value),
        };
        break;
    }

    return state;
  }
}
