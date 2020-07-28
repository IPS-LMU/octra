import {createAction, props} from '@ngrx/store';

const context = 'Transcription';

export const setSavingNeeded = createAction(
  `[${context}] Set savingNeeded`,
  props<{
    savingNeeded: boolean;
  }>()
);

export const setIsSaving = createAction(
  `[${context}] Set isSaving`,
  props<{
    isSaving: boolean;
  }>()
);


