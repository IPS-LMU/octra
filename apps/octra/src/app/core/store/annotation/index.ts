import { pipe } from 'rxjs';
import {
  AnnotationStateLevel,
  getModeState,
  OnlineSession,
  RootState,
} from '../index';
import { Histories, UndoRedoState } from 'ngrx-wieder';
import { ILog } from '../../obj/Settings/logging';
import { ProjectSettings } from '../../obj';
import { TaskDto } from '@octra/api-types';
import { SessionFile } from '../../obj/SessionFile';
import { OIDBLink } from '@octra/annotation';

export interface AnnotationState extends UndoRedoState {
  savingNeeded: boolean;
  isSaving: boolean;
  currentEditor?: string;
  audio: {
    loaded: boolean;
    fileName: string;
    sampleRate: number;
  };
  guidelines?: any;
  logs: ILog[];
  logging: boolean;
  projectConfig?: ProjectSettings;
  methods?: {
    validate: (transcript: string, guidelines: any) => any;
    tidyUp: (transcript: string, guidelines: any) => any;
  };
  transcript: TranscriptionState;
  histories: Histories;
  onlineSession?: any;
  files?: any;
  sessionFile?: any;
  changedTask?: TaskDto;
}

export interface OnlineModeState extends AnnotationState {
  onlineSession: OnlineSession;
}

export interface LocalModeState extends AnnotationState {
  files?: any[];
  sessionFile?: SessionFile;
}

export interface TranscriptionState {
  levels: AnnotationStateLevel[];
  links: OIDBLink[];
  levelCounter: number;
}

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
