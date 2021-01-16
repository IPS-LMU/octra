import {createReducer, on} from '@ngrx/store';
import * as LoginActions from './login.actions';
import {LoginMode, LoginState} from '../index';
import * as IDBActions from '../idb/idb.actions';
import {SessionFile} from '../../obj/SessionFile';
import {isUnset} from '@octra/utilities';

export const initialState: LoginState = {
  onlineSession: {
    loginData: {
      id: '',
      project: '',
      jobNumber: -1,
      password: ''
    }
  },
  loggedIn: false
};

export const reducer = createReducer(
  initialState,
  on(LoginActions.loginDemo, (state, {onlineSession}) => ({
    ...state,
    mode: LoginMode.DEMO,
    loggedIn: true,
    onlineSession
  })),
  on(LoginActions.loginLocal, (state, {files, sessionFile}) => ({
    ...state,
    mode: LoginMode.LOCAL,
    loggedIn: true,
    sessionFile,
    files
  })),
  on(LoginActions.loginURLParameters, (state, {urlParams}) => ({
    ...state,
    mode: LoginMode.URL,
    loggedIn: true,
    urlParams
  })),
  on(LoginActions.loginOnline, (state, {onlineSession}) => ({
    ...state,
    mode: LoginMode.ONLINE,
    loggedIn: true,
    onlineSession
  })),
  on(LoginActions.setMode, (state, {mode}) => ({
    ...state,
    mode
  })),
  on(LoginActions.logout, (state) => ({
    ...state,
    loggedIn: false
  })),
  on(LoginActions.clearLocalSession, (state) => ({
    ...state,
    queryParams: undefined,
    files: []
  })),
  on(LoginActions.clearOnlineSession, (state) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      sessionData: undefined
    }
  })),
  on(LoginActions.setAudioURL, (state, {audioURL}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      audioURL
    }
  })),
  on(LoginActions.setUserData, (state, data) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      ...data
    }
  })),
  on(LoginActions.setServerDataEntry, (state, data) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      ...data
    }
  })),
  on(LoginActions.setLoggedIn, (state, {loggedIn}) => ({
    ...state,
    loggedIn
  })),
  on(LoginActions.setSessionFile, (state, {sessionFile}) => ({
    ...state,
    sessionFile
  })),
  on(LoginActions.setComment, (state, {comment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      comment
    }
  })),
  on(LoginActions.setPromptText, (state, {promptText}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      promptText
    }
  })),
  on(LoginActions.setServerComment, (state, {serverComment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      serverComment
    }
  })),
  on(LoginActions.setJobsLeft, (state, {jobsLeft}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      jobsLeft
    }
  })),
  on(IDBActions.loadOptionsSuccess, (state, {variables}) => {
      let result = state;

      for (const variable of variables) {
        if (!isUnset(variable)) {
          result = saveOptionToStore(result, variable.name, variable.value);
        }
      }

      return result;
    }
  ));

function saveOptionToStore(state: LoginState, attribute: string, value: any): LoginState {
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
    case('sessionfile'):
      const sessionFile = SessionFile.fromAny(value);

      return {
        ...state,
        sessionFile
      };
    case('usemode'):
      return {
        ...state,
        mode: value
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

