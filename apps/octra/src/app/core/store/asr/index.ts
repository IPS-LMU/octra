import { ASRLanguage, ASRService } from '../../obj';

export interface ASRStateSettings {
  selectedLanguage?: string;
  selectedService?: string;
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
  RUNNING = 'RUNNING',
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
  selectedLanguage: ASRLanguage;
  selectedASRInfo: ASRService;
  type: ASRQueueItemType;
  progress: number;
  status: ASRProcessStatus;
  transcriptInput?: string;
  result?: string;
  sampleRate?: number;
}

export interface ASRStateQueueStatistics {
  running: number,
  stopped: number,
  failed: number,
  finished: number,
}

export interface ASRStateQueue {
  idCounter: number;
  status: ASRProcessStatus;
  statistics: ASRStateQueueStatistics;
  items: ASRStateQueueItem[];
}

export interface ASRState {
  settings?: ASRStateSettings;
  queue?: ASRStateQueue;
}

export interface ASRStateProcessOptions {
  asr: boolean;
  wordAlignment: boolean;
}
