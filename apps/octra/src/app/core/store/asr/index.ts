import { ASRSettings, ServiceProvider } from '../../obj';

export interface ASRStateSettings {
  selectedServiceProvider?: ServiceProvider;
  selectedASRLanguage?: string;
  selectedMausLanguage?: string;
  accessCode?: string;
}

export enum ASRQueueItemType {
  ASR = 'ASR',
  ASRMAUS = 'ASRMAUS',
  MAUS = 'MAUS',
}

export enum ASRProcessStatus {
  IDLE = 'IDLE',
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  NOQUOTA = 'NOQUOTA',
  NOAUTH = 'NOAUTH',
  FAILED = 'FAILED',
  FINISHED = 'FINISHED',
}

export interface ASRTimeInterval {
  sampleStart: number;
  sampleLength: number;
}

export interface ASRStateQueueItem {
  id: number;
  time: ASRTimeInterval;
  selectedMausLanguage?: string;
  selectedASRLanguage: string;
  selectedASRService: ServiceProvider;
  accessCode?: string;
  type: ASRQueueItemType;
  progress: number;
  status: ASRProcessStatus;
  transcriptInput?: string;
  result?: string;
  sampleRate?: number;
}

export interface ASRStateQueueStatistics {
  running: number;
  stopped: number;
  failed: number;
  finished: number;
}

export interface ASRStateQueue {
  idCounter: number;
  status: ASRProcessStatus;
  statistics: ASRStateQueueStatistics;
  items: ASRStateQueueItem[];
}

export interface ASRState {
  settings?: ASRStateSettings;
  languageSettings?: ASRSettings;
  asrLanguages?: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[];
  mausLanguages?: {
    value: string;
    description: string;
  }[];
  asrAuthCode?: string;
  isEnabled?: boolean;
  queue?: ASRStateQueue;
}

export interface ASRStateProcessOptions {
  asr: boolean;
  wordAlignment: boolean;
}
