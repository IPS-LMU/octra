import {createReducer, on} from '@ngrx/store';
import * as TranscriptionActions from './transcription.actions';
import {TranscriptionState} from '../index';
import * as ApplicationActions from '../application/application.actions';

export const initialState: TranscriptionState = {
  savingNeeded: false,
  isSaving: false,
  playOnHover: false,
  followPlayCursor: false,
  submitted: false,
  audioSettings: {
    volume: 1,
    speed: 1
  },
  logs: []
};

export const reducer = createReducer(
  initialState,
  on(TranscriptionActions.setSavingNeeded, (state, {savingNeeded}) => ({
    ...state,
    savingNeeded
  })),
  on(TranscriptionActions.setIsSaving, (state, {isSaving}) => ({
    ...state,
    isSaving
  })),
  on(TranscriptionActions.setPlayOnHover, (state, {playOnHover}) => ({
    ...state,
    playOnHover
  })),
  on(TranscriptionActions.setCurrentEditor, (state, {currentEditor}) => ({
    ...state,
    currentEditor
  })),
  on(TranscriptionActions.setAudioVolume, (state, {volume}) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      volume
    }
  })),
  on(TranscriptionActions.setAudioSpeed, (state, {speed}) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      speed
    }
  }))
);

