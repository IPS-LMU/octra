import {SampleUnit} from './AudioTime';

/**
 * class needed to determine mouse position in audioviewer compnents
 */
export class AVMousePos {
  private _timepos: SampleUnit;

  /**
   * initializes AVMousePos. timePos will be cloned.
   * @param x relative Position
   * @param y relative Position
   * @param absX absolute posiiton
   * @param timePos - BrowserAudioTime
   */
  constructor(x: number, y: number, timePos: SampleUnit) {
    if (timePos) {
      this._timepos = timePos.clone();
    }
  }

  get timePos(): SampleUnit {
    return this._timepos;
  }

  set timePos(value: SampleUnit) {
    this._timepos = value;
  }
}
