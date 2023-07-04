import { createReducer, on } from '@ngrx/store';
import { LoadingStatus, LoginMode } from '../index';
import { ApplicationActions } from './application.actions';
import { ConfigurationActions } from '../configuration/configuration.actions';
import { IDBActions } from '../idb/idb.actions';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { AnnotationActions } from '../annotation/annotation.actions';
import { LocalModeActions } from '../modes/local-mode/local-mode.actions';
import { ApplicationState } from './index';
import { AuthenticationActions } from '../authentication';

export const initialState: ApplicationState = {
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
  appConfiguration: undefined,
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
    ApplicationActions.initApplication.success,
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
        status:
          state.loading.progress === 75
            ? LoadingStatus.FINISHED
            : LoadingStatus.LOADING,
        progress: state.loading.progress + 25,
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
    IDBActions.loadOptionsSuccess,
    (state: ApplicationState, { applicationOptions }) => {
      let result = state;

      for (const option of applicationOptions) {
        result = writeOptionToStore(result, option.name, option.value);
      }

      return result;
    }
  ),
  on(ConfigurationActions.loadGuidelinesSuccess, (state: ApplicationState) => ({
    ...state,
    loading: {
      ...state.loading,
      status:
        state.loading.progress === 75
          ? LoadingStatus.FINISHED
          : LoadingStatus.LOADING,
      progress: state.loading.progress + 25,
    },
  })),
  on(
    ConfigurationActions.projectConfigurationLoaded,
    (state: ApplicationState) => ({
      ...state,
      loading: {
        ...state.loading,
        status:
          state.loading.progress === 75
            ? LoadingStatus.FINISHED
            : LoadingStatus.LOADING,
        progress: state.loading.progress + 25,
      },
    })
  ),
  on(ConfigurationActions.loadMethodsSuccess, (state: ApplicationState) => ({
    ...state,
    loading: {
      ...state.loading,
      status:
        state.loading.progress === 75
          ? LoadingStatus.FINISHED
          : LoadingStatus.LOADING,
      progress: state.loading.progress + 25,
    },
  })),
  on(IDBActions.loadAnnotationSuccess, (state: ApplicationState) => ({
    ...state,
    idb: {
      ...state.idb,
      loaded: true,
    },
  })),
  on(OnlineModeActions.readLoginData, (state: ApplicationState) => ({
    ...state,
    mode: LoginMode.ONLINE,
    loggedIn: true,
  })),
  on(LocalModeActions.login, (state: ApplicationState) => ({
    ...state,
    mode: LoginMode.LOCAL,
    loggedIn: true,
  })),
  on(
    OnlineModeActions.loginURLParameters,
    (state: ApplicationState, { urlParams }) => ({
      ...state,
      mode: LoginMode.URL,
      loggedIn: true,
      queryParams: urlParams,
    })
  ),
  on(OnlineModeActions.loginDemo, (state: ApplicationState, { mode }) => ({
    ...state,
    mode: LoginMode.DEMO,
    loggedIn: true,
  })),
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
  on(AnnotationActions.loadAudio.do, (state: ApplicationState, { mode }) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.INITIALIZE,
      progress: 0,
      errors: [],
    },
  })),
  on(
    AnnotationActions.loadAudio.progress,
    (state: ApplicationState, { mode, value }) => ({
      ...state,
      loading: {
        ...state.loading,
        status: LoadingStatus.LOADING,
        progress: Math.round(value * 100),
        errors: [],
      },
    })
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
