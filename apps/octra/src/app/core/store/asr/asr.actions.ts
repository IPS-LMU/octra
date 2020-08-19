import {createAction, props} from '@ngrx/store';

const context = 'ASR';

export const setASRSettings = createAction(
  `[${context}] Set ASR Settings`,
  props<{
    selectedLanguage: string;
    selectedService: string;
  }>()
);
