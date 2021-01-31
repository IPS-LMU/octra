import {IDataEntry} from '../obj/data-entry';
import {SessionFile} from '../obj/SessionFile';
import {
  AnnotationLevelType,
  ASRQueueItemType,
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

export interface OnlineSession {
  loginData: {
    id: string;
    project: string;
    jobNumber: number;
    password: string;
  },
  sessionData?: {
    dataID: number;
    audioURL: string;
    promptText: string;
    serverComment: string;
    jobsLeft: number;
    serverDataEntry: IDataEntry;
    comment: string;
  }
}

export interface URLParameters {
  audio: string;
  transcript: string;
  embedded: boolean;
  host: string;
}

export interface LoginState {
  mode?: LoginMode;
  files?: File[];
  onlineSession: OnlineSession,
  sessionFile?: SessionFile,
  queryParams?: URLParameters,
  loggedIn: boolean;
}

export interface ApplicationState {
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
}

export interface ASRState {
  selectedLanguage?: string;
  selectedService?: string;
}

export interface AnnotationState {
  levels: AnnotationStateLevel[];
  links: OIDBLink[];
  levelCounter: number;
}

export interface TranscriptionState {
  savingNeeded: boolean;
  isSaving: boolean;
  playOnHover: boolean;
  followPlayCursor: boolean;
  submitted: boolean;
  currentEditor?: string;
  showLoupe: boolean;
  audio: {
    loaded: boolean;
  }
  audioSettings: {
    volume: number;
    speed: number;
  },
  feedback: any;
  guidelines?: any;
  logs: any[];
  logging: boolean;
  easyMode: boolean;
  secondsPerLine: number;
  highlightingEnabled: boolean;
  projectConfig?: ProjectSettings;
  methods?: {
    validate: (string, any) => any;
    tidyUp: (string, any) => any;
  }
}

export interface UserState {
  name: string;
  email: string;
}

export interface RootState {
  application: ApplicationState,
  login: LoginState,
  asr: ASRState,
  transcription: TranscriptionState,
  annotation: AnnotationState,
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
}

export function convertToLevelObject(stateLevel: AnnotationStateLevel, sampleRate: number, lastSample: SampleUnit): Level {
  const level = Level.fromObj({
    id: stateLevel.id,
    sortorder: null,
    level: new OLevel(stateLevel.name, stateLevel.type, stateLevel.items)
  }, sampleRate, lastSample);

  // change further attributes
  for (const item of stateLevel.items) {
    console.log(`passiert heir wass????`);
    if (stateLevel.type === AnnotationLevelType.SEGMENT) {
      const segment = item as AnnotationStateSegment;
      level.segments.getByID(segment.id).isBlockedBy = ASRQueueItemType.ASR;
    }
  }

  return level;
}

export function convertToOIDBLevel(stateLevel: AnnotationStateLevel, sortorder: number): OIDBLevel {
  return {
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
}

export function convertFromLevelObject(level: Level, lastOriginalBoundary: SampleUnit): AnnotationStateLevel {
  const oLevel = level.getObj(lastOriginalBoundary);

  return {
    id: level.id,
    name: level.name,
    type: level.type,
    items: oLevel.items.map((a, i) => {
      if (level.type === AnnotationLevelType.SEGMENT) {
        return {
          ...a,
          isBlockedBy: level.segments.get(i).isBlockedBy
        }
      } else {
        return a;
      }
    })
  }
}

export function convertFromOIDLevel(oidbLevel: OIDBLevel): AnnotationStateLevel {
  return {
    id: oidbLevel.id,
    name: oidbLevel.level.name,
    type: oidbLevel.level.type,
    items: oidbLevel.level.items
  }
}
