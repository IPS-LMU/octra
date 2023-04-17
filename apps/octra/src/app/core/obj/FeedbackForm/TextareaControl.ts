import { Control } from "./Control";

export interface TextareaControl extends Control {
  custom: {
    minlength: number,
    maxlength: number,
    validation: string
  };
}
