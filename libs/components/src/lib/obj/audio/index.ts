export * from './AudioFormats';
export * from './audio-info';
export * from './audio-ressource';
export * from './audio-selection';
export * from './audio-time';
export * from './audio-time-calculator';

export const enum SourceType {
  URL,
  FILE,
  ArrayBuffer
}

export const enum PlayBackStatus {
  PREPARE = 'PREPARE',
  INITIALIZED = 'INITIALIZED',
  STARTED = 'STARTED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ENDED = 'ENDED'
}
