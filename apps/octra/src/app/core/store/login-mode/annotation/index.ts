import { pipe } from 'rxjs';
import { getModeState, RootState } from '../../index';
import { Histories, UndoRedoState } from 'ngrx-wieder';
import { ILog } from '../../../obj/Settings/logging';
import { ProjectSettings } from '../../../obj';
import { ProjectDto, TaskDto, TaskInputOutputDto } from '@octra/api-types';
import {
  AnnotationLevelType,
  ASRQueueItemType,
  ILevel,
  Level,
  OEvent,
  OIDBLevel,
  OIDBLink,
  OItem,
  OLevel,
  OSegment,
} from '@octra/annotation';
import { SampleUnit } from '@octra/media';

export interface GuidelinesItem {
  filename: string;
  name: string;
  json: any;
  type?: string;
}

export interface AnnotationState extends UndoRedoState {
  savingNeeded: boolean;
  isSaving: boolean;
  currentEditor?: string;
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
  logs: ILog[];
  logging: boolean;
  projectConfig?: ProjectSettings;
  methods?: {
    validate: (transcript: string, guidelines: any) => any;
    tidyUp: (transcript: string, guidelines: any) => any;
  };
  transcript: TranscriptionState;
  histories: Histories;
  currentSession: AnnotationSessionState;
  previousSession?: {
    task: {
      id: string;
    };
    project: {
      id: string;
    };
  };
  sessionFile?: any;
}

export interface AnnotationSessionState {
  loadFromServer?: boolean;
  currentProject?: ProjectDto;
  task?: TaskDto;
  assessment?: any;
  comment?: string;
}

export interface AnnotationStateLevel {
  id: number;
  name: string;
  type: AnnotationLevelType;
  items: (OItem | AnnotationStateSegment | OEvent)[];
}

export class AnnotationStateSegment extends OSegment {
  public isBlockedBy?: ASRQueueItemType;
  public progressInfo?: { progress: number; statusLabel: string };
}

export function convertStateLevelToLevelObject(
  stateLevel: AnnotationStateLevel,
  sampleRate: number,
  lastSample: SampleUnit
): Level {
  const level = Level.fromObj(
    {
      id: stateLevel.id,
      sortorder: undefined as any,
      level: new OLevel(stateLevel.name, stateLevel.type, stateLevel.items),
    },
    sampleRate,
    lastSample
  );

  // change further attributes
  for (const item of stateLevel.items) {
    if (stateLevel.type === AnnotationLevelType.SEGMENT) {
      const segment = item as AnnotationStateSegment;
      const annoSegment = level.segments.find(a => a.id === segment.id);

      if (annoSegment !== undefined) {
        annoSegment.isBlockedBy = segment.isBlockedBy;
        if (segment.progressInfo !== undefined) {
          annoSegment.progressInfo = segment.progressInfo;
        } else {
          annoSegment.progressInfo = {
            statusLabel: 'ASR',
            progress: 0,
          };
        }
      } else {
        console.error(`can't find segment id ${segment.id}`)
      }
    }
  }

  return level;
}

export function convertToOIDBLevel(
  stateLevel: AnnotationStateLevel,
  sortorder: number
): OIDBLevel {
  const result = {
    id: stateLevel.id,
    sortorder,
    level: new OLevel(
      stateLevel.name,
      stateLevel.type,
      stateLevel.items.map((a) => {
        if (stateLevel.type === AnnotationLevelType.SEGMENT) {
          const segment = a as AnnotationStateSegment;
          return new OSegment(
            segment.id,
            segment.sampleStart,
            segment.sampleDur,
            segment.labels
          );
        } else {
          return a;
        }
      })
    ),
  };

  return result;
}

export function convertFromLevelObject(
  level: Level,
  lastOriginalBoundary: SampleUnit
): AnnotationStateLevel {
  const oLevel = level.getObj(lastOriginalBoundary);

  const result = {
    id: level.id,
    name: level.name,
    type: level.type,
    items: oLevel!.items.map((a, i) => {
      if (level.type === AnnotationLevelType.SEGMENT) {
        const segment = level.segments[i];
        return {
          ...a,
          isBlockedBy: segment!.isBlockedBy,
          progressInfo: segment!.progressInfo,
        };
      } else {
        return a;
      }
    }),
  };

  return result;
}

export function convertFromOIDLevel(
  level: ILevel,
  id: number
): AnnotationStateLevel {
  const result = {
    id,
    name: level.name,
    type: level.type,
    items: level.items,
  };

  return result;
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
