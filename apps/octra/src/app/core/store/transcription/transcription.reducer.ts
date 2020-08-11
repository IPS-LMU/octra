import {createReducer, on} from '@ngrx/store';
import * as TranscriptionActions from './transcription.actions';
import {TranscriptionState} from '../index';

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
  feedback: null,
  logs: [],
  logging: false,
  showLoupe: false,
  easyMode: false,
  secondsPerLine: 5,
  highlightingEnabled: false
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
  })),
  on(TranscriptionActions.setLogging, (state, {logging}) => ({
    ...state,
    logging
  })),
  on(TranscriptionActions.setShowLoupe, (state, {showLoupe}) => ({
    ...state,
    showLoupe
  })),
  on(TranscriptionActions.setEasyMode, (state, {easyMode}) => ({
    ...state,
    easyMode
  })),
  on(TranscriptionActions.setSecondsPerLine, (state, {secondsPerLine}) => ({
    ...state,
    secondsPerLine
  })),
  on(TranscriptionActions.setHighlightingEnabled, (state, {highlightingEnabled}) => ({
    ...state,
    highlightingEnabled
  })),
  on(TranscriptionActions.setFeedback, (state, {feedback}) => ({
    ...state,
    feedback
  }))
);

