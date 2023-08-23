import { createReducer, on } from '@ngrx/store';
import { ASRActions } from './asr.actions';
import {
  ASRProcessStatus,
  ASRState,
  ASRStateQueue,
  ASRStateQueueStatistics,
} from './index';
import { IDBActions } from '../idb/idb.actions';
import { AuthenticationActions } from '../authentication';

export const initialState: ASRState = {
  queue: {
    idCounter: 0,
    status: ASRProcessStatus.IDLE,
    statistics: {
      running: 0,
      stopped: 0,
      failed: 0,
      finished: 0,
    },
    items: [],
  },
};

function calculateStatistics(queue: ASRStateQueue) {
  const result: ASRStateQueueStatistics = {
    failed: 0,
    running: 0,
    finished: 0,
    stopped: 0,
  };

  for (const item of queue.items) {
    switch (item.status) {
      case ASRProcessStatus.STARTED:
        result.running++;
        break;
      case ASRProcessStatus.STOPPED:
        result.stopped++;
        break;
      case ASRProcessStatus.NOQUOTA:
        result.failed++;
        break;
      case ASRProcessStatus.NOAUTH:
        result.failed++;
        break;
      case ASRProcessStatus.FINISHED:
        result.finished++;
        break;
      case ASRProcessStatus.FAILED:
        result.failed++;
        break;
    }
  }

  return result;
}

