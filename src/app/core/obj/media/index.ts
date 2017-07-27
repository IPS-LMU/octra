export * from './MediaRessource';

export const enum SourceType {
  URL,
  FILE,
  ArrayBuffer
}

export const enum PlayBackState {
  PREPARE,
  INITIALIZED,
  STARTED,
  PLAYING,
  PAUSED,
  STOPPED,
  ENDED
}
