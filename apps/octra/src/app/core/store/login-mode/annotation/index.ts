import {
  ASRContext,
  OctraAnnotation,
  OctraAnnotationSegment,
  OSegment,
  SegmentWithContext,
} from '@octra/annotation';
import { ProjectDto, TaskDto, TaskInputOutputDto } from '@octra/api-types';
import { OctraGuidelines } from '@octra/assets';
import { Histories, UndoRedoState } from 'ngrx-wieder';
import { pipe } from 'rxjs';
import { ProjectSettings } from '../../../obj';
import { FeedBackForm } from '../../../obj/FeedbackForm/FeedBackForm';
import { SessionFile } from '../../../obj/SessionFile';
import { ILog } from '../../../obj/Settings/logging';
import { getModeState, RootState } from '../../index';

export interface GuidelinesItem {
  filename: string;
  name: string;
  json: OctraGuidelines;
  type?: string;
}

export class AnnotationStateSegment<
  T extends ASRContext,
> extends OctraAnnotationSegment<T> {
  static override deserialize<T extends ASRContext>(
    jsonObject: SegmentWithContext<T>,
  ): AnnotationStateSegment<T> {
    return new AnnotationStateSegment(
      jsonObject.id,
      jsonObject.time,
      jsonObject.labels,
      jsonObject.context!,
    );
  }

  override serializeToOSegment(sampleStart: number): OSegment {
    return new OSegment(
      this.id,
      sampleStart,
      this.time.samples - sampleStart,
      this.labels,
    );
  }
}

export interface AnnotationState extends UndoRedoState {
  // defines if saving the annotation is going to be running
  savingNeeded: boolean;
  // defines if the annotation is currently saving
  isSaving: boolean;
  // the current Editor
  currentEditor?: string;
  // options set by the user on import
  importOptions?: Record<string, any>;
  // the converter used for importing the transcript
  importConverter?: string;
  // selected level of a previous session
  previousCurrentLevel?: number;
  // the data for the current session
  currentSession: AnnotationSessionState;
  previousSession?: {
    task: {
      id: string;
    };
    project: {
      id: string;
    };
  };
  sessionFile?: SessionFile;
  // information about the audio file
  audio: {
    loaded: boolean;
    fileName: string;
    sampleRate: number;
    file?: TaskInputOutputDto; // TODO <- add audio file here
  };
  guidelines?: {
    selected?: GuidelinesItem;
    list: GuidelinesItem[];
  };
  logging: {
    enabled: boolean;
    logs: ILog[];
    startTime?: number;
    startReference?: ILog;
  };
  projectConfig?: ProjectSettings;
  methods?: {
    validate: (transcript: string, guidelines: any) => any;
    tidyUp: (transcript: string, guidelines: any) => any;
  };
  transcript: OctraAnnotation<ASRContext, OctraAnnotationSegment<ASRContext>>; // TODO move transcript to current session
  histories: Histories;
}

export interface AnnotationSessionState {
  status?: 'processing' | 'sending';
  loadFromServer?: boolean;
  currentProject?: ProjectDto;
  task?: TaskDto;
  feedback?: FeedBackForm;
  assessment?: any;
  comment?: string;
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
  (state) => state?.audio.loaded,
);
export const selectProjectConfig = pipe(
  selectAnnotation,
  (state) => state?.projectConfig,
);
export const selectGuideLines = pipe(
  selectAnnotation,
  (state) => state?.guidelines,
);
export const selectMethods = pipe(selectAnnotation, (state) => state?.methods);
export const selectAnnotationLevels = pipe(
  selectAnnotation,
  (state) => state?.transcript.levels,
);
export const selectAnnotationLinks = pipe(
  selectAnnotation,
  (state) => state?.transcript.links,
);
