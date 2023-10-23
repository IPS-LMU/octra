import { AuthenticationState } from './authentication';
import { ApplicationState } from './application';
import { ASRState } from './asr';
import { UserState } from './user';
import { AnnotationState } from './login-mode/annotation';

export enum LoginMode {
  URL = 'url',
  DEMO = 'demo',
  ONLINE = 'online',
  LOCAL = 'local',
}

export enum LoadingStatus {
  INITIALIZE = 'INITIALIZE',
  WAITING = 'WAITING',
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

export interface RootState {
  authentication: AuthenticationState;
  application: ApplicationState;
  asr: ASRState;
  onlineMode: AnnotationState;
  demoMode: AnnotationState;
  localMode: AnnotationState;
  urlMode: AnnotationState;
  user: UserState;
}

export function getModeState(appState: RootState) {
  switch (appState.application.mode) {
    case LoginMode.DEMO:
      return appState.demoMode;
    case LoginMode.LOCAL:
      return appState.localMode;
    case LoginMode.URL:
      return appState.urlMode;
    case LoginMode.ONLINE:
      return appState.onlineMode;
  }

  return undefined;
}
