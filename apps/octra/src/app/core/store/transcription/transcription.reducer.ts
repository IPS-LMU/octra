import {createReducer, on} from '@ngrx/store';
import * as TranscriptionActions from './transcription.actions';
import * as fromConfigurationActions from '../configuration/configuration.actions';
import * as fromIDBActions from '../idb/idb.actions';
import {RootState, TranscriptionState} from '../index';

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
  on(TranscriptionActions.setAnnotation, (state, {annotation}) => ({
    ...state,
    annotation
  })),
  on(TranscriptionActions.setSubmitted, (state, {submitted}) => ({
    ...state,
    submitted
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
  on(TranscriptionActions.overwriteAnnotation, (state, {annotation}) => ({
    ...state,
    annotation
  })),
  on(TranscriptionActions.clearLogs, (state) => ({
    ...state,
    logs: []
  })),
  on(TranscriptionActions.changeAnnotationLevel, (state, {level, id}) => {
    const result: TranscriptionState = state;
    const index = state.annotation.levels.findIndex(a => a.id === id);

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
    })),
  on(fromConfigurationActions.projectConfigurationLoaded, (state, {projectConfig}) =>
    ({
      ...state,
      projectConfig
    })),
  on(fromIDBActions.loadOptionsSuccess, (state, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = saveOptionToStore(state, variable.name, variable.value);
    }

    return result;
  }),
  on(fromIDBActions.loadAnnotationLevelsSuccess, (state, {levels, levelCounter}) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        levels,
        levelCounter
      }
    }))
);

function saveOptionToStore(state: TranscriptionState, attribute: string, value: any): TranscriptionState {
  console.log(`save Option ${attribute} to store with value "${JSON.stringify(value)}"...`);
  switch (attribute) {
    case('_submitted'):
      return {
        ...state,
        submitted: value
      };
    case('_easymode'):
      return {
        ...state,
        easyMode: value
      };
    case('_feedback'):
      return {
        ...state,
        feedback: value
      }
    case('_interface'):
      return {
        ...state,
        currentEditor: value
      }
    case('_logging'):
      return {
        ...state,
        logging: value
      }
    case('_showLoupe'):
      return {
        ...state,
        showLoupe: value
      }
    case('_secondsPerLine'):
      return {
        ...state,
        secondsPerLine: value
      }
    case('_audioSettings'):
      return {
        ...state,
        audioSettings: {
          volume: value.volume,
          speed: value.speed
        }
      };
    case('_highlightingEnabled'):
      return {
        ...state,
        highlightingEnabled: value
      }
    default:
      console.error(`can't find case for attribute ${attribute}`);
  }

  return state;
}
