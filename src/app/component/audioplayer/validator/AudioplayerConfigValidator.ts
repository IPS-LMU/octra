import {ConfigValidator, ValidationResult} from '../../../shared/ConfigValidator';


export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class AudioplayerConfigValidator extends ConfigValidator {

  public validate(key: string, value: any): ValidationResult {
    const prefix = 'AudioplayerConfig Validation - ';

    switch (key) {
      case('audiosrc'):
        if (typeof value === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type string'
        };
      case('shortcuts_enabled'):
        if (typeof value === 'boolean') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type boolean'
        };
      case('backgroundcolor'):
        if (typeof value === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type string'
        };
      case('framecolor'):
        if (typeof value === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type string'
        };
      case('height'):
        if (typeof value === 'number' && value > 0) {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be of type number greater 0'
        };
      case('margin'):
        if (
          typeof value === 'object' && typeof value.top === 'number' && typeof value.right === 'number'
          && typeof value.bottom === 'number' && typeof value.left === 'number'
        ) {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be an object with attributes ' +
          '{top:number,right:number,bottom:number,left:number}'
        };
      case('slider'):
        if (typeof value === 'object' && typeof value.color === 'string' &&
          typeof value.height === 'number' && value.height > -1) {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must an object of {color:string, height:number}'
        };
      case('cursor'):
        if (typeof value === 'object' && typeof value.color === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must an object of {color:string}'
        };
      case('playcursor'):
        if (typeof value === 'object' && typeof value.height === 'number' &&
          typeof value.width === 'number' && typeof value.color === 'string') {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be an object with attributes {height:number,width:number}'
        };
      case('colors'):
        if (
          typeof value === 'object' && typeof value.gridcolor === 'string'
          && typeof value.datacolor === 'string' && typeof value.selectioncolor === 'string'
          && typeof value.textcolor === 'string' && typeof value.backgroundcolor === 'string'
          && typeof value.slidercolor === 'string' && typeof value.cursorcolor === 'string'
          && typeof value.playcursorcolor === 'string'
        ) {
          break;
        }
        return {
          success: false,
          error: prefix + 'value of key \'' + key + '\' must be an object with attributes { gridcolor:string, ' +
          'datacolor:string, selectioncolor : string, textcolor:string, backgroundcolor: string,' +
          ' slidercolor: string, cursorcolor:string, playcursorcolor: string}'
        };
      case('shortcuts'):
        if (typeof value === 'object') {
          for (const shortc in value) {
            if (!value['' + shortc + ''].hasOwnProperty('keys') || !value['' + shortc + ''].hasOwnProperty('title')
              || !value['' + shortc + ''].hasOwnProperty('focusonly')
            ) {
              return {
                success: false,
                error: prefix + 'value of key \'' + key + '\' must be an object of shortcuts. Compare custom config with sample config'
              };
            }
          }
          break;
        }
        break;
      case('set_boundaries'):
        if (!(typeof value === 'boolean')) {
          return {
            success: false,
            error: prefix + 'value of key \'' + key + '\' must be of type boolean'
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
