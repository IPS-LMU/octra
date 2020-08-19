import {RootState} from '../index';
import {pipe} from 'rxjs';

export const selectApplication = (state: RootState) => state.application;
export const selectLoadingStatus = pipe(selectApplication, (state) => state.loading.status);
export const selectReloaded = pipe(selectApplication, (state) => state.reloaded);
export const selectIDBLoaded = pipe(selectApplication, (state) => state.idb.loaded);
export const selectApplicationLanguage = pipe(selectApplication, (state) => state.language);
export const selectAppSettingsLoaded = pipe(selectApplication, (state) => state.appConfiguration);

