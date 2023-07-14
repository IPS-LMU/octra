import { createReducer, on } from '@ngrx/store';
import { ASRActions } from './asr.actions';
import { IDBActions } from '../idb/idb.actions';
import { hasProperty } from '@octra/utilities';
import { ASRState } from './index';

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(ASRActions.setASRSettings, (state: ASRState, data) => ({
    ...state,
    ...data,
  })),
  on(
    IDBActions.loadOptions.success,
    (state: ASRState, { applicationOptions }) => ({
      ...state,
      selectedLanguage: applicationOptions.asr?.selectedLanguage,
      selectedService: applicationOptions.asr?.selectedService
    })
  )
);
