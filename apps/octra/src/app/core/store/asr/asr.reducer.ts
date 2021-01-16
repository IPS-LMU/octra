import {createReducer, on} from '@ngrx/store';
import * as ASRActions from './asr.actions';
import {ASRState} from '../index';
import * as IDBActions from '../idb/idb.actions';
import {isUnset} from '@octra/utilities';

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(ASRActions.setASRSettings, (state, data) => ({
    ...state,
    ...data
  })),
  on(IDBActions.loadOptionsSuccess, (state, {variables}) => {
      let result = state;

      for (const variable of variables) {
        result = saveOptionToStore(result, variable.name, variable.value);
      }

      return result;
    }
  ));

function saveOptionToStore(state: ASRState, attribute: string, value: any): ASRState {
  switch (attribute) {
    case('asr'):
      return {
        ...state,
        selectedLanguage: (!isUnset(value) && value.hasOwnProperty('selectedLanguage')) ? value.selectedLanguage : null,
        selectedService: (!isUnset(value) && value.hasOwnProperty('selectedService')) ? value.selectedService : null
      };

    default:
      return state;
  }
}
