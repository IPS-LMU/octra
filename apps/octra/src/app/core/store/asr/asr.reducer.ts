import {createReducer, on} from '@ngrx/store';
import * as ASRActions from './asr.actions';
import {ASRState} from '../index';
import * as fromIDBActions from '../idb/idb.actions';

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(ASRActions.setASRSettings, (state, data) => ({
    ...state,
    ...data
  })),
  on(fromIDBActions.loadOptionsSuccess, (state, {variables}) => {
      let result = state;

      for (const variable of variables) {
        result = saveOptionToStore(state, variable.name, variable.value);
      }

      return result;
    }
  ));

function saveOptionToStore(state: ASRState, attribute: string, value: any): ASRState {
  console.log(`save Option ${attribute} to store with value "${JSON.stringify(value)}"...`);
  switch (attribute) {
    case('_asr'):
      return {
        ...state,
        selectedLanguage: (value.hasOwnProperty('selectedLanguage')) ? value.selectedLanguage: null,
        selectedService: (value.hasOwnProperty('selectedService')) ? value.selectedService : null
      };
    default:
      console.error(`can't find case for attribute ${attribute}`);
  }
}
