import { pipe } from 'rxjs';
import { AppSettings } from '../../obj';
import { IIDBApplicationOptions } from '../../shared/octra-database';
import {
  ConsoleEntry,
  ConsoleGroupEntry,
} from '../../shared/service/bug-report.service';
import { LoadingStatus, LoginMode, RootState } from '../index';

export const selectApplication = (state: RootState) => state.application;
export const selectLoadingStatus = pipe(
  selectApplication,
  (state) => state.loading.status,
);
export const selectReloaded = pipe(
  selectApplication,
  (state) => state.reloaded,
);
export const selectIDBLoaded = pipe(
  selectApplication,
  (state) => state.idb.loaded,
);
export const selectLoggedIn = pipe(
  selectApplication,
  (state) => state.loggedIn,
);
export const selectApplicationLanguage = pipe(
  selectApplication,
  (state) => state.language,
);
export const selectAppSettings = pipe(
  selectApplication,
  (state) => state.appConfiguration,
);

export interface URLParameters {
  audio_url?: string;
  audio_name?: string;
  audio_type?: string;
  auto_playback?: boolean;
  annotationExportType?: string;
  host?: string;
  transcript?: string;
  readonly?: boolean;
  embedded?: boolean;
  bottomNav?: boolean;
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
  consoleEntries: (ConsoleEntry | ConsoleGroupEntry)[];
  options: IIDBApplicationOptions;
}
