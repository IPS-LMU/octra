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

export function getPlayBackString(state: PlayBackState) {
  switch (state) {
    case(PlayBackState.PREPARE):
      return 'PREPARE';
    case(PlayBackState.INITIALIZED):
      return 'INITIALIZED';
    case(PlayBackState.STARTED):
      return 'STARTED';
    case(PlayBackState.PLAYING):
      return 'PLAYING';
    case(PlayBackState.PAUSED):
      return 'PAUSED';
    case(PlayBackState.STOPPED):
      return 'STOPPED';
    case(PlayBackState.ENDED):
      return 'ENDED';
  }
}

export * from './audio';
export * from './MediaRessource';
