import {createReducer, on} from '@ngrx/store';
import * as TranscriptionActions from './transcription.actions';
import * as ConfigurationActions from '../configuration/configuration.actions';
import * as IDBActions from '../idb/idb.actions';
import {TranscriptionState} from '../index';
import {isUnset} from '@octra/utilities';
import {OIDBLevel} from '@octra/annotation';

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
  on(TranscriptionActions.setTranscriptionState, (state, newState) => (newState)),
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
    const annotationLevels = state.annotation.levels;
    const index = annotationLevels.findIndex(a => a.id === id);

    if (index > -1 && index < annotationLevels.length) {
      const levelObj = annotationLevels[index];

      return {
        ...state,
        annotation: {
          ...state.annotation,
          levels: [
            ...state.annotation.levels.slice(0, index),
            new OIDBLevel(levelObj.id, level, levelObj.sortorder),
            ...state.annotation.levels.slice(index + 1)
          ]
        }
      };
    } else {
      console.error(`can't change level because index not valid.`);
    }

    return state;
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
        return {
          ...state,
          annotation: {
            ...state.annotation,
            levels: [
              ...state.annotation.levels.slice(0, index),
              ...state.annotation.levels.slice(index + 1)
            ]
          }
        }
      } else {
        console.error(`can't remove level because index not valid.`);
      }
    } else {
      console.error(`can't remove level because id not valid.`);
    }

    return state;
  }),
  on(TranscriptionActions.setLevelCounter, (state, {levelCounter}) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        levelCounter: levelCounter
      }
    })),
  on(IDBActions.loadLogsSuccess, (state, {logs}) => {
    return {
      ...state,
      annotation: {
        ...state.annotation
      },
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
  on(IDBActions.loadAnnotationLevelsSuccess, (state, {levels, levelCounter}) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        levels,
        levelCounter
      }
    })),
  on(IDBActions.loadAnnotationLinksSuccess, (state, {links}) =>
    ({
      ...state,
      annotation: {
        ...state.annotation,
        links
      }
    })),
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
