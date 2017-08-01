import {Label} from './Label';
import {ControlType} from './ControlType';

export class Control {

  public get value(): string {
    return this._value;
  }

  public set value(value: string) {
    this._value = value;
  }

  public get label(): Label {
    return this._label;
  }

  public get required(): boolean {
    return this._required;
  }

  public get type(): ControlType {
    return this._type;
  }

  public get custom(): any {
    return this._custom;
  }

  public set custom(value: any) {
    this._custom = value;
  }

  public static fromAny(control: any): Control {
    return new Control(
      control.value,
      new Label(control.label),
      control.required,
      new ControlType(control.type),
      control.custom
    );
  }

  constructor(private _value: string,
              private _label: Label,
              private _required: boolean,
              private _type: ControlType,
              private _custom: any) {
  }

  public toAny(): any {
    return {
      value: this._value,
      label: this._label,
      required: this._required,
      type: this._type.type,
      custom: this._custom
    };
  }
}
