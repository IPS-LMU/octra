import {Group} from './Group';
import {Control} from './Control';
import {isNullOrUndefined} from 'util';
import {isArray} from 'rxjs/util/isArray';

export class FeedBackForm {
  set required(value: boolean) {
    this._required = value;
  }

  get required(): boolean {
    return this._required;
  }

  public get groups(): Group[] {
    return this._groups;
  }

  public get comment() {
    return this._comment;
  }

  public set comment(value: string) {
    this._comment = value;
  }

  private _required = false;

  public static fromAny(feedback_data: any[], comment: string): FeedBackForm {
    const groups: Group[] = [];

    // init feedback_data

    let result: FeedBackForm = null;
    let required = false;
    for (let i = 0; i < feedback_data.length; i++) {
      const group = feedback_data[i];
      const group_obj = Group.fromAny(group);

      groups.push(group_obj);
      if (group_obj.required) {
        required = true;
      }
    }

    result = new FeedBackForm(
      groups,
      comment
    );

    result.required = required;

    return result;
  }

  constructor(private _groups: Group[], private _comment: string) {

  }

  public exportData(): any {
    const result: any = {};

    for (let i = 0; i < this.groups.length; i++) {
      for (let j = 0; j < this.groups[i].controls.length; j++) {
        const control: Control = this.groups[i].controls[j];
        if (control.type.type !== 'textarea') {
          if (control.type.type === 'radiobutton') {
            if (!isNullOrUndefined(control.custom.checked)) {
              if (control.custom.checked) {
                result['' + control.name + ''] = control.value;
                break;
              }
              result['' + control.name + ''] = '';
            } else {
              result['' + control.name + ''] = '';
            }
          } else if (control.type.type === 'checkbox') {
            if (isNullOrUndefined(result['' + control.name + ''])) {
              result['' + control.name + ''] = [];
            }

            if (!isNullOrUndefined(control.custom.checked)) {
              if (control.custom.checked) {
                result['' + control.name + ''].push(control.value);
              }
            }
          }
        } else {
          result['' + control.name + ''] = control.value;
        }
      }
    }
    return result;
  }

  public importData(feedback_data: any): any {
    const result = {};

    for (const attr in feedback_data) {
      if (feedback_data.hasOwnProperty(attr)) {
        const value = feedback_data[`${attr}`];

        if (isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            this.setValueForControl(attr, value[i]);
          }
        } else {
          this.setValueForControl(attr, value);
        }
      }
    }

    return result;
  }

  public setValueForControl(name: string, value: string, custom?: any): boolean {
    let found = false;

    for (let i = 0; i < this.groups.length; i++) {
      for (let j = 0; j < this.groups[i].controls.length; j++) {
        const control: Control = this.groups[i].controls[j];
        if (control.name === name) {
          if (control.type.type === 'textarea') {
            control.value = value;
            return true;
          } else {
            // type of control is not textarea
            if (control.type.type === 'radiobutton' || control.type.type === 'checkbox') {
              found = true;
              if (control.value === value) {
                if (control.type.type === 'radiobutton') {
                  control.custom['checked'] = true;
                } else {
                  if (control.type.type === 'checkbox') {
                    if (!isNullOrUndefined(custom) && !isNullOrUndefined(custom.checked)) {
                      control.custom['checked'] = custom.checked;
                    } else {
                      // call from importData
                      control.custom['checked'] = true;
                    }
                  }
                }
              } else {
                if (control.type.type === 'radiobutton') {
                  control.custom['checked'] = false;
                }
              }
            }
          }
        }
      }
      if (found) {
        return true;
      }
    }

    return false;
  }
}
