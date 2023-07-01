import { createReducer, on } from "@ngrx/store";
import { ASRActions } from "./asr.actions";
import { IDBActions } from "../idb/idb.actions";
import { hasProperty } from "@octra/utilities";
import { ASRState } from "./index";

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(ASRActions.setASRSettings, (state: ASRState, data) => ({
    ...state,
    ...data
  })),
  on(IDBActions.loadOptionsSuccess, (state: ASRState, {applicationOptions}) => {
      let result = state;

      for (const option of applicationOptions) {
        result = writeOptionToStore(result, option.name, option.value);
      }

      return result;
    }
  ));

function writeOptionToStore(state: ASRState, attribute: string, value: any): ASRState {
  switch (attribute) {
    case('asr'):
      return {
        ...state,
        selectedLanguage: (value !== undefined && hasProperty(value, 'selectedLanguage')) ? value.selectedLanguage : undefined,
        selectedService: (value !== undefined && hasProperty(value, 'selectedService')) ? value.selectedService : undefined
      };

    default:
      return state;
  }
}
