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
  OSegment
} from '@octra/annotation';
import {ConsoleEntry} from '../shared/service/bug-report.service';
import {AppSettings, ProjectSettings} from '../obj/Settings';
import {SampleUnit} from '@octra/media';
import {ILog} from '../obj/Settings/logging';
import {Histories, UndoRedoState} from 'ngrx-wieder';
import {SessionFile} from '../obj/SessionFile';
import {AnnotationStartResponseDataItem} from '@octra/db';

export enum LoginMode {
  URL = 'url',
  DEMO = 'demo',
  ONLINE = 'online',
  LOCAL = 'local'
}

export enum LoadingStatus {
  INITIALIZE = 'INITIALIZE',
  LOADING = 'LOADING',
  FAILED = 'FAILED',
  FINISHED = 'FINISHED'
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
  serverDataEntry: AnnotationStartResponseDataItem;
  comment: string;
  submitted: boolean;
  feedback: any;
}

export interface OnlineSession {
  loginData: LoginData;
  currentProject?: CurrentProject;
  sessionData?: SessionData;
}

export interface URLParameters {
  audio: string;
  transcript: string;
  embedded: boolean;
  host: string;
}

export interface ApplicationState {
  mode?: LoginMode;
  queryParams?: URLParameters,
  loggedIn: boolean;
  loading: {
    status: LoadingStatus;
    progress: number;
    errors: string[]
  };
  reloaded: boolean;
  idb: {
    loaded: boolean;
    version?: number;
  },
  language: string;
  appConfiguration: AppSettings;
  consoleEntries: ConsoleEntry[];
  options: {
    playOnHover: boolean;
    followPlayCursor: boolean;
    showLoupe: boolean;
    audioSettings: {
      volume: number;
      speed: number;
    },
    easyMode: boolean;
    secondsPerLine: number;
    highlightingEnabled: boolean;
  };
}

export interface ASRState {
  selectedLanguage?: string;
  selectedService?: string;
}

export interface AnnotationState extends UndoRedoState {
  savingNeeded: boolean;
  isSaving: boolean;
  currentEditor?: string;
  audio: {
    loaded: boolean;
    fileName: string;
    sampleRate: number;
  }
  guidelines?: any;
  logs: ILog[];
  logging: boolean;
  projectConfig?: ProjectSettings;
  methods?: {
    validate: ((transcript: string, guidelines: any) => any);
    tidyUp: ((transcript: string, guidelines: any) => any);
  }
  transcript: TranscriptionState;
  histories: Histories;
  onlineSession?: any;
  files?: any;
  sessionFile?: any;
}

export interface OnlineModeState extends AnnotationState {
  onlineSession: OnlineSession,
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

export interface UserState {
  name: string;
  email: string;
}

export interface RootState {
  application: ApplicationState,
  asr: ASRState,
  onlineMode: OnlineModeState,
  demoMode: OnlineModeState,
  localMode: LocalModeState,
  user: UserState
}

export interface AnnotationStateLevel {
  id: number;
  name: string;
  type: AnnotationLevelType;
  items: (OItem | AnnotationStateSegment | OEvent)[];
}

export class AnnotationStateSegment extends OSegment {
  public isBlockedBy: ASRQueueItemType;
  public progressInfo: { progress: number; statusLabel: string }
}

export function
convertToLevelObject(stateLevel: AnnotationStateLevel, sampleRate: number, lastSample: SampleUnit): Level {
  const level = Level.fromObj({
    id: stateLevel.id,
    sortorder: undefined,
    level: new OLevel(stateLevel.name, stateLevel.type, stateLevel.items)
  }, sampleRate, lastSample);

  // change further attributes
  for (const item of stateLevel.items) {
    if (stateLevel.type === AnnotationLevelType.SEGMENT) {
      const segment = item as AnnotationStateSegment;
      const annoSegment = level.segments.getByID(segment.id)

      if (annoSegment !== undefined) {
        annoSegment.isBlockedBy = segment.isBlockedBy;
        if (segment.progressInfo !== undefined) {
          annoSegment.progressInfo = segment.progressInfo;
        } else {
          annoSegment.progressInfo = {
            statusLabel: 'ASR',
            progress: 0
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

export function convertToOIDBLevel(stateLevel: AnnotationStateLevel, sortorder: number): OIDBLevel {
  const result = {
    id: stateLevel.id,
    sortorder,
    level: new OLevel(stateLevel.name, stateLevel.type, stateLevel.items.map((a) => {
      if (stateLevel.type === AnnotationLevelType.SEGMENT) {
        const segment = a as AnnotationStateSegment;
        return new OSegment(segment.id, segment.sampleStart, segment.sampleDur, segment.labels);
      } else {
        return a;
      }
    }))
  };

  return result;
}

export function convertFromLevelObject(level: Level, lastOriginalBoundary: SampleUnit): AnnotationStateLevel {
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
          progressInfo: segment.progressInfo
        }
      } else {
        return a;
      }
    })
  }

  return result;
}

export function convertFromOIDLevel(level: ILevel, id: number): AnnotationStateLevel {
  const result = {
    id,
    name: level.name,
    type: level.type,
    items: level.items
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
