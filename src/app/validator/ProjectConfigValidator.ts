import {ConfigValidator, ValidationResult} from '../shared/ConfigValidator';
import {isArray} from 'util';

export class ProjectConfigValidator extends ConfigValidator {

  private version = '1.1.0';

  public validate(key: string, value: any): ValidationResult {
    const prefix = 'ProjectConfig Validation - ';

    switch (key) {
      case('version'):
        if (typeof value === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type string'
        };
      case('logging'):
        if (typeof value !== 'object') {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value + '\' must be of type object'
          };
        } else {
          if (!value.hasOwnProperty('forced')
            || !(typeof value['forced'] === 'boolean')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.' + value + '\' must be of type {forced:boolean}'
            };
          }
        }
        break;
      case('navigation'):
        if (typeof value !== 'object') {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value + '\' must be of type object'
          };
        } else {
          if (!value.hasOwnProperty('export')
            || !(typeof value['export'] === 'boolean')
            || !(typeof value['interfaces'] === 'boolean')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.' + value + '\' must be of type {export:boolean, interfaces:boolean}'
            };
          }
        }
        break;
      case('responsive'):
        if (typeof value !== 'object') {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value + '\' must be of type {enabled:boolean, fixedwidth:number}'
          };
        } else {
          if (!value.hasOwnProperty('enabled')
            || !(typeof value['enabled'] === 'boolean')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.' + 'enabled' + '\' must be of type {enabled:boolean, fixedwidth: number}'
            };
          }
          if (!value.hasOwnProperty('fixedwidth')
            || !(typeof value['fixedwidth'] === 'number')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.' + 'fixedwidth' + '\' must be of type {enabled:boolean, fixedwidth: number}'
            };
          }
        }
        break;
      case('agreement'):
        if (typeof value !== 'object') {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value[key] + '\' must be of type boolean'
          };
        } else {
          if (!value.hasOwnProperty('enabled')
            || !(typeof value['enabled'] === 'boolean')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.' + value + '\' must be of type {enabled:boolean, text: object}'
            };
          }
          if (!value.hasOwnProperty('text')
            || !(typeof value['text'] === 'object')
          ) {
            return {
              success: false,
              error: prefix + 'key \'' + key + '.text\' must be of type {de:string, en:string ...}'
            };
          }
        }
        break;
      case('languages'):
        if (!isArray(value)) {
          return {
            success: false,
            error: prefix + 'key \'' + key + '\' must be of type array'
          };
        }

        break;
      case('interfaces'):
        if (!isArray(value)) {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value + '\' must be of type array'
          };
        }
        break;
      case('feedback_form'):
        if (!isArray(value)) {
          return {
            success: false,
            error: prefix + 'key \'' + key + '.' + value + '\' must be of type array'
          };
        }
        break;
      case('plugins'):
        if (typeof value !== 'object') {
          return {
            success: false,
            error: prefix + 'key \'' + key + '\' must be of type object'
          };
        }
        break;
    }

    return {
      success: true,
      error: ''
    };
  }
}
