import {createAction, props} from '@ngrx/store';
import {ConsoleEntry} from '../../shared/service/bug-report.service';

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

export const setConsoleEntries = createAction(
  `[${context}] Set Console Entries`,
  props<{
    consoleEntries: ConsoleEntry[];
  }>()
);

export const consoleEntriesLoadSuccess = createAction(
  `[IDB] Console Entries Load Success`
);

export const consoleEntriesLoadFailed = createAction(
  `[IDB] Console Entries Load Failed`,
  props<{
    error: string;
  }>()
);


