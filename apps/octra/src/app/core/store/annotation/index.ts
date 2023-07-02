import { pipe } from 'rxjs';
import { getModeState, RootState } from '../index';

export const selectAnnotation = (state: RootState) => {
  const mode = getModeState(state);
  if (mode) {
    return mode;
  }

  return undefined;
};
export const selectAudioLoaded = pipe(
  selectAnnotation,
  (state) => state?.audio.loaded
);
export const selectProjectConfig = pipe(
  selectAnnotation,
  (state) => state?.projectConfig
);
export const selectGuideLines = pipe(
  selectAnnotation,
  (state) => state?.guidelines
);
export const selectMethods = pipe(selectAnnotation, (state) => state?.methods);
export const selectAnnotationLevels = pipe(
  selectAnnotation,
  (state) => state?.transcript.levels
);
export const selectAnnotationLinks = pipe(
  selectAnnotation,
  (state) => state?.transcript.links
);
