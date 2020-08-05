import {IDataEntry} from '../obj/data-entry';

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
}

export interface URLParameters {
  audio: string;
  transcript: string;
  embedded: string;
  host: string;
}

export interface LoginState {
  mode?: LoginMode;
  files?: File[];
  onlineSession?: OnlineSession,
  sessionFile?: {
    type: string;
    name: string;
    size: number;
  },
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
  }
}

export interface ASRState {
  selectedLanguage?: string;
  selectedService?: string;
}

export interface TranscriptionState {
  savingNeeded: boolean;
  isSaving: boolean;
  playOnHover: boolean;
  followPlayCursor: boolean;
  submitted: boolean;
  currentEditor?: string;
  audioSettings: {
    volume: number;
    speed: number;
  },
  logs: any[];
}

export interface FeedbackState {
  user: {
    name: string;
    email: string;
  }
}

export interface RootState {
  application: ApplicationState,
  login: LoginState,
  asr: ASRState,
  transcription: TranscriptionState,
  feedback: FeedbackState
}
