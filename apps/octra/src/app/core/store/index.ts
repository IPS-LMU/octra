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
  loggedIn: boolean;
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
  queryParams?: URLParameters
}

export interface ApplicationState {
  loading: {
    status: LoadingStatus;
    progress: number;
    errors: string[]
  };
  currentEditor?: string;
  audioSettings: {
    volume: number;
    speed: number;
  }
}

export interface ASRState {
  selectedLanguage?: string;
  selectedService?: string;
}

export interface TranscriptionState {
  savingNeeded: boolean;
  isSaving: boolean;
}

export interface RootState {
  application: ApplicationState,
  login: LoginState,
  asr: ASRState,
  transcription: TranscriptionState
}
