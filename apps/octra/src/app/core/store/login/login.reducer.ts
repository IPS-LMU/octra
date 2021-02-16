import {createReducer, on} from '@ngrx/store';
import {LoginMode, LoginState} from '../index';
import {SessionFile} from '../../obj/SessionFile';
import {LoginActions} from './login.actions';
import {IDBActions} from '../idb/idb.actions';
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
  on(LoginActions.loginDemo, (state: LoginState, {onlineSession}) => ({
    ...state,
    mode: LoginMode.DEMO,
    loggedIn: true,
    onlineSession
  })),
  on(LoginActions.loginLocal, (state: LoginState, {files, sessionFile}) => ({
    ...state,
    mode: LoginMode.LOCAL,
    loggedIn: true,
    sessionFile,
    files
  })),
  on(LoginActions.loginURLParameters, (state: LoginState, {urlParams}) => ({
    ...state,
    mode: LoginMode.URL,
    loggedIn: true,
    urlParams
  })),
  on(LoginActions.loginOnline, (state: LoginState, {onlineSession}) => ({
    ...state,
    mode: LoginMode.ONLINE,
    loggedIn: true,
    onlineSession
  })),
  on(LoginActions.setMode, (state: LoginState, {mode}) => ({
    ...state,
    mode
  })),
  on(LoginActions.logout, (state: LoginState) => ({
    ...state,
    loggedIn: false
  })),
  on(LoginActions.clearLocalSession, (state: LoginState) => ({
    ...state,
    queryParams: undefined,
    files: []
  })),
  on(LoginActions.clearOnlineSession, (state: LoginState) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      sessionData: undefined
    }
  })),
  on(LoginActions.setAudioURL, (state: LoginState, {audioURL}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      audioURL
    }
  })),
  on(LoginActions.setUserData, (state: LoginState, data) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      ...data
    }
  })),
  on(LoginActions.setServerDataEntry, (state: LoginState, data) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      ...data
    }
  })),
  on(LoginActions.setLoggedIn, (state: LoginState, {loggedIn}) => ({
    ...state,
    loggedIn
  })),
  on(LoginActions.setSessionFile, (state: LoginState, {sessionFile}) => ({
    ...state,
    sessionFile
  })),
  on(LoginActions.setComment, (state: LoginState, {comment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      comment
    }
  })),
  on(LoginActions.setPromptText, (state: LoginState, {promptText}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      promptText
    }
  })),
  on(LoginActions.setServerComment, (state: LoginState, {serverComment}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      serverComment
    }
  })),
  on(LoginActions.setJobsLeft, (state: LoginState, {jobsLeft}) => ({
    ...state,
    onlineSession: {
      ...state.onlineSession,
      jobsLeft
    }
  })),
  on(IDBActions.loadOptionsSuccess, (state: LoginState, {variables}) => {
      let result = state;

      for (const variable of variables) {
        if (!isUnset(variable)) {
          result = writeOptionToStore(result, variable.name, variable.value);
        }
      }

      return result;
    }
  ));

function writeOptionToStore(state: LoginState, attribute: string, value: any): LoginState {
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

