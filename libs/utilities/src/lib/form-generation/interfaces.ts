import { JSONSchema7 } from 'json-schema';

export interface FormGeneratorJSONSchema extends JSONSchema7 {
  $gui_support?: boolean;
  dependsOn?: string[];
  placeholder?: string;
  ignore?: boolean;
  toggleable?: boolean;

  properties?:
    | {
        [key: string]: FormGeneratorJSONSchema;
      }
    | undefined;
  items?: FormGeneratorJSONSchema | FormGeneratorJSONSchema[] | undefined;
}
