import {RootState} from '../index';
import {pipe} from 'rxjs';

const selectTranscription = (state: RootState) => state.transcription;
export const selectSavingNeeded = pipe(selectTranscription, (state) => state.savingNeeded);
export const selectIsSaving = pipe(selectTranscription, (state) => state.isSaving);
export const selectSubmitted = pipe(selectTranscription, (state) => state.submitted);
export const selectPlayOnHover = pipe(selectTranscription, (state) => state.playOnHover);
export const selectCurrentEditor = pipe(selectTranscription, (state) => state.currentEditor);
export const selectAudioVolume = pipe(selectTranscription, (state) => state.audioSettings.volume);
export const selectAudioSpeed = pipe(selectTranscription, (state) => state.audioSettings.speed);
export const selectFollowPlayCursor = pipe(selectTranscription, (state) => state.followPlayCursor);
export const selectLogs = pipe(selectTranscription, (state) => state.logs);
export const selectProjectConfig = pipe(selectTranscription, (state) => state.projectConfig);
export const selectGuideLines = pipe(selectTranscription, (state) => state.guidelines);
export const selectMethods = pipe(selectTranscription, (state) => state.methods);
export const selectAudioLoaded = pipe(selectTranscription, (state) => state.audio.loaded);
