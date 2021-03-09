import {createReducer, on} from '@ngrx/store';
import {TranscriptionState} from '../index';
import {isUnset} from '@octra/utilities';
import {TranscriptionActions} from './transcription.actions';
import {IDBActions} from '../idb/idb.actions';
import {ConfigurationActions} from '../configuration/configuration.actions';
import {LoginActions} from '../login/login.actions';

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
  on(TranscriptionActions.setSavingNeeded, (state: TranscriptionState, {savingNeeded}) => ({
    ...state,
    savingNeeded
  })),
  on(TranscriptionActions.setIsSaving, (state: TranscriptionState, {isSaving}) => ({
    ...state,
    isSaving
  })),
  on(TranscriptionActions.setPlayOnHover, (state: TranscriptionState, {playOnHover}) => ({
    ...state,
    playOnHover
  })),
  on(TranscriptionActions.setCurrentEditor, (state: TranscriptionState, {currentEditor}) => ({
    ...state,
    currentEditor
  })),
  on(TranscriptionActions.setAudioSettings, (state: TranscriptionState, data) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      ...data
    }
  })),
  on(TranscriptionActions.addLog, (state: TranscriptionState, {log}) => ({
    ...state,
    logs: [...state.logs, log]
  })),
  on(TranscriptionActions.setLogs, (state: TranscriptionState, {logs}) => ({
    ...state,
    logs
  })),
  on(TranscriptionActions.setLogging, (state: TranscriptionState, {logging}) => ({
    ...state,
    logging
  })),
  on(TranscriptionActions.setShowLoupe, (state: TranscriptionState, {showLoupe}) => ({
    ...state,
    showLoupe
  })),
  on(TranscriptionActions.setEasyMode, (state: TranscriptionState, {easyMode}) => ({
    ...state,
    easyMode
  })),
  on(TranscriptionActions.setSecondsPerLine, (state: TranscriptionState, {secondsPerLine}) => ({
    ...state,
    secondsPerLine
  })),
  on(TranscriptionActions.setHighlightingEnabled, (state: TranscriptionState, {highlightingEnabled}) => ({
    ...state,
    highlightingEnabled
  })),
  on(TranscriptionActions.setFeedback, (state: TranscriptionState, {feedback}) => ({
    ...state,
    feedback
  })),
  on(TranscriptionActions.setSubmitted, (state: TranscriptionState, {submitted}) => {
    return {
      ...state,
      submitted
    };
  }),
  on(TranscriptionActions.setTranscriptionState, (state: TranscriptionState, newState) => ({...state, ...newState})),
  on(TranscriptionActions.clearLogs, (state) => ({
    ...state,
    logs: []
  })),
  on(IDBActions.loadLogsSuccess, (state: TranscriptionState, {logs}) => {
    return {
      ...state,
      logs
    };
  }),
  on(ConfigurationActions.projectConfigurationLoaded, (state: TranscriptionState, {projectConfig}) =>
    ({
      ...state,
      projectConfig
    })),
  on(ConfigurationActions.loadGuidelinesSuccess, (state: TranscriptionState, {guidelines}) => ({
    ...state,
    guidelines
  })),
  on(IDBActions.loadOptionsSuccess, (state: TranscriptionState, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = writeOptionToStore(result, variable.name, variable.value);
    }

    return result;
  }),
  on(ConfigurationActions.loadMethodsSuccess, (state: TranscriptionState, methods) =>
    ({
      ...state,
      methods
    })),
  on(TranscriptionActions.setAudioLoaded, (state: TranscriptionState, {loaded}) => {
      return {
        ...state,
        audio: {
          ...state.audio,
          loaded
        }
      };
    }
  ),
  on(LoginActions.logout, (state: TranscriptionState, {clearSession}) => {
      if (clearSession) {
        return {
          ...initialState,
          guidelines: state.guidelines,
          projectConfig: state.projectConfig,
          methods: state.methods
        };
      }

      return {
        ...state,
        savingNeeded: false,
        isSaving: false,
        submitted: false,
        audio: {
          loaded: false
        }
      };
    }
  ),
  on(LoginActions.loginDemo, (state: TranscriptionState) => {
      return {
        ...initialState,
        guidelines: state.guidelines,
        projectConfig: state.projectConfig,
        methods: state.methods
      };
    }
  ),
  on(LoginActions.loginURLParameters, (state: TranscriptionState) => {
      return {
        ...initialState,
        guidelines: state.guidelines,
        projectConfig: state.projectConfig,
        methods: state.methods
      };
    }
  ),
  on(LoginActions.loginLocal, (state: TranscriptionState, {removeData}) => {
    if (removeData) {
      return {
        ...initialState,
        guidelines: state.guidelines,
        projectConfig: state.projectConfig,
        methods: state.methods
      };
    }

    return {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false
      }
    };
  }),
  on(LoginActions.loginOnline, (state: TranscriptionState, {removeData}) => {
    if (removeData) {
      return {
        ...initialState,
        guidelines: state.guidelines,
        projectConfig: state.projectConfig,
        methods: state.methods
      };
    }

    return {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false
      }
    };
    }
  ),
  on(LoginActions.clearWholeSession, (state: TranscriptionState) =>
    ({
      ...initialState,
      guidelines: state.guidelines,
      projectConfig: state.projectConfig,
      methods: state.methods
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

function writeOptionToStore(state: TranscriptionState, attribute: string, value: any): TranscriptionState {
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
      };
    case('interface'):
      return {
        ...state,
        currentEditor: (!isUnset(value)) ? value : '2D-Editor'
      };
    case('logging'):
      return {
        ...state,
        logging: (!isUnset(value)) ? value : true
      };
    case('showLoupe'):
      return {
        ...state,
        showLoupe: (!isUnset(value)) ? value : false
      };
    case('secondsPerLine'):
      return {
        ...state,
        secondsPerLine: (!isUnset(value)) ? value : 5
      };
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
      };
  }

  return state;
}
