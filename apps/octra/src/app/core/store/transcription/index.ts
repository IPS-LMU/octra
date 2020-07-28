import {RootState} from '../index';
import {pipe} from 'rxjs';

const selectTranscription = (state: RootState) => state.transcription;
export const selectSavingNeeded = pipe(selectTranscription, (state) => state.savingNeeded);
export const selectIsSaving = pipe(selectTranscription, (state) => state.isSaving);

