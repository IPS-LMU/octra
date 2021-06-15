import {on} from '@ngrx/store';
import {OnlineModeState} from '../../index';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from '../../annotation/annotation.actions';
import {OnlineModeActions} from './online-mode.actions';
import {IDBActions} from '../../idb/idb.actions';
import {isUnset} from '@octra/utilities';

export const initialState: OnlineModeState = {
  ...fromAnnotation.initialState,
  onlineSession: {
    loginData: {
      id: '',
      project: '',
      jobNumber: -1,
      password: ''
    }
  }
};

// initialize ngrx-wieder with custom config
const {createUndoRedoReducer} = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.type,
    AnnotationActions.addAnnotationLevel.type,
    AnnotationActions.removeAnnotationLevel.type
  ]
})

export const reducer = createUndoRedoReducer(
  initialState,
  ...fromAnnotation.reducers,
  on(OnlineModeActions.loginDemo, (state: OnlineModeState, {onlineSession}) => ({
    ...state,
    onlineSession
  })),
  on(OnlineModeActions.login, (state: OnlineModeState, {onlineSession, removeData}) => {
    if (removeData) {
      return initialState;
    }
    return {
      ...state,
      onlineSession
    };
  }),
  on(OnlineModeActions.clearWholeSession, () => ({
    ...initialState
  })),
  on(OnlineModeActions.logout, (state: OnlineModeState, {clearSession}) => {
    return (clearSession) ? initialState : {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false
      },
      histories: {}
    };
  }),
  on(OnlineModeActions.setAudioURL, (state: OnlineModeState, {audioURL}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      audioURL
    }
  })),
  on(OnlineModeActions.setUserData, (state: OnlineModeState, data) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      ...data
    }
  })),
  on(OnlineModeActions.setServerDataEntry, (state: OnlineModeState, {serverDataEntry}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      sessionData: {
        ...state.onlineSession.sessionData,
        serverDataEntry
      }
    }
  })),
  on(OnlineModeActions.setComment, (state: OnlineModeState, {comment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      comment
    }
  })),
  on(OnlineModeActions.setPromptText, (state: OnlineModeState, {promptText}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      promptText
    }
  })),
  on(OnlineModeActions.setServerComment, (state: OnlineModeState, {serverComment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      serverComment
    }
  })),
  on(OnlineModeActions.setJobsLeft, (state: OnlineModeState, {jobsLeft}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      jobsLeft
    }
  })),
  on(IDBActions.loadOptionsSuccess, (state: OnlineModeState, {variables}) => {
      let result = state;

      for (const variable of variables) {
        if (!isUnset(variable)) {
          result = writeOptionToStore(result, variable.name, variable.value);
        }
      }

      return result;
    }
  )
);

function writeOptionToStore(state: OnlineModeState, attribute: string, value: any): OnlineModeState {
  switch (attribute) {
    case('audioURL'):
      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          sessionData: {
            ...state.onlineSession.sessionData,
            audioURL: value
          }
        }
      };
    case('comment'):
      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          sessionData: {
            ...state.onlineSession.sessionData,
            comment: value
          }
        }
      };
    case('dataID'):
      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          sessionData: {
            ...state.onlineSession.sessionData,
            dataID: value
          }
        }
      };
    case('user'):
      const onlineSessionData = {
        jobNumber: -1,
        id: '',
        project: '',
        password: ''
      };

      if (!isUnset(value)) {
        if (value.hasOwnProperty('id')) {
          onlineSessionData.id = value.id;
        }
        if (value.hasOwnProperty('jobno')) {
          onlineSessionData.jobNumber = value.jobno;
        }

        if (value.hasOwnProperty('project')) {
          onlineSessionData.project = value.project;
        }
      }

      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          loginData: onlineSessionData
        }
      };
    case('prompttext'):
      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          sessionData: {
            ...state.onlineSession.sessionData,
            promptText: value
          }
        }
      };
    case('servercomment'):
      return {
        ...state,
        onlineSession: {
          ...state.onlineSession,
          sessionData: {
            ...state.onlineSession.sessionData,
            serverComment: value
          }
        }
      };
  }

  return state;
}
