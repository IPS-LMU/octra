import {AudioTime} from './AudioTime';
import {Line} from './Line';

/**
 * class needed to determine mouse position in audioviewer compnents
 */
export class AVMousePos {
  get timePos(): AudioTime {
    return this._timepos;
  }

  set timePos(value: AudioTime) {
    this._timepos = value;
  }

  get relPos(): any {
    return this._relPos;
  }

  set relPos(value: any) {
    this._relPos = value;
  }

  get absX(): number {
    return this._absX;
  }

  set absX(value: number) {
    this._absX = value;
  }

  get line(): Line {
    return this._line;
  }

  set line(value: Line) {
    this._line = value;
  }

  private _timepos: AudioTime;

  // relative Position related to line number
  private _relPos: any = {
    x: 0,
    y: 0
  };

  private _absX = 0;
  private _line: Line = null;

  /**
   * initializes AVMousePos. time_pos will be cloned.
   * @param x relative Position
   * @param y relative Position
   * @param absX absolute posiiton
   * @param time_pos - AudioTime
   */
  constructor(x: number, y: number, absX: number, time_pos: AudioTime) {
    if (time_pos) {
      this._timepos = time_pos.clone();
    }

    this._relPos.x = x;
    this._relPos.y = y;
    this._absX = absX;
  }
}
