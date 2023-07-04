import {
  AnnotationLevelType,
  ASRQueueItemType,
  ILevel,
  Level,
  OEvent,
  OIDBLevel,
  OItem,
  OLevel,
  OSegment,
} from '@octra/annotation';
import { SampleUnit } from '@octra/media';
import { ProjectDto, TaskDto } from '@octra/api-types';
import { AuthenticationState } from './authentication';
import { ApplicationState } from './application';
import { ASRState } from './asr';
import { UserState } from './user';
import { LocalModeState, OnlineModeState } from './annotation';

export enum LoginMode {
  URL = 'url',
  DEMO = 'demo',
  ONLINE = 'online',
  LOCAL = 'local',
}

export enum LoadingStatus {
  INITIALIZE = 'INITIALIZE',
  LOADING = 'LOADING',
  FAILED = 'FAILED',
  FINISHED = 'FINISHED',
}

export interface LoginData {
  userName: string;
  webToken: string;
  email?: string;
}

export interface CurrentProject {
  name: string;
  id: number;
  description: string;
  jobsLeft: number;
}

export interface SessionData {
  transcriptID: number;
  audioURL: string;
  promptText: string;
  serverComment: string;
  serverDataEntry: TaskDto;
  comment: string;
  submitted: boolean;
  feedback: any;
}

export interface OnlineSession {
  loginData: LoginData;
  currentProject?: ProjectDto;
  task?: TaskDto;
}

export interface URLParameters {
  audio: string;
  transcript: string;
  embedded: boolean;
  host: string;
}

export interface RootState {
  authentication: AuthenticationState;
  application: ApplicationState;
  asr: ASRState;
  onlineMode: OnlineModeState;
  demoMode: OnlineModeState;
  localMode: LocalModeState;
  user: UserState;
}

export interface AnnotationStateLevel {
  id: number;
  name: string;
  type: AnnotationLevelType;
  items: (OItem | AnnotationStateSegment | OEvent)[];
}

export class AnnotationStateSegment extends OSegment {
  public isBlockedBy: ASRQueueItemType;
  public progressInfo: { progress: number; statusLabel: string };
}

export function convertToLevelObject(
  stateLevel: AnnotationStateLevel,
  sampleRate: number,
  lastSample: SampleUnit
): Level {
  const level = Level.fromObj(
    {
      id: stateLevel.id,
      sortorder: undefined,
      level: new OLevel(stateLevel.name, stateLevel.type, stateLevel.items),
    },
    sampleRate,
    lastSample
  );

  // change further attributes
  for (const item of stateLevel.items) {
    if (stateLevel.type === AnnotationLevelType.SEGMENT) {
      const segment = item as AnnotationStateSegment;
      const annoSegment = level.segments.getByID(segment.id);

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
        console.error(`annoSegment with id ${segment.id} is undefined!`);
        console.log(level);
        console.log(stateLevel.items);
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
    items: oLevel.items.map((a, i) => {
      if (level.type === AnnotationLevelType.SEGMENT) {
        const segment = level.segments.get(i);
        return {
          ...a,
          isBlockedBy: segment.isBlockedBy,
          progressInfo: segment.progressInfo,
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

export function getModeState(appState: RootState) {
  switch (appState.application.mode) {
    case LoginMode.DEMO:
      return appState.demoMode;
    case LoginMode.LOCAL:
      return appState.localMode;
    case LoginMode.URL:
      return appState.onlineMode;
    case LoginMode.ONLINE:
      return appState.onlineMode;
  }

  return undefined;
}
