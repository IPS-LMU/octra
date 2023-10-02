import { createReducer, on } from '@ngrx/store';
import { LoadingStatus, LoginMode } from '../index';
import { ApplicationActions } from './application.actions';
import { IDBActions } from '../idb/idb.actions';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';
import { ApplicationState } from './index';
import { AuthenticationActions } from '../authentication';

export const initialState: ApplicationState = {
  initialized: false,
  shortcutsEnabled: true,
  loading: {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: [],
  },
  reloaded: false,
  idb: {
    loaded: false,
    version: 1,
  },
  language: 'en',
  loggedIn: false,
  consoleEntries: [],
  options: {
    playOnHover: false,
    followPlayCursor: false,
    showLoupe: false,
    audioSettings: {
      volume: 1,
      speed: 1,
    },
    easyMode: false,
    secondsPerLine: 10,
    highlightingEnabled: false,
  },
};

export const reducer = createReducer(
  initialState,
  on(
    ApplicationActions.initApplication.setSessionStorageOptions,
    (
      state: ApplicationState,
      { followPlayCursor, playOnHover, reloaded, loggedIn }
    ) => ({
      ...state,
      options: {
        ...state.options,
        followPlayCursor,
        playOnHover,
      },
      reloaded,
      loggedIn,
    })
  ),
  on(ApplicationActions.initApplication.finish, (state: ApplicationState) => ({
    ...state,
    initialized: true,
  })),
  on(AuthenticationActions.needReAuthentication.do, (state: ApplicationState) => ({
    ...state,
    shortcutsEnabled: false,
  })),
  on(AuthenticationActions.reauthenticate.success, AnnotationActions.prepareTaskDataForAnnotation.do, (state: ApplicationState) => ({
    ...state,
    shortcutsEnabled: true,
  })),
  on(
    AuthenticationActions.loginOnline.redirectToURL,
    (state: ApplicationState) => ({
      ...state,
      mode: LoginMode.ONLINE,
    })
  ),
  on(ApplicationActions.addError, (state: ApplicationState, { error }) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FAILED,
      errors: [...state.loading.errors, error],
    },
  })),
  on(
    ApplicationActions.loadSettings.success,
    (state: ApplicationState, { settings }) => ({
      ...state,
      appSettingsLoaded: true,
      appConfiguration: settings,
      loading: {
        ...state.loading,
        status: LoadingStatus.LOADING,
        progress: 50,
      },
    })
  ),
  on(
    ApplicationActions.setReloaded,
    (state: ApplicationState, { reloaded }) => ({
      ...state,
      reloaded,
    })
  ),
  on(ApplicationActions.finishLoading, (state: ApplicationState) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FINISHED,
    },
  })),
  on(
    ApplicationActions.setAppLanguage,
    (state: ApplicationState, { language }) => ({
      ...state,
      language,
    })
  ),
  on(
    ApplicationActions.setDBVersion,
    (state: ApplicationState, { version }) => ({
      ...state,
      version,
    })
  ),
  on(
    ApplicationActions.setConsoleEntries,
    (state: ApplicationState, { consoleEntries }) => ({
      ...state,
      consoleEntries,
    })
  ),
  on(
    IDBActions.loadOptions.success,
    (state: ApplicationState, { applicationOptions }) => ({
      ...state,
      mode: applicationOptions.usemode,
      language: applicationOptions.language ?? 'en',
      options: {
        ...state.options,
        showLoupe: applicationOptions.showLoupe ?? false,
        secondsPerLine: applicationOptions.secondsPerLine ?? 5,
        easyMode: applicationOptions.easymode ?? false,
        playOnHover: applicationOptions.playOnHofer ?? false,
        highlightingEnabled: applicationOptions.highlightingEnabled ?? false,
        audioSettings: applicationOptions.audioSettings ?? {
          volume: 1,
          speed: 1,
        },
      },
    })
  ),
  on(IDBActions.loadAnnotation.success, (state: ApplicationState) => ({
    ...state,
    idb: {
      ...state.idb,
      loaded: true,
    },
  })),
  on(
    AuthenticationActions.loginOnline.success,
    AuthenticationActions.loginDemo.success,
    AuthenticationActions.loginLocal.success,
    (state: ApplicationState, { mode }) => ({
      ...state,
      mode,
      loggedIn: true,
    })
  ),
  on(
    LoginModeActions.loginURLParameters,
    (state: ApplicationState, { urlParams }) => ({
      ...state,
      mode: LoginMode.URL,
      loggedIn: true,
      queryParams: urlParams,
    })
  ),
  on(ApplicationActions.setMode, (state: ApplicationState, { mode }) => ({
    ...state,
    mode,
  })),
  on(
    ApplicationActions.setLoggedIn,
    (state: ApplicationState, { loggedIn }) => ({
      ...state,
      loggedIn,
    })
  ),
  on(AuthenticationActions.logout.success, (state: ApplicationState) => {
    return {
      ...state,
      mode: undefined,
      queryParams: undefined,
      loggedIn: false,
    };
  }),
  on(
    ApplicationActions.setPlayOnHover,
    (state: ApplicationState, { playOnHover }) => ({
      ...state,
      options: {
        ...state.options,
        playOnHover,
      },
    })
  ),

  on(ApplicationActions.setAudioSettings, (state: ApplicationState, data) => ({
    ...state,
    options: {
      ...state.options,
      audioSettings: data,
    },
  })),
  on(
    ApplicationActions.setShowLoupe,
    (state: ApplicationState, { showLoupe }) => ({
      ...state,
      options: {
        ...state.options,
        showLoupe,
      },
    })
  ),
  on(
    ApplicationActions.setEasyMode,
    (state: ApplicationState, { easyMode }) => ({
      ...state,
      options: {
        ...state.options,
        easyMode,
      },
    })
  ),
  on(
    ApplicationActions.setSecondsPerLine,
    (state: ApplicationState, { secondsPerLine }) => ({
      ...state,
      options: {
        ...state.options,
        secondsPerLine,
      },
    })
  ),
  on(
    ApplicationActions.setHighlightingEnabled,
    (state: ApplicationState, { highlightingEnabled }) => ({
      ...state,
      options: {
        ...state.options,
        highlightingEnabled,
      },
    })
  ),
  on(ApplicationActions.waitForEffects.do, (state: ApplicationState) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.WAITING,
      progress: 50,
      errors: [],
    },
  })),
  on(AnnotationActions.loadAudio.do, (state: ApplicationState, { mode }) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.INITIALIZE,
      progress: 50,
      errors: [],
    },
  })),
  on(
    AnnotationActions.loadAudio.progress,
    (state: ApplicationState, { mode, value }) => {
      return {
        ...state,
        loading: {
          ...state.loading,
          status: LoadingStatus.LOADING,
          progress: 50 + Math.round(value * 50),
          errors: [],
        },
      };
    }
  ),
  on(
    AnnotationActions.loadAudio.success,
    (state: ApplicationState, { mode }) => ({
      ...state,
      loading: {
        ...state.loading,
        status: LoadingStatus.FINISHED,
        progress: 100,
        errors: [],
      },
    })
  ),
  on(
    AnnotationActions.loadAudio.fail,
    (state: ApplicationState, { error }) => ({
      ...state,
      loading: {
        ...state.loading,
        status: LoadingStatus.FAILED,
        errors: [error],
      },
    })
  )
);

