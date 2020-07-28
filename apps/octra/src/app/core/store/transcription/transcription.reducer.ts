import {createReducer, on} from '@ngrx/store';
import * as TranscriptionActions from './transcription.actions';
import {ASRState} from '../index';

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(TranscriptionActions.setSavingNeeded, (state, {savingNeeded}) => ({
    ...state,
    savingNeeded
  })),
  on(TranscriptionActions.setIsSaving, (state, {isSaving}) => ({
    ...state,
    isSaving
  }))
);

