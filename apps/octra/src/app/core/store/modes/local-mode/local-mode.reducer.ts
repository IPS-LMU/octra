import {on} from '@ngrx/store';
import {LocalModeState, LoginMode} from '../../index';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import {AnnotationStateReducers} from '../../annotation/annotation.reducer';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from '../../annotation/annotation.actions';
import {LocalModeActions} from './local-mode.actions';
import {SessionFile} from '../../../obj/SessionFile';
import {IDBActions} from '../../idb/idb.actions';
import {isUnset} from '@octra/utilities';

export const initialState: LocalModeState = {
  ...fromAnnotation.initialState,
  files: []
};

// initialize ngrx-wieder with custom config
const {createUndoRedoReducer} = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.type,
    AnnotationActions.addAnnotationLevel.type,
    AnnotationActions.removeAnnotationLevel.type
  ]
})

export const reducer = createUndoRedoReducer(
  initialState,
  ...new AnnotationStateReducers(LoginMode.LOCAL).create(),
  on(LocalModeActions.login, (state: LocalModeState, data) => ({
    ...state,
    ...data
  })),
  on(LocalModeActions.logout, (state: LocalModeState, {clearSession}) => {
    return (clearSession) ? initialState : {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false,
        fileName: '',
        sampleRate: 0
      },
      files: [],
      histories: {}
    };
  }),
  on(LocalModeActions.setSessionFile, (state: LocalModeState, {sessionFile}) => ({
    ...state,
    sessionFile
  })),
  on(IDBActions.loadOptionsSuccess, (state: LocalModeState, {variables}) => {
      let result = state;

      for (const variable of variables) {
        if (!isUnset(variable)) {
          result = writeOptionToStore(result, variable.name, variable.value);
        }
      }

      return result;
    }
  )
);


function writeOptionToStore(state: LocalModeState, attribute: string, value: any): LocalModeState {
  switch (attribute) {
    case('sessionfile'):
      const sessionFile = SessionFile.fromAny(value);

      return {
        ...state,
        sessionFile
      };
  }

  return state;
}
