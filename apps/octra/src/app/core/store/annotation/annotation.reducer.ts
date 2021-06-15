import {ActionCreator, on, ReducerTypes} from '@ngrx/store';
import {AnnotationState} from '../index';
import {AnnotationActions} from './annotation.actions';
import {IDBActions} from '../idb/idb.actions';
import {ConfigurationActions} from '../configuration/configuration.actions';
import {isUnset} from '@octra/utilities';

export const initialState: AnnotationState = {
  transcript: {
    levels: [],
    links: [],
    levelCounter: 0
  },
  savingNeeded: false,
  isSaving: false,
  submitted: false,
  audio: {
    loaded: false
  },
  feedback: null,
  logs: [],
  logging: false,
  histories: {}
};

export const reducers: ReducerTypes<AnnotationState, ActionCreator[]>[] = [
  on(AnnotationActions.setLevelCounter, (state: AnnotationState, {levelCounter}) =>
    ({
      ...state,
      transcript: {
        ...state.transcript,
        levelCounter: levelCounter
      }
    })),
  on(AnnotationActions.setAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    annotation
  })),
  on(AnnotationActions.clearAnnotation, (state) => ({
    ...state,
    transcript: {
      levels: [],
      links: [],
      levelCounter: 0
    }
  })),
  on(AnnotationActions.overwriteAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    ...annotation
  })),
  on(AnnotationActions.changeAnnotationLevel, (state: AnnotationState, {level}) => {
    const annotationLevels = state.transcript.levels;
    const index = annotationLevels.findIndex(a => a.id === level.id);

    if (index > -1 && index < annotationLevels.length) {
      return {
        ...state,
        transcript: {
          ...state.transcript,
          levels: [
            ...state.transcript.levels.slice(0, index),
            {
              ...level
            },
            ...state.transcript.levels.slice(index + 1)
          ]
        }
      };
    } else {
      console.error(`can't change level because index not valid.`);
    }

    return state;
  }),
  on(AnnotationActions.addAnnotationLevel, (state: AnnotationState, {level}) =>
    ({
      ...state,
      transcript: {
        ...state.transcript,
        levels: [
          ...state.transcript.levels,
          level
        ]
      }
    })),
  on(AnnotationActions.removeAnnotationLevel, (state: AnnotationState, {id}) => {
    if (id > -1) {
      const index = state.transcript.levels.findIndex((a) => (a.id === id));
      if (index > -1) {
        return {
          ...state,
          transcript: {
            ...state.transcript,
            levels: [
              ...state.transcript.levels.slice(0, index),
              ...state.transcript.levels.slice(index + 1)
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
  on(IDBActions.loadAnnotationLevelsSuccess, (state: AnnotationState, {levels, levelCounter}) =>
    ({
      ...state,
      transcript: {
        ...state.transcript,
        levels,
        levelCounter
      }
    })),
  on(IDBActions.loadAnnotationLinksSuccess, (state: AnnotationState, {links}) =>
    ({
      ...state,
      transcript: {
        ...state.transcript,
        links
      }
    })),
  on(AnnotationActions.setSavingNeeded, (state: AnnotationState, {savingNeeded}) => ({
    ...state,
    savingNeeded
  })),
  on(AnnotationActions.setIsSaving, (state: AnnotationState, {isSaving}) => ({
    ...state,
    isSaving
  })),
  on(AnnotationActions.setCurrentEditor, (state: AnnotationState, {currentEditor}) => ({
    ...state,
    currentEditor
  })),

  on(AnnotationActions.addLog, (state: AnnotationState, {log}) => ({
    ...state,
    logs: [...state.logs, log]
  })),
  on(AnnotationActions.setLogs, (state: AnnotationState, {logs}) => ({
    ...state,
    logs
  })),
  on(AnnotationActions.setLogging, (state: AnnotationState, {logging}) => ({
    ...state,
    logging
  })),

  on(AnnotationActions.setFeedback, (state: AnnotationState, {feedback}) => ({
    ...state,
    feedback
  })),
  on(AnnotationActions.setSubmitted, (state: AnnotationState, {submitted}) => {
    return {
      ...state,
      submitted
    };
  }),
  on(AnnotationActions.setTranscriptionState, (state: AnnotationState, newState) => ({...state, ...newState})),
  on(AnnotationActions.clearLogs, (state) => ({
    ...state,
    logs: []
  })),
  on(IDBActions.loadLogsSuccess, (state: AnnotationState, {logs}) => {
    return {
      ...state,
      logs
    };
  }),
  on(ConfigurationActions.projectConfigurationLoaded, (state: AnnotationState, {projectConfig}) =>
    ({
      ...state,
      projectConfig
    })),
  on(ConfigurationActions.loadGuidelinesSuccess, (state: AnnotationState, {guidelines}) => ({
    ...state,
    guidelines
  })),
  on(IDBActions.loadOptionsSuccess, (state: AnnotationState, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = writeOptionToStore(result, variable.name, variable.value);
    }

    return result;
  }),
  on(ConfigurationActions.loadMethodsSuccess, (state: AnnotationState, methods) =>
    ({
      ...state,
      methods
    })),
  on(AnnotationActions.setAudioLoaded, (state: AnnotationState, {loaded}) => {
      return {
        ...state,
        audio: {
          ...state.audio,
          loaded
        }
      };
    }
  )
];


function writeOptionToStore(state: AnnotationState, attribute: string, value: any): AnnotationState {
  switch (attribute) {
    case('submitted'):
      return {
        ...state,
        submitted: (!isUnset(value)) ? value : false
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
  }

  return state;
}
