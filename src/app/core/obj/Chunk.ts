import {AVSelection} from './AVSelection';

export class Chunk {
  get selection(): any {
    return this._selection;
  }

  set selection(value: any) {
    this._selection = value;
  }

  private _selection: AVSelection = null;
  private _time: AVSelection = null;

  get time(): AVSelection {
    return this._time;
  }

  set time(value: AVSelection) {
    this._time = value;
  }

  constructor(time: AVSelection, selection?: AVSelection) {
    if (time && time.start && time.end) {
      this.time = time.clone();
    } else {
      throw new Error('Chunk constructor needs two correct AudioTime objects');
    }

    if (selection) {
      this._selection = selection;
    }
  }
}
