export const enum PlayBackStatus {
  PREPARE = 'PREPARE',
  INITIALIZED = 'INITIALIZED',
  STARTED = 'STARTED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ENDED = 'ENDED',
}

export interface NumeratedSegment {
  number: number;
  sampleStart: number;
  sampleDur: number;
}
