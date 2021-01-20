import {createReducer, on} from '@ngrx/store';
import {TranscriptionState} from '../index';
import {isUnset} from '@octra/utilities';
import {TranscriptionActions} from './transcription.actions';
import {IDBActions} from '../idb/idb.actions';
import {ConfigurationActions} from '../configuration/configuration.actions';

export const initialState: TranscriptionState = {
  savingNeeded: false,
  isSaving: false,
  playOnHover: false,
  followPlayCursor: false,
  submitted: false,
  audio: {
    loaded: false
  },
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
  on(TranscriptionActions.setAudioSettings, (state, data) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      ...data
    }
  })),
  on(TranscriptionActions.addLog, (state, {log}) => ({
    ...state,
    logs: [...state.logs, log]
  })),
  on(TranscriptionActions.setLogs, (state, {logs}) => ({
    ...state,
    logs
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
  on(TranscriptionActions.setSubmitted, (state, {submitted}) => {
    console.log(`reduce submitted...`);
    console.log(state);
    return {
      ...state,
      submitted
    }
  }),
  on(TranscriptionActions.setTranscriptionState, (state, newState) => ({...state, ...newState})),
  on(TranscriptionActions.clearLogs, (state) => ({
    ...state,
    logs: []
  })),
  on(IDBActions.loadLogsSuccess, (state, {logs}) => {
    return {
      ...state,
      logs
    };
  }),
  on(ConfigurationActions.projectConfigurationLoaded, (state, {projectConfig}) =>
    ({
      ...state,
      projectConfig
    })),
  on(ConfigurationActions.loadGuidelinesSuccess, (state, {guidelines}) => ({
    ...state,
    guidelines
  })),
  on(IDBActions.loadOptionsSuccess, (state, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = saveOptionToStore(result, variable.name, variable.value);
    }

    return result;
  }),
  on(ConfigurationActions.loadMethodsSuccess, (state, methods) =>
    ({
      ...state,
      methods
    })),
  on(TranscriptionActions.setAudioLoaded, (state, {loaded}) =>
    ({
      ...state,
      audio: {
        ...state.audio,
        loaded
      }
    })),
  on(TranscriptionActions.clearSettings, (state) =>
    ({
      ...state,
      guidelines: undefined,
      projectConfig: undefined,
      methods: {
        validate: undefined,
        tidyUp: undefined
      }
    }))
);

function saveOptionToStore(state: TranscriptionState, attribute: string, value: any): TranscriptionState {
  switch (attribute) {
    case('submitted'):
      return {
        ...state,
        submitted: (!isUnset(value)) ? value : false
      };
    case('easymode'):
      return {
        ...state,
        easyMode: (!isUnset(value)) ? value : false
      };
    case('feedback'):
      return {
        ...state,
        feedback: value
      }
    case('interface'):
      return {
        ...state,
        currentEditor: (!isUnset(value)) ? value : '2D-Editor'
      }
    case('logging'):
      return {
        ...state,
        logging: (!isUnset(value)) ? value : true
      }
    case('showLoupe'):
      return {
        ...state,
        showLoupe: (!isUnset(value)) ? value : false
      }
    case('secondsPerLine'):
      return {
        ...state,
        secondsPerLine: (!isUnset(value)) ? value : 5
      }
    case('audioSettings'):
      return {
        ...state,
        audioSettings: {
          volume: (!isUnset(value)) ? value.volume : 1,
          speed: (!isUnset(value)) ? value.speed : 1
        }
      };
    case('highlightingEnabled'):
      return {
        ...state,
        highlightingEnabled: (!isUnset(value)) ? value : false
      }
  }

  return state;
}
