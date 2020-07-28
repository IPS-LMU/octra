import {createAction, props} from '@ngrx/store';

const context = 'Application';

export const finishLoading = createAction(`[${context}] Finish Loading`);
export const load = createAction(
  `[${context}] Load`,
  props<{
    progress: number;
  }>()
);

export const addError = createAction(
  `[${context}] Add Error`,
  props<{
    error: string
  }>()
);

export const setCurrentEditor = createAction(
  `[${context}] Set current editor`,
  props<{
    currentEditor: string
  }>()
);

export const setAudioVolume = createAction(
  `[${context}] Set volume`,
  props<{
    volume: number
  }>()
);

export const setAudioSpeed = createAction(
  `[${context}] Set speed`,
  props<{
    speed: number
  }>()
);

