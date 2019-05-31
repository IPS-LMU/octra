import {Group} from './Group';
import {Control} from './Control';
import {isArray} from 'rxjs/internal-compatibility';

export class FeedBackForm {
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

  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = value;
  }

  constructor(private _groups: Group[], private _comment: string) {

  }

  public static fromAny(feedbackData: any[], comment: string): FeedBackForm {
    const groups: Group[] = [];

    // init feedbackData
    let required = false;
    for (let i = 0; i < feedbackData.length; i++) {
      const group = feedbackData[i];
      const groupObj = Group.fromAny(group);

      groups.push(groupObj);
      if (groupObj.required) {
        required = true;
      }
    }

    const result = new FeedBackForm(
      groups,
      comment
    );

    result.required = required;

    return result;
  }

  public exportData(): any {
    const result: any = {};

    for (let i = 0; i < this.groups.length; i++) {
      const group = this.groups[i];
      for (let j = 0; j < group.controls.length; j++) {
        const control: Control = group.controls[j];
        if (control.type.type !== 'textarea') {
          if (control.type.type === 'radiobutton') {
            if (!(control.custom.checked === null || control.custom.checked === undefined)) {
              if (control.custom.checked) {
                result['' + group.name + ''] = control.value;
                break;
              }
              result['' + group.name + ''] = '';
            } else {
              result['' + group.name + ''] = '';
            }
          } else if (control.type.type === 'checkbox') {
            if ((result['' + group.name + ''] === null || result['' + group.name + ''] === undefined)) {
              result['' + group.name + ''] = [];
            }

            if (!(control.custom.checked === null || control.custom.checked === undefined)) {
              if (control.custom.checked) {
                result['' + group.name + ''].push(control.value);
              }
            }
          }
        } else {
          result['' + group.name + ''] = control.value;
        }
      }
    }
    return result;
  }

  public importData(feedbackData: any): any {
    const result = {};
    for (const attr in feedbackData) {
      if (feedbackData.hasOwnProperty(attr)) {
        const value = feedbackData[`${attr}`];

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
      const group = this.groups[i];
      for (let j = 0; j < this.groups[i].controls.length; j++) {
        const control: Control = this.groups[i].controls[j];
        if (group.name === name) {
          if (control.type.type === 'textarea') {
            control.value = value;
            return true;
          } else {
            // type of control is not textarea
            if (control.type.type === 'radiobutton' || control.type.type === 'checkbox') {
              found = true;
              if (control.type.type === 'radiobutton') {
                control.custom.checked = (control.value === value);
              } else if (control.type.type === 'checkbox') {
                if (control.value === value) {
                  if (!(custom === null || custom === undefined) && !(custom.checked === null || custom.checked === undefined)) {
                    control.custom.checked = custom.checked;
                  } else {
                    // call from importData
                    control.custom.checked = true;
                  }
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
