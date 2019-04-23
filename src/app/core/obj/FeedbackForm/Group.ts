import {Control} from './Control';

export class Group {
  public get title(): string {
    return this._title;
  }

  public get controls(): Control[] {
    return this._controls;
  }

  public get name(): string {
    return this._name;
  }

  private _required = false;

  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = value;
  }

  constructor(private _title: string, private _name: string, private _controls: Control[]) {

    // check if group is required
    for (let i = 0; i < _controls.length; i++) {
      if (_controls[i].required) {
        this.required = true;
        break;
      }
    }
  }

  public static fromAny(group: any): Group {
    const controls: Control[] = [];

    let required = false;
    for (let i = 0; i < group.controls.length; i++) {
      const control = group.controls[i];
      controls.push(Control.fromAny(control));
      if (control.required) {
        required = true;
      }
    }

    const result = new Group(
      group.title,
      (!(group.name === null || group.name === undefined)) ? group.name : group.controls[0].name,
      controls
    );

    result.required = required;

    return result;
  }

  public toAny(): any {
    const result = {
      title: this._title,
      controls: []
    };

    for (let i = 0; i < this._controls.length; i++) {
      const control = this._controls[i];
      result.controls.push(control.toAny());
    }

    return result;
  }
}