function writeOptionToStore(
  state: ApplicationState,
  attribute: string,
  value: any
): ApplicationState {
  switch (attribute) {
    case 'version':
      return {
        ...state,
        idb: {
          ...state.idb,
          version: value,
        },
      };
    case 'language':
      return {
        ...state,
        language: value !== undefined ? value : 'en',
      };
    case 'usemode':
      return {
        ...state,
        mode: value,
      };
    case 'easymode':
      return {
        ...state,
        options: {
          ...state.options,
          easyMode: value !== undefined ? value : false,
        },
      };
    case 'showLoupe':
      return {
        ...state,
        options: {
          ...state.options,
          showLoupe: value !== undefined ? value : false,
        },
      };
    case 'secondsPerLine':
      return {
        ...state,
        options: {
          ...state.options,
          secondsPerLine: value !== undefined ? value : 5,
        },
      };
    case 'audioSettings':
      return {
        ...state,
        options: {
          ...state.options,
          audioSettings: {
            volume: value !== undefined ? value.volume : 1,
            speed: value !== undefined ? value.speed : 1,
          },
        },
      };
    case 'highlightingEnabled':
      return {
        ...state,
        options: {
          ...state.options,
          highlightingEnabled: value !== undefined ? value : false,
        },
      };
    default:
      return state;
  }
}
