import { pipe } from 'rxjs';
import { LoadingStatus, LoginMode, RootState } from '../index';
import { AppSettings } from '../../obj';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { IIDBApplicationOptions } from '../../shared/octra-database';

export const selectApplication = (state: RootState) => state.application;
export const selectLoadingStatus = pipe(
  selectApplication,
  (state) => state.loading.status
);
export const selectReloaded = pipe(
  selectApplication,
  (state) => state.reloaded
);
export const selectIDBLoaded = pipe(
  selectApplication,
  (state) => state.idb.loaded
);
export const selectLoggedIn = pipe(
  selectApplication,
  (state) => state.loggedIn
);
export const selectApplicationLanguage = pipe(
  selectApplication,
  (state) => state.language
);
export const selectAppSettings = pipe(
  selectApplication,
  (state) => state.appConfiguration
);

export interface URLParameters {
  audio: string;
  transcript: string;
  embedded: boolean;
  host: string;
}

export interface ApplicationState {
  initialized: boolean;
  mode?: LoginMode;
  shortcutsEnabled: boolean;
  loggedIn: boolean;
  loading: {
    status: LoadingStatus;
    progress: number;
    errors: string[];
  };
  reloaded: boolean;
  idb: {
    loaded: boolean;
    version?: number;
  };
  language: string;
  appConfiguration?: AppSettings;
  consoleEntries: ConsoleEntry[];
  options: IIDBApplicationOptions;
}
