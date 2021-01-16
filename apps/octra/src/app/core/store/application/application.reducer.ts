import {createReducer, on} from '@ngrx/store';
import * as ApplicationActions from './application.actions';
import * as ConfigurationActions from '../configuration/configuration.actions';
import * as IDBActions from '../idb/idb.actions';
import {ApplicationState, LoadingStatus} from '../index';
import {isUnset} from '@octra/utilities';

export const initialState: ApplicationState = {
  loading: {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: []
  },
  reloaded: false,
  idb: {
    loaded: false,
    version: 1
  },
  language: 'en',
  appConfiguration: undefined,
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
  on(ApplicationActions.setDBVersion, (state, {version}) => ({
    ...state,
    version
  })),
  on(ConfigurationActions.appConfigurationLoadSuccess, (state) => ({
    ...state,
    appSettingsLoaded: true
  })),
  on(ApplicationActions.setConsoleEntries, (state, {consoleEntries}) => ({
    ...state,
    consoleEntries
  })),
  on(IDBActions.loadOptionsSuccess, (state, {variables}) => {
    let result = state;

    for (const variable of variables) {
      result = saveOptionToStore(result, variable.name, variable.value);
    }

    return result;
  }),
  on(ConfigurationActions.appConfigurationLoadSuccess, (state, {appConfiguration}) => ({
    ...state,
    loading: {
      ...state.loading,
      progress: state.loading.progress + 25
    },
    appConfiguration
  })),
  on(ConfigurationActions.loadGuidelinesSuccess, (state) => ({
    ...state,
    loading: {
      ...state.loading,
      progress: state.loading.progress + 25
    }
  })),
  on(ConfigurationActions.projectConfigurationLoaded, (state) => ({
    ...state,
    loading: {
      ...state.loading,
      progress: state.loading.progress + 25
    }
  })),
  on(ConfigurationActions.loadMethodsSuccess, (state) => ({
    ...state,
    loading: {
      ...state.loading,
      progress: state.loading.progress + 25
    }
  })),
  on(IDBActions.loadAnnotationLinksSuccess, (state) => ({
    ...state,
    idb: {
      ...state.idb,
      loaded: true
    }
  }))
);


function saveOptionToStore(state: ApplicationState, attribute: string, value: any): ApplicationState {
  switch (attribute) {
    case('version'):
      return {
        ...state,
        idb: {
          ...state.idb,
          version: value
        }
      };
    case('language'):
      return {
        ...state,
        language: (!isUnset(value)) ? value : 'en'
      };
    default:
      return state;
  }
}

