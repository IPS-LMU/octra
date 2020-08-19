import {createReducer, on} from '@ngrx/store';
import * as ApplicationActions from './application.actions';
import * as fromApplicationActions from './application.actions';
import * as fromConfigurationActions from '../configuration/configuration.actions';
import * as fromIDBActions from '../idb/idb.actions';
import {ApplicationState, LoadingStatus} from '../index';

export const initialState: ApplicationState = {
  loading: {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: []
  },
  reloaded: false,
  idb: {
    loaded: false
  },
  language: 'en',
  version: '1.0.0',
  appConfiguration: false,
  consoleEntries: []
};

export const reducer = createReducer(
  initialState,
  on(ApplicationActions.load, (state, {progress}) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.LOADING,
      progress
    }
  })),
  on(ApplicationActions.addError, (state, {error}) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FAILED,
      errors: [...state.loading.errors, error]
    }
  })),
  on(ApplicationActions.setIDBLoaded, (state, {loaded}) => ({
    ...state,
    idb: {
      ...state,
      loaded
    }
  })),
  on(ApplicationActions.setReloaded, (state, {reloaded}) => ({
    ...state,
    reloaded
  })),
  on(ApplicationActions.finishLoading, (state) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FINISHED
    }
  })),
  on(ApplicationActions.setAppLanguage, (state, {language}) => ({
    ...state,
    language
  })),
  on(ApplicationActions.setAppVersion, (state, {version}) => ({
    ...state,
    version
  })),
  on(fromConfigurationActions.appConfigurationLoadSuccess, (state) => ({
    ...state,
    appSettingsLoaded: true
  })),
  on(fromApplicationActions.setConsoleEntries, (state, {consoleEntries}) => ({
    ...state,
    consoleEntries
  })),
  on(fromIDBActions.loadOptionsSuccess, (state, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = saveOptionToStore(state, variable.name, variable.value);
    }

    return result;
  })
);


function saveOptionToStore(state: ApplicationState, attribute: string, value: any): ApplicationState {
  console.log(`save Option ${attribute} to store with value "${JSON.stringify(value)}"...`);
  switch (attribute) {
    case('_version'):
      return {
        ...state,
        version: value
      };
    case('_language'):
      return {
        ...state,
        language: value
      };
    default:
      console.error(`can't find case for attribute ${attribute}`);
      return state;
  }
}

