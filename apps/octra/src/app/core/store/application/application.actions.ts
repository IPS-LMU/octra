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

export const setReloaded = createAction(
  `[${context}] Set reloaded`,
  props<{
    reloaded: boolean;
  }>()
);

export const setIDBLoaded = createAction(
  `[${context}] Set idb loaded`,
  props<{
    loaded: boolean;
  }>()
);

export const setAppLanguage = createAction(
  `[${context}] Set app language`,
  props<{
    language: string;
  }>()
);

export const setAppVersion = createAction(
  `[${context}] Set app version`,
  props<{
    version: string;
  }>()
);

