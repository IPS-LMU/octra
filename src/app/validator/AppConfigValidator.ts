import {ConfigValidator, ValidationResult} from '../shared/ConfigValidator';
import {isArray, isNullOrUndefined} from 'util';

export class AppConfigValidator extends ConfigValidator {

  private version = '1.1.0';

  public validate(key: string, value: any): ValidationResult {
    const prefix = 'AppConfig Validation - ';

    switch (key) {
      case('version'):
        if (typeof value === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type string'
        };
      case('audio_server')   :
        if (typeof value === 'object') {
          if (!isNullOrUndefined(value['url']) && typeof value['url'] === 'string') {
            break;
          } else {
            return {
              success: false,
              error: prefix + 'value of key \'' + key + '\' must be of type object {url:string}'
            };
          }
        }
        break;
      case('octra')   :
        if (typeof value === 'object') {
          for (key in value) {
            if (value.hasOwnProperty(key)) {
              switch (key) {
                case('login'):
                  if (typeof value[key] !== 'object') {
                    return {
                      success: false,
                      error: prefix + 'key \'' + key + '.' + value[key] + '\' must be of type boolean'
                    };
                  } else {
                    if (!value[key].hasOwnProperty('enabled')
                      || !(typeof value[key]['enabled'] === 'boolean')
                    ) {
                      return {
                        success: false,
                        error: prefix + 'key \'' + key + '.' + value[key] + '\' must be of type {enabled:boolean}'
                      };
                    }
                  }
                  break;
                case('responsive'):
                  if (typeof value[key] !== 'object') {
                    return {
                      success: false,
                      error: prefix + 'key \'' + key + '.' + value[key] + '\' must be of type object ' +
                      '{login_enabled:boolean, fixedwidth:number}'
                    };
                  } else {
                    for (const ke in value[key]) {
                      if (!isNullOrUndefined(ke)) {
                        switch (ke) {
                          case('enabled'):
                            if (typeof value[key][ke] !== 'boolean') {
                              return {
                                success: false,
                                error: prefix + 'key \'octra.' + key + '.' + ke + '\' must be of type boolean'
                              };
                            }
                            break;
                          case('fixedwidth'):
                            if (typeof value[key][ke] !== 'number') {
                              return {
                                success: false,
                                error: prefix + 'key \'octra.' + key + '.' + ke + '\' must be of type number'
                              };
                            }
                            break;
                          default:
                            return {
                              success: false,
                              error: prefix + 'key \'octra' + '.' + key + '.' + ke + '\' not valid.'
                            };
                        }
                      }
                    }
                  }
                  break;
                case('allowed_browsers'):
                  if (!isArray(value[key])) {
                    return {
                      success: false,
                      error: prefix + 'key \'octra' + '.' + key + '\' must be of type Array [{name:string, version:string}]'
                    };
                  } else {
                    for (const ke in value[key]) {
                      if (typeof value[key][ke] !== 'object') {
                        return {
                          success: false,
                          error: prefix + 'key \'octra' + '.' + key + '.' + ke + '\' must be of type object {name:string, version:string}'
                        };
                      } else {
                        if (isNullOrUndefined(value[key][ke].name) || isNullOrUndefined(value[key][ke].version)
                          || typeof value[key][ke].name !== 'string' || typeof value[key][ke].version !== 'string') {
                          return {
                            success: false,
                            error: prefix + 'key2 \'octra' + '.' + key + '.' + ke + '\' ' +
                            'must be of type object {name:string, version:string}'
                          };
                        }
                      }
                    }
                  }
                  break;
                case('languages'):
                  if (!isArray(value[key])) {
                    return {
                      success: false,
                      error: prefix + 'value of key \'' + key + '\' must be of type Array'
                    };
                  }
                  break;
                case('showdetails'):
                  if (typeof value === 'boolean') {
                    return {
                      success: false,
                      error: prefix + 'value of key \'' + key + '\' must be of type boolean'
                    };
                  }
                  break;
                default:
                  return {
                    success: false,
                    error: prefix + 'key \'' + key + '\' not valid in attribute \'octra\' ' +
                    '{login_enabled:boolean, logging_enabled:boolean, responsive:{enabled:boolean, ' +
                    'fixedwidth:number}, allowed_browser:array}'
                  };
              }
            }
          }
        } else {
          return {
            success: false,
            error: prefix + 'value of key \'' + key + '\' must be of type object ' +
            '{login_enabled:boolean, responsive:{enabled:boolean, fixedwidth:number}, allowed_browser:array}'
          };
        }
        break;
      default:
        return {
          success: false,
          error: prefix + 'key \'' + key + '\' not found'
        };
    }

    return {
      success: true,
      error: ''
    };
  }
}
