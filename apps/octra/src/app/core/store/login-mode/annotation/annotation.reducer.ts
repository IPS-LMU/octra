import { ActionCreator, on, ReducerTypes } from '@ngrx/store';
import {
  AnnotationLevelType,
  ASRContext,
  OctraAnnotation,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
  OLabel,
} from '@octra/annotation';
import { SampleUnit } from '@octra/media';
import { getProperties } from '@octra/utilities';
import { IIDBModeOptions } from '../../../shared/octra-database';
import { AuthenticationActions } from '../../authentication';
import { IDBActions } from '../../idb/idb.actions';
import { LoginMode } from '../../index';
import { LoginModeActions } from '../login-mode.actions';
import { AnnotationActions } from './annotation.actions';
import { AnnotationState } from './index';

export const initialState: AnnotationState = {
  transcript: new OctraAnnotation<
    ASRContext,
    OctraAnnotationSegment<ASRContext>
  >(),
  savingNeeded: false,
  isSaving: false,
  audio: {
    loaded: false,
    sampleRate: 0,
    fileName: '',
  },
  logging: {
    enabled: false,
    logs: [],
  },
  currentSession: {},
  histories: {},
};

export class AnnotationStateReducers {
  constructor(private mode: LoginMode) {}

  create<T>(): ReducerTypes<AnnotationState, ActionCreator[]>[] {
    return [
      on(
        AnnotationActions.clearAnnotation.do,
        (state: AnnotationState, { mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              transcript: initialState.transcript,
            };
          }
          return state;
        },
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
        },
      ),
      on(
        AnnotationActions.initTranscriptionService.success,
        (state: AnnotationState, { transcript, mode, feedback }) => {
          if (this.mode === mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                feedback,
              },
              transcript,
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.addMultipleASRSegments.success,
        (state, { mode, newSegments, segmentID }) => {
          if (this.mode === mode) {
            // 1. unblock current segment
            let transcript = state.transcript.clone();
            const currentSegment = transcript
              .currentLevel!.items.find((a) => a.id === segmentID)!
              .clone() as OctraAnnotationSegment;
            currentSegment.context = {
              ...currentSegment.context,
              asr: {
                progressInfo: undefined,
                isBlockedBy: undefined,
              },
            };
            transcript = transcript.changeCurrentItemById(
              segmentID,
              currentSegment,
            );

            // 2. ignore last segment from results
            const segments = newSegments.filter(
              (a, i) => i < newSegments.length - 1,
            );

            // 3. add new segments
            for (const segment of segments) {
              transcript = transcript.addItemToCurrentLevel(
                segment.time,
                segment.labels,
                {
                  asr: {
                    progressInfo: undefined,
                    isBlockedBy: undefined,
                  },
                },
              );
            }

            state.transcript = transcript;
          }
          return state;
        },
      ),
      on(AnnotationActions.loadAudio.do, (state: AnnotationState, { mode }) => {
        if (this.mode === mode) {
          return {
            ...state,
            audio: {
              ...state.audio,
              loaded: false,
            },
          };
        }
        return state;
      }),
      on(
        AnnotationActions.resumeTaskManually.success,
        (state: AnnotationState, { mode, task, project }) => {
          if (this.mode === mode && project && task) {
            return {
              ...state,
              transcript: initialState.transcript,
              currentSession: {
                ...state.currentSession,
                currentProject: {
                  ...project,
                },
                comment: task.comment,
                task: {
                  ...task,
                },
              },
              logging: {
                ...state.logging,
                logs: task.log,
              },
              previousSession: {
                project: {
                  id: project.id,
                },
                task: {
                  id: task.id,
                },
              },
            };
          }
          return state;
        },
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
                sampleRate: audioFile!.metadata?.sampleRate!,
                fileName: audioFile!.filename,
                file: audioFile,
              },
            };
          }
          return state;
        },
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
                transcript: state.transcript.changeLevelByIndex(index, level),
              };
            } else {
              console.error(`can't change level because index not valid.`);
            }
          }

          return state;
        },
      ),
      on(
        AuthenticationActions.loginURL.success,
        (state: AnnotationState, { mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              currentEditor: '2D-Editor',
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.combinePhrases.success,
        (state: AnnotationState, { transcript, mode }) => {
          if (this.mode === mode) {
            state.transcript = transcript;
          }

          return state;
        },
      ),
      on(
        AnnotationActions.changeLevelName.do,
        (state: AnnotationState, { index, mode, name }) => {
          if (mode === this.mode) {
            const transcript = state.transcript.clone();
            transcript.changeLevelNameByIndex(index, name);

            // change speaker labels
            const level = transcript.levels[index];

            if (level.type === 'SEGMENT') {
              const segementLevel =
                level as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;

              for (const item of segementLevel.items) {
                const spkIndex = item.labels.findIndex(
                  (a) => a.name === 'Speaker',
                );

                if (spkIndex > -1) {
                  item.labels = [
                    ...item.labels.slice(0, spkIndex),
                    new OLabel('Speaker', name),
                    ...item.labels.slice(spkIndex + 1),
                  ];
                }
              }
            }

            state.transcript = transcript;
          }

          return state;
        },
      ),
      on(
        AnnotationActions.addAnnotationLevel.do,
        (state: AnnotationState, { levelType, mode, audioDuration }) => {
          if (this.mode === mode) {
            const transcript = state.transcript.clone();
            let level:
              | OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>
              | undefined = undefined;

            if (levelType === AnnotationLevelType.SEGMENT) {
              level = transcript.createSegmentLevel(
                `OCTRA_${transcript.idCounters.level + 1}`,
                [
                  transcript.createSegment(audioDuration.clone(), [
                    new OLabel(`OCTRA_${transcript.idCounters.level + 1}`, ''),
                    new OLabel(`Speaker`, ''),
                  ]),
                ],
              );
            } else {
              console.error(`Can't add other level types. not supported.`);
            }

            if (level) {
              return {
                ...state,
                transcript: transcript.addLevel(level),
              };
            }
          }
          return state;
        },
      ),
      on(
        AnnotationActions.removeAnnotationLevel.do,
        (state: AnnotationState, { id, mode }) => {
          if (this.mode === mode) {
            if (id > -1) {
              return {
                ...state,
                transcript: state.transcript.clone().removeLevel(id),
              };
            } else {
              console.error(`can't remove level because id not valid.`);
            }
          }

          return state;
        },
      ),
      on(
        IDBActions.loadAnnotation.success,
        (state: AnnotationState, annotations) => {
          return {
            ...state,
            transcript: (annotations as any)[this.mode],
          };
        },
      ),
      on(
        AnnotationActions.setSavingNeeded.do,
        (state: AnnotationState, { savingNeeded }) => ({
          ...state,
          savingNeeded,
        }),
      ),
      on(
        AnnotationActions.changeCurrentLevelItems.do,
        (state: AnnotationState, { items, mode }) => {
          if (this.mode === mode) {
            const currentLevel = state.transcript.currentLevel;

            if (currentLevel) {
              for (const item of items) {
                const index = state.transcript.currentLevel?.items.findIndex(
                  (a) => a.id === item.id,
                );
                if (index !== undefined && index > -1) {
                  state.transcript = state.transcript
                    .clone()
                    .changeCurrentItemByIndex(index, item);
                } else {
                  // add item
                  state.transcript = state.transcript
                    .clone()
                    .addItemToCurrentLevel(
                      (item as any).time,
                      item.labels,
                      (item as any).context,
                    );
                }
              }
            }
          }

          return state;
        },
      ),
      on(
        AnnotationActions.addCurrentLevelItems.do,
        (state: AnnotationState, { items, mode }) => {
          if (this.mode === mode) {
            const currentLevel = state.transcript.currentLevel;

            if (currentLevel) {
              for (const item of items) {
                state.transcript = state.transcript
                  .clone()
                  .addItemToCurrentLevel(
                    (item as any).time,
                    item.labels,
                    (item as any).context,
                  );
              }
            }
          }

          return state;
        },
      ),
      on(
        AnnotationActions.removeCurrentLevelItems.do,
        (state: AnnotationState, { items, mode, removeOptions }) => {
          if (this.mode === mode) {
            const currentLevel = state.transcript.currentLevel;

            if (currentLevel) {
              for (const item of items) {
                if (item.id !== undefined && item.id !== null) {
                  state.transcript = state.transcript
                    .clone()
                    .removeItemById(
                      item.id,
                      removeOptions?.silenceCode,
                      removeOptions?.mergeTranscripts,
                      (transcript: string) => {
                        return tidyUpAnnotation(
                          transcript,
                          state.guidelines?.selected?.json,
                        );
                      },
                    );
                } else if (item.index !== undefined && item.index !== null) {
                  state.transcript = state.transcript
                    .clone()
                    .removeItemByIndex(
                      item.index,
                      removeOptions?.silenceCode,
                      removeOptions?.mergeTranscripts,
                      (transcript: string) => {
                        return tidyUpAnnotation(
                          transcript,
                          state.guidelines?.selected?.json,
                        );
                      },
                    );
                } else {
                  console.error(
                    `removeCurrentLevelItems: Can't remove item, missing index or ID.`,
                  );
                }
              }
            }
          }

          return state;
        },
      ),
      on(
        AnnotationActions.changeCurrentItemById.do,
        (state: AnnotationState, { id, item, mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              transcript: state.transcript
                .clone()
                .changeCurrentItemById(id, item),
            };
          }

          return state;
        },
      ),
      on(
        AnnotationActions.setIsSaving.do,
        (state: AnnotationState, { isSaving }) => ({
          ...state,
          isSaving,
        }),
      ),
      on(
        AnnotationActions.setCurrentEditor.do,
        (state: AnnotationState, { currentEditor }) => ({
          ...state,
          currentEditor,
        }),
      ),

      on(
        AnnotationActions.addLog.do,
        (state: AnnotationState, { log, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              logging: {
                ...state.logging,
                logs: !Array.isArray(state.logging.logs)
                  ? [log]
                  : [...state.logging.logs, log],
              },
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.saveLogs.do,
        (state: AnnotationState, { logs, mode }) => {
          if (this.mode === mode) {
            return {
              ...state,
              logging: {
                ...state.logging,
                logs,
              },
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.setLogging.do,
        (state: AnnotationState, { logging }) => ({
          ...state,
          logging: {
            ...state.logging,
            enabled: logging,
            startTime: Date.now(),
            startReference:
              state.logging.logs.length > 0
                ? state.logging.logs[state.logging.logs.length - 1]
                : undefined,
          },
        }),
      ),
      on(
        AnnotationActions.setLevelIndex.do,
        (state: AnnotationState, { currentLevelIndex, mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              transcript: state.transcript
                .clone()
                .changeLevelIndex(currentLevelIndex),
            };
          }
          return state;
        },
      ),
      on(
        LoginModeActions.loadProjectAndTaskInformation.success,
        (state: AnnotationState, { currentProject, task, mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              currentSession: {
                ...state.currentSession,
                comment: task?.comment,
                task,
                currentProject,
              },
            };
          }
          return state;
        },
      ),
      on(AnnotationActions.clearLogs.do, (state) => ({
        ...state,
        logging: {
          ...state.logging,
          logs: [],
        },
      })),
      on(AnnotationActions.startNewAnnotation.do, (state, { mode }) => {
        if (mode === this.mode) {
          return {
            ...state,
            currentSession: initialState.currentSession,
            transcript: new OctraAnnotation<
              ASRContext,
              OctraAnnotationSegment<ASRContext>
            >(),
          };
        }
        return state;
      }),
      on(IDBActions.loadLogs.success, (state: AnnotationState, logs) => {
        return {
          ...state,
          logging: {
            ...state.logging,
            logs: (logs as any)[this.mode],
          },
        };
      }),
      on(
        AnnotationActions.updateASRSegmentInformation.do,
        (
          state: AnnotationState,
          { mode, timeInterval, progress, isBlockedBy, itemType, result },
        ) => {
          const currentLevel = state.transcript.currentLevel;
          if (
            this.mode === mode &&
            currentLevel instanceof OctraAnnotationSegmentLevel
          ) {
            const segmentBoundary = new SampleUnit(
              timeInterval.sampleStart + timeInterval.sampleLength / 2,
              state.audio.sampleRate,
            );
            const segmentIndex =
              state.transcript.getCurrentSegmentIndexBySamplePosition(
                segmentBoundary,
              );

            if (segmentIndex > -1) {
              const segment = (
                currentLevel as OctraAnnotationSegmentLevel<OctraAnnotationSegment>
              ).level.items[segmentIndex];

              return {
                ...state,
                transcript: state.transcript.clone().changeCurrentItemByIndex(
                  segmentIndex,
                  OctraAnnotationSegment.deserialize<ASRContext>({
                    ...segment.clone(segment.id),
                    id: segment.id,
                    labels: result
                      ? segment.labels.map((a: OLabel) =>
                          a.name !== 'Speaker' ? new OLabel(a.name, result) : a,
                        )
                      : segment.labels,
                    context: {
                      asr: {
                        progressInfo: {
                          progress,
                          statusLabel: itemType,
                        },
                        isBlockedBy,
                      },
                    },
                  }),
                ),
              };
            } else {
              console.error(`item not found`);
            }
            return state;
          }
          return state;
        },
      ),
      on(
        IDBActions.loadOptions.success,
        (
          state: AnnotationState,
          { demoOptions, localOptions, onlineOptions },
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

          for (const [name, value] of getProperties(options!)) {
            result = this.writeOptionToStore(result, name, value);
          }

          return result;
        },
      ),
      on(
        AnnotationActions.sendOnlineAnnotation.do,
        (state: AnnotationState, { mode }) => {
          if (mode === this.mode) {
            state.currentSession = {
              ...state.currentSession,
              status: 'sending',
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.sendOnlineAnnotation.fail,
        AnnotationActions.sendOnlineAnnotation.success,
        (state: AnnotationState, { mode }) => {
          if (mode === this.mode) {
            state.currentSession = {
              ...state.currentSession,
              status: 'processing',
            };
          }
          return state;
        },
      ),
      on(
        AnnotationActions.duplicateLevel.do,
        (state: AnnotationState, { mode, index }) => {
          if (mode === this.mode) {
            state.transcript = state.transcript.clone().duplicateLevel(index);
          }
          return state;
        },
      ),
    ];
  }

  writeOptionToStore(
    state: AnnotationState,
    attribute: string,
    value: any,
  ): AnnotationState {
    switch (attribute) {
      case 'currentEditor':
        return {
          ...state,
          currentEditor: value ?? '2D-Editor',
        };
      case 'currentLevel':
        return {
          ...state,
          previousCurrentLevel: value,
        };
      case 'logging':
        return {
          ...state,
          logging: {
            ...state.logging,
            enabled: value === true,
          },
        };
    }

    return state;
  }
}
