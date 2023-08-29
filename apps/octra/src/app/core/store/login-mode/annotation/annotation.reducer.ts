import { ActionCreator, on, ReducerTypes } from '@ngrx/store';
import { LoginMode } from '../../index';
import { AnnotationActions } from './annotation.actions';
import { IDBActions } from '../../idb/idb.actions';
import { IIDBModeOptions } from '../../../shared/octra-database';
import { getProperties } from '@octra/utilities';
import { SampleUnit } from '@octra/media';
import {
  AnnotationLevelType,
  ASRContext,
  OctraAnnotation,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegmentLevel,
  OLabel,
  Segment,
} from '@octra/annotation';
import { AnnotationState } from './index';

export const initialState: AnnotationState = {
  transcript: new OctraAnnotation<ASRContext, Segment<ASRContext>>(),
  savingNeeded: false,
  isSaving: false,
  audio: {
    loaded: false,
    sampleRate: 0,
    fileName: '',
  },
  logs: [],
  logging: false,
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
        AnnotationActions.loadSegments.success,
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
        }
      ),
      on(
        AnnotationActions.addMultipleASRSegments.success,
        (state, { mode, newSegments, segmentID }) => {
          if (this.mode === mode) {
            // 1. unblock current segment
            let transcript = state.transcript;

            const segments = newSegments.filter(
              (a, i) => i < newSegments.length - 1
            );

            for (const segment of segments) {
              transcript = transcript.addItemToCurrentLevel(
                segment.time,
                segment.labels,
                {
                  asr: {
                    progressInfo: undefined,
                    isBlockedBy: undefined,
                  },
                }
              );
            }

            state = {
              ...state,
              transcript,
            };
          }
          return state;
        }
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
        AnnotationActions.loadAudio.success,
        (state: AnnotationState, { mode, audioFile }) => {
          if (this.mode === mode) {
            return {
              ...state,
              audio: {
                ...state.audio,
                loaded: true,
                sampleRate: audioFile!.metadata?.sampleRate,
                fileName: audioFile!.filename,
                file: audioFile,
              },
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
                transcript: state.transcript.changeLevelByIndex(index, level),
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
        (state: AnnotationState, { levelType, mode, audioDuration }) => {
          if (this.mode === mode) {
            let level:
              | OctraAnnotationAnyLevel<Segment<ASRContext>>
              | undefined = undefined;
            if (levelType === AnnotationLevelType.SEGMENT) {
              level = state.transcript.createSegmentLevel(
                `OCTRA_${state.transcript.idCounters.level + 1}`,
                [
                  state.transcript.createSegment(audioDuration.clone(), [
                    new OLabel(
                      `OCTRA_${state.transcript.idCounters.level + 1}`,
                      ''
                    ),
                    new OLabel(`Speaker`, ''),
                  ]),
                ]
              );
            } else {
              console.error(`Can't add other level types. not supported.`);
            }

            if (level) {
              return {
                ...state,
                transcript: state.transcript.addLevel(level),
              };
            }
          }
          return state;
        }
      ),
      on(
        AnnotationActions.removeAnnotationLevel.do,
        (state: AnnotationState, { id, mode }) => {
          if (this.mode === mode) {
            if (id > -1) {
              return {
                ...state,
                transcript: state.transcript.removeLevel(id),
              };
            } else {
              console.error(`can't remove level because id not valid.`);
            }
          }

          return state;
        }
      ),
      on(
        IDBActions.loadAnnotation.success,
        (state: AnnotationState, annotations) => {
          return {
            ...state,
            transcript: {
              ...(annotations as any)[this.mode],
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
        AnnotationActions.changeCurrentItemById.do,
        (state: AnnotationState, { id, item, mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              transcript: state.transcript.changeCurrentItemById(id, item),
            };
          }

          return state;
        }
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
        AnnotationActions.setLevelIndex.do,
        (state: AnnotationState, { currentLevelIndex, mode }) => {
          if (mode === this.mode) {
            return {
              ...state,
              transcript: state.transcript.changeLevelIndex(currentLevelIndex),
            };
          }
          return state;
        }
      ),
      on(AnnotationActions.clearLogs.do, (state) => ({
        ...state,
        logs: [],
      })),
      on(IDBActions.loadLogs.success, (state: AnnotationState, logs) => {
        return {
          ...state,
          logs: (logs as any)[this.mode],
        };
      }),
      on(
        AnnotationActions.updateASRSegmentInformation.do,
        (
          state: AnnotationState,
          { mode, timeInterval, progress, isBlockedBy, itemType, result }
        ) => {
          const currentLevel = state.transcript.currentLevel;
          if (
            this.mode === mode &&
            currentLevel instanceof OctraAnnotationSegmentLevel
          ) {
            const segmentBoundary = new SampleUnit(
              timeInterval.sampleStart + timeInterval.sampleLength / 2,
              state.audio.sampleRate
            );
            const segmentIndex =
              state.transcript.getCurrentSegmentIndexBySamplePosition(
                segmentBoundary
              );

            if (segmentIndex > -1) {
              const segment = (
                currentLevel as OctraAnnotationSegmentLevel<Segment>
              ).level.items[segmentIndex];

              return {
                ...state,
                transcript: state.transcript.changeCurrentItemByIndex(
                  segmentIndex,
                  Segment.deserialize<ASRContext>({
                    ...segment,
                    id: segment.id,
                    labels: result
                      ? segment.labels.map((a: OLabel) =>
                          a.name !== 'Speaker' ? new OLabel(a.name, result) : a
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
                  })
                ),
              };
            } else {
              console.error(`item not found`);
            }
            return state;
          }
          return state;
        }
      ),
      on(
        IDBActions.loadOptions.success,
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

          for (const [name, value] of getProperties(options!)) {
            result = this.writeOptionToStore(result, name, value);
          }

          return result;
        }
      ),
      on(
        AnnotationActions.duplicateLevel.do,
        (state: AnnotationState, { mode, index }) => {
          if (mode === this.mode) {
            return {
              ...state,
              transcript: state.transcript.duplicateLevel(index),
            };
          }
          return state;
        }
      ),
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
