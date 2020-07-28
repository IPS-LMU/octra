import {LoginState, RootState} from '../index';
import {pipe} from 'rxjs';

const selectApplication = (state: RootState) => state.application;
export const selectLoadingStatus = pipe(selectApplication, (state) => state.loading.status);
export const selectCurrentEditor = pipe(selectApplication, (state) => state.currentEditor);
export const selectAudioVolume = pipe(selectApplication, (state) => state.audioSettings.volume);
export const selectAudioSpeed = pipe(selectApplication, (state) => state.audioSettings.speed);

