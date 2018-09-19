export const enum SourceType {
  URL,
  FILE,
  ArrayBuffer
}

export const enum PlayBackState {
  PREPARE = 'PREPARE',
  INITIALIZED = 'INITIALIZED',
  STARTED = 'STARTED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ENDED = 'ENDED'
}

export * from './audio';
export * from './MediaRessource';
