import {pipe} from 'rxjs';
import {RootState} from '../index';

export const selectApplication = (state: RootState) => state.application;
export const selectLoadingStatus = pipe(selectApplication, (state) => state.loading.status);
export const selectReloaded = pipe(selectApplication, (state) => state.reloaded);
export const selectIDBLoaded = pipe(selectApplication, (state) => state.idb.loaded);
export const selectApplicationLanguage = pipe(selectApplication, (state) => state.language);
export const selectAppSettings = pipe(selectApplication, (state) => state.appConfiguration);

