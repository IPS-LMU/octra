import {Control} from './Control';

export class Group {
  set required(value: boolean) {
    this._required = value;
  }

  get required(): boolean {
    return this._required;
  }

  public get title(): string {
    return this._title;
  }

  private _required = false;

  public get controls(): Control[] {
    return this._controls;
  }

  public static fromAny(group: any): Group {
    const controls: Control[] = [];

    let result: Group = null;
    let required = false;
    for (let i = 0; i < group.controls.length; i++) {
      const control = group.controls[i];
      controls.push(Control.fromAny(control));
      if (control.required) {
        required = true;
      }
    }

    result = new Group(
      group.title,
      controls
    );

    result.required = required;

    return result;
  }

  constructor(private _title: string, private _controls: Control[]) {

    // check if group is required
    for (let i = 0; i < _controls.length; i++) {
      if (_controls[i].required) {
        this.required = true;
        break;
      }
    }
  }

  public toAny(): any {
    const result = {
      title: this._title
    };

    result['controls'] = [];
    for (let i = 0; i < this._controls.length; i++) {
      const control = this._controls[i];
      result['controls'].push(control.toAny());
    }

    return result;
  }
}
