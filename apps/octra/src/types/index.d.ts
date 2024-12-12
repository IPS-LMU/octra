import { OctraGuidelines } from '@octra/assets';

export interface OctraValidationItem {
  start: number;
  length: number;
  code: string;
}

export {};

declare global {
  export const validateAnnotation: (
    transcript: string,
    guidelines: OctraGuidelines
  ) => OctraValidationItem[];
  export const tidyUpAnnotation: (
    transcript: string,
    guidelines: OctraGuidelines
  ) => string;
}
