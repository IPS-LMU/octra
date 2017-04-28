import {Control} from './control';

export interface TextareaControl extends Control {
  custom: {
    minlength: number,
    maxlength: number,
    validation: string
  };
}
