import {createReducer, on} from '@ngrx/store';
import * as ASRActions from './asr.actions';
import {ASRState} from '../index';

export const initialState: ASRState = {};

export const reducer = createReducer(
  initialState,
  on(ASRActions.setASRLanguage, (state, {selectedLanguage}) => ({
    ...state,
    selectedLanguage
  }))
);

