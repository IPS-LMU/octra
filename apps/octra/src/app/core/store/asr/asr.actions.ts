import {createAction, props} from '@ngrx/store';

const context = 'ASR';

export const setASRLanguage = createAction(
  `[${context}] Set ASR language`,
  props<{
    selectedLanguage: string;
  }>()
);

export const setASRService = createAction(
  `[${context}] Set ASR service`,
  props<{
    selectedService: string;
  }>()
);




