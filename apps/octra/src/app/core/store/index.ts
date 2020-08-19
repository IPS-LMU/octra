import {IDataEntry} from '../obj/data-entry';
import {SessionFile} from '../obj/SessionFile';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {ConsoleEntry} from '../shared/service/bug-report.service';

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
  id: string;
  project: string;
  jobNumber: number;
  dataID: number;
  audioURL: string;
  promptText: string;
  serverComment: string;
  jobsLeft: number;
  serverDataEntry: IDataEntry;
  comment: string;
  password: string;
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
  onlineSession?: OnlineSession,
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
  },
  language: string;
  version: string;
  appConfiguration: boolean;
  consoleEntries: ConsoleEntry[];
}

export interface ASRState {
  selectedLanguage?: string;
  selectedService?: string;
}

export interface AnnotationState {
  levels: OIDBLevel[];
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
  audioSettings: {
    volume: number;
    speed: number;
  },
  feedback: any;
  annotation: AnnotationState;
  guidelines?: any;
  logs: any[];
  logging: boolean;
  easyMode: boolean;
  secondsPerLine: number;
  highlightingEnabled: boolean;
  projectConfig?: any;
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
  user: UserState
}
