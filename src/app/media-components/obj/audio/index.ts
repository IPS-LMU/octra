export * from './AudioFormats';
export * from './AudioInfo';
export * from './AudioRessource';
export * from './AudioSelection';
export * from './AudioTime';
export * from './AudioTimeCalculator';

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
