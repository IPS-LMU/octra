import {isArray} from 'rxjs/internal-compatibility';
import {Group} from './Group';
import {getProperties} from '@octra/utilities';

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
    for (const group of feedbackData) {
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

    for (const group of this.groups) {
      for (const control of group.controls) {
        if (control.type.type !== 'textarea') {
          if (control.type.type === 'radiobutton') {
            if (!(control.custom.checked === undefined || control.custom.checked === undefined)) {
              if (control.custom.checked) {
                result['' + group.name + ''] = control.value;
                break;
              }
              result['' + group.name + ''] = '';
            } else {
              result['' + group.name + ''] = '';
            }
          } else if (control.type.type === 'checkbox') {
            if ((result['' + group.name + ''] === undefined || result['' + group.name + ''] === undefined)) {
              result['' + group.name + ''] = [];
            }

            if (!(control.custom.checked === undefined || control.custom.checked === undefined)) {
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
    if (feedbackData !== undefined) {
      for (const [name, value] of getProperties(feedbackData)) {
        if (isArray(value)) {
          for (const valueElement of value) {
            this.setValueForControl(name, valueElement);
          }
        } else {
          this.setValueForControl(name, value as string);
        }
      }

    }
    return result;
  }

  public setValueForControl(name: string, value: string, custom?: any): boolean {
    let found = false;

    for (const group of this.groups) {
      for (const control of group.controls) {
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
                  if (!(custom === undefined || custom === undefined) && !(custom.checked === undefined || custom.checked === undefined)) {
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
