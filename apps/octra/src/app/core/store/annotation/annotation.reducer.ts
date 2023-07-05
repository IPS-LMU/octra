import { ActionCreator, on, ReducerTypes } from '@ngrx/store';
import { LoginMode } from '../index';
import { AnnotationActions } from './annotation.actions';
import { IDBActions } from '../idb/idb.actions';
import { ConfigurationActions } from '../configuration/configuration.actions';
import { IIDBModeOptions } from '../../shared/octra-database';
import { getProperties } from '@octra/utilities';
import { AnnotationState } from './index';

export const initialState: AnnotationState = {
  transcript: {
    levels: [],
    links: [],
    levelCounter: 0,
  },
  savingNeeded: false,
  isSaving: false,
  audio: {
    loaded: false,
    sampleRate: 0,
    fileName: '',
  },
  logs: [],
  logging: false,
  histories: {},
};

export class AnnotationStateReducers {
  constructor(private mode: LoginMode) {}

  create(): ReducerTypes<AnnotationState, ActionCreator[]>[] {
    return [
      on(
        AnnotationActions.setLevelCounter.do,
        (state: AnnotationState, { levelCounter, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript: {
                ...state.transcript,
                levelCounter: levelCounter,
              },
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.clearAnnotation.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript: {
                levels: [],
                links: [],
                levelCounter: 0,
              },
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.overwriteTranscript.do,
        (state: AnnotationState, { transcript, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript,
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.loadAudio.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              audio: {
                ...state.audio,
                loaded: false
              }
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.loadAudio.success,
        (state: AnnotationState, { mode, audioFile }) => {
          if (this.mode === mode) {
            return {
              ...state,
              audio: {
                ...state.audio,
                loaded: true,
                sampleRate: audioFile?.metadata?.sampleRate,
                fileName: audioFile?.filename,
                file: audioFile
              }
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.changeAnnotationLevel.do,
        (state: AnnotationState, { level, mode }) => {
          if (this.mode === mode) {
            const annotationLevels = state.transcript.levels;
            const index = annotationLevels.findIndex((a) => a.id === level.id);

            if (index > -1 && index < annotationLevels.length) {
              return {
                ...state,
                transcript: {
                  ...state.transcript,
                  levels: [
                    ...state.transcript.levels.slice(0, index),
                    {
                      ...level,
                    },
                    ...state.transcript.levels.slice(index + 1),
                  ],
                },
              };
            } else {
              console.error(`can't change level because index not valid.`);
            }
          }

          return state;
        }
      ),
      on(
        AnnotationActions.addAnnotationLevel.do,
        (state: AnnotationState, { level, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript: {
                ...state.transcript,
                levels: [...state.transcript.levels, level],
              },
            };
          }
          return state;
        }
      ),
      on(
        AnnotationActions.removeAnnotationLevel.do,
        (state: AnnotationState, { id, mode }) => {
          if (this.mode === mode) {
            if (id > -1) {
              const index = state.transcript.levels.findIndex(
                (a) => a.id === id
              );
              if (index > -1) {
                return {
                  ...state,
                  transcript: {
                    ...state.transcript,
                    levels: [
                      ...state.transcript.levels.slice(0, index),
                      ...state.transcript.levels.slice(index + 1),
                    ],
                  },
                };
              } else {
                console.error(`can't remove level because index not valid.`);
              }
            } else {
              console.error(`can't remove level because id not valid.`);
            }
          }

          return state;
        }
      ),
      on(
        IDBActions.loadAnnotationSuccess,
        (state: AnnotationState, annotations) => {
          return {
            ...state,
            transcript: {
              ...annotations[this.mode],
            },
          };
        }
      ),
      on(
        AnnotationActions.setSavingNeeded.do,
        (state: AnnotationState, { savingNeeded }) => ({
          ...state,
          savingNeeded,
        })
      ),
      on(
        AnnotationActions.setIsSaving.do,
        (state: AnnotationState, { isSaving }) => ({
          ...state,
          isSaving,
        })
      ),
      on(
        AnnotationActions.setCurrentEditor.do,
        (state: AnnotationState, { currentEditor }) => ({
          ...state,
          currentEditor,
        })
      ),

      on(
        AnnotationActions.addLog.do,
        (state: AnnotationState, { log, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              logs: !Array.isArray(state.logs) ? [log] : [...state.logs, log],
            };
          }
          return state;
        }
      ),
      on(AnnotationActions.saveLogs.do, (state: AnnotationState, { logs }) => ({
        ...state,
        logs,
      })),
      on(
        AnnotationActions.setLogging.do,
        (state: AnnotationState, { logging }) => ({
          ...state,
          logging,
        })
      ),
      on(
        AnnotationActions.setTranscriptionState.do,
        (state: AnnotationState, newState) => ({ ...state, ...newState })
      ),
      on(AnnotationActions.clearLogs.do, (state) => ({
        ...state,
        logs: [],
      })),
      on(IDBActions.loadLogsSuccess, (state: AnnotationState, logs) => {
        return {
          ...state,
          logs: logs[this.mode],
        };
      }),
      on(
        ConfigurationActions.projectConfigurationLoaded,
        (state: AnnotationState, { projectConfig }) => ({
          ...state,
          projectConfig,
        })
      ),
      on(
        ConfigurationActions.loadGuidelinesSuccess,
        (state: AnnotationState, { guidelines }) => ({
          ...state,
          guidelines,
        })
      ),
      on(
        IDBActions.loadOptionsSuccess,
        (
          state: AnnotationState,
          { demoOptions, localOptions, onlineOptions }
        ) => {
          let result = state;

          let options: IIDBModeOptions;
          if (this.mode === LoginMode.DEMO) {
            options = demoOptions;
          } else if (this.mode === LoginMode.ONLINE) {
            options = onlineOptions;
          } else if (this.mode === LoginMode.LOCAL) {
            options = localOptions;
          }

          for (const [name, value] of getProperties(options)) {
            result = this.writeOptionToStore(result, name, value);
          }

          return result;
        }
      ),
      on(
        ConfigurationActions.loadMethodsSuccess,
        (state: AnnotationState, methods) => ({
          ...state,
          methods,
        })
      )
    ];
  }

  writeOptionToStore(
    state: AnnotationState,
    attribute: string,
    value: any
  ): AnnotationState {
    switch (attribute) {
      case 'currentEditor':
        return {
          ...state,
          currentEditor: value !== undefined ? value : '2D-Editor',
        };
      case 'logging':
        return {
          ...state,
          logging: value !== undefined ? value : true,
        };
    }

    return state;
  }
}