export const reducer = createReducer(
  initialState,
  on(ASRActions.enableASR.do, (state: ASRState, { isEnabled }) => ({
    ...state,
    isEnabled,
  })),
  on(
    ASRActions.setASRMausLanguage.do,
    (state: ASRState, { selectedMausLanguage }) => ({
      ...state,
      settings: {
        ...state.settings,
        selectedMausLanguage,
      },
    })
  ),
  on(ASRActions.initQueue.do, (state: ASRState) => ({
    ...state,
    queue: initialState.queue,
  })),
  on(
    IDBActions.loadOptions.success,
    (state: ASRState, { applicationOptions }) => ({
      ...state,
      settings: applicationOptions.asr,
    })
  ),
  on(
    ASRActions.setSelectedASRInformation.do,
    (state: ASRState, { asrInfo }) => ({
      ...state,
      queue: initialState.queue,
      settings: {
        ...state.settings,
        selectedService: asrInfo?.asr,
        selectedLanguage: asrInfo?.code,
      },
    })
  ),
  on(ASRActions.addToQueue.success, (state: ASRState, { item }) => ({
    ...state,
    queue: state.queue
      ? {
          ...state.queue,
          idCounter: state.queue.idCounter + 1,
          items: [...state.queue.items, item],
        }
      : undefined,
  })),
  on(ASRActions.stopItemProcessing.do, (state: ASRState, { time }) => {
    if (state.queue) {
      const index = getItemIndexByTime(
        time.sampleStart,
        time.sampleLength,
        state.queue
      );

      if (index > -1) {
        return {
          ...state,
          queue: state.queue
            ? {
                ...state.queue,
                idCounter: state.queue.idCounter + 1,
                items: [
                  ...state.queue.items.slice(0, index),
                  {
                    ...state.queue.items[index],
                    status: ASRProcessStatus.STOPPED,
                  },
                  ...state.queue.items.slice(index + 1),
                ],
              }
            : undefined,
        };
      }
    }
    return state;
  }),
  on(ASRActions.removeItemFromQueue.success, (state: ASRState, { index }) => ({
    ...state,
    queue: state.queue
      ? {
          ...state.queue,
          items: [
            ...state.queue.items.slice(0, index),
            ...state.queue.items.slice(index + 1),
          ],
        }
      : undefined,
  })),
  on(ASRActions.clearQueue.do, (state: ASRState) => ({
    ...state,
    queue: initialState.queue,
  })),
  on(ASRActions.startProcessing.do, (state: ASRState) => {
    const queue = state.queue
      ? {
          ...state.queue,
          status: ASRProcessStatus.STARTED,
          items: state.queue.items.map((a) => {
            console.log('________');
            console.log(a);
            if (a.status === ASRProcessStatus.NOAUTH) {
              return {
                ...a,
                status: ASRProcessStatus.IDLE,
              };
            }
            return a;
          }),
          statistics: calculateStatistics(state.queue),
        }
      : undefined;

    queue!.statistics = calculateStatistics(queue!);

    return {
      ...state,
      queue,
    };
  }),
  on(AuthenticationActions.needReAuthentication.do, (state) => ({
    ...state,
    queue: {
      ...state.queue!,
      status: ASRProcessStatus.NOAUTH,
    },
  })),
  on(AuthenticationActions.needReAuthentication.abort, (state) => {
    const queue = {
      ...state.queue!,
      status: ASRProcessStatus.STOPPED,
    };
    return {
      ...state,
      queue: {
        ...queue,
        statistics: calculateStatistics(queue),
      },
    };
  }),
  on(ASRActions.processQueueItem.do, (state: ASRState, { item }) => {
    if (state.queue) {
      const index = state.queue.items.findIndex((a) => a.id === item.id);
      if (index > -1) {
        const queue = {
          ...state.queue,
          items: [
            ...state.queue.items.slice(0, index),
            {
              ...state.queue.items[index],
              status: ASRProcessStatus.STARTED,
              progress: 10,
            },
            ...state.queue.items.slice(index + 1),
          ],
        };

        return {
          ...state,
          queue: {
            ...queue,
            statistics: calculateStatistics(queue),
          },
        };
      } else {
        console.error(`can't find queue item with id ${item.id}`);
      }
    }

    return state;
  }),
  on(ASRActions.cutAndUploadQueueItem.success, (state: ASRState, { item }) => {
    if (state.queue) {
      const index = state.queue.items.findIndex((a) => a.id === item.id);
      if (index > -1) {
        return {
          ...state,
          queue: {
            ...state.queue,
            items: [
              ...state.queue.items.slice(0, index),
              {
                ...state.queue.items[index],
                progress: 25,
              },
              ...state.queue.items.slice(index + 1),
            ],
          },
        };
      } else {
        console.error(`can't find queue item with id ${item.id}`);
      }
    }

    return state;
  }),
  on(ASRActions.runASROnItem.success, (state: ASRState, { item }) => {
    if (state.queue) {
      const index = state.queue.items.findIndex((a) => a.id === item.id);
      if (index > -1) {
        const queue = {
          ...state.queue,
          items: [
            ...state.queue.items.slice(0, index),
            {
              ...state.queue.items[index],
              progress: 70,
            },
            ...state.queue.items.slice(index + 1),
          ],
        };

        return {
          ...state,
          queue: {
            ...queue,
            statistics: calculateStatistics(queue),
          },
        };
      } else {
        console.error(`can't find queue item with id ${item.id}`);
      }
    }

    return state;
  }),
  on(
    ASRActions.processQueueItem.success,
    (state: ASRState, { item, result }) => {
      if (state.queue) {
        const index = state.queue.items.findIndex((a) => a.id === item.id);
        if (index > -1) {
          const queue = {
            ...state.queue,
            items: [
              ...state.queue.items.slice(0, index),
              {
                ...state.queue.items[index],
                result,
                progress: 100,
                status: ASRProcessStatus.FINISHED,
              },
              ...state.queue.items.slice(index + 1),
            ],
          };
          return {
            ...state,
            queue: {
              ...queue,
              statistics: calculateStatistics(queue),
            },
          };
        } else {
          console.error(`can't find queue item with id ${item.id}`);
        }
      }

      return state;
    }
  ),
  on(
    ASRActions.cutAndUploadQueueItem.fail,
    ASRActions.runASROnItem.fail,
    ASRActions.runWordAlignmentOnItem.fail,
    ASRActions.processQueueItem.fail,
    (state: ASRState, { item, newStatus }) => {
      if (state.queue && item) {
        const index = state.queue.items.findIndex((a) => a.id === item.id);
        if (index > -1) {
          const queue = {
            ...state.queue,
            items: [
              ...state.queue.items.slice(0, index),
              {
                ...state.queue.items[index],
                status: newStatus,
              },
              ...state.queue.items.slice(index + 1),
            ],
          };

          return {
            ...state,
            queue: {
              ...queue,
              statistics: calculateStatistics(queue),
            },
          };
        } else {
          console.error(`can't find queue item with id ${item.id}`);
        }
      }

      return state;
    }
  )
);

function getItemIndexByTime(
  sampleStart: number,
  sampleLength: number,
  queue: ASRStateQueue
): number {
  return queue.items.findIndex((a) => {
    return (
      a.time.sampleStart === sampleStart && a.time.sampleLength === sampleLength
    );
  });
}
