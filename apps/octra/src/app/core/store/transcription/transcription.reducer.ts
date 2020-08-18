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
  annotation: {
    levels: [],
    links: [],
    levelCounter: 0
  },
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
  })),
  on(TranscriptionActions.setAnnotation, (state, {annotation}) => ({
    ...state,
    annotation
  })),
  on(TranscriptionActions.setAnnotationLevels, (state, {levels}) => ({
    ...state,
    annotation: {
      ...state.annotation,
      levels
    }
  })),
  on(TranscriptionActions.setAnnotationLinks, (state, {links}) => ({
    ...state,
    annotation: {
      ...state.annotation,
      links
    }
  })),
  on(TranscriptionActions.clearAnnotation, (state) => ({
    ...state,
    annotation: {
      levels: [],
      links: [],
      levelCounter: 0
    }
  })),
  on(TranscriptionActions.changeAnnotationLevel, (state, {level, index}) => {
    const result = state;

    if (index > -1 && index < result.annotation.levels.length) {
      result.annotation.levels[index].level = level;
    } else {
      console.error(`can't change level because index not valid.`);
    }

    return result;
  }),
  on(TranscriptionActions.addAnnotationLevel, (state, level) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        levels: [
          ...state.annotation.levels,
          level
        ]
      }
    })),
  on(TranscriptionActions.removeAnnotationLevel, (state, {id}) => {
    const result = state;

    if (id > -1) {
      const index = result.annotation.levels.findIndex((a) => (a.id === id));
      if (index > -1) {
        result.annotation.levels.splice(index, 1);
      } else {
        console.error(`can't remove level because index not valid.`);
      }
    } else {
      console.error(`can't remove level because id not valid.`);
    }

    return result;
  }),
  on(TranscriptionActions.setLevelCounter, (state, {levelCounter}) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        levelCounter: levelCounter
      }
    }))
);

