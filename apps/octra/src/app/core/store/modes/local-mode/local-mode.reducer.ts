import { on } from '@ngrx/store';
import { LoginMode } from '../../index';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import { AnnotationStateReducers } from '../../annotation/annotation.reducer';
import { undoRedo } from 'ngrx-wieder';
import { AnnotationActions } from '../../annotation/annotation.actions';
import { LocalModeActions } from './local-mode.actions';
import { SessionFile } from '../../../obj/SessionFile';
import { IDBActions } from '../../idb/idb.actions';
import { getProperties } from '@octra/utilities';
import { AuthenticationActions } from '../../authentication';
import { LocalModeState } from '../../annotation';

export const initialState: LocalModeState = {
  ...fromAnnotation.initialState,
  files: [],
};

// initialize ngrx-wieder with custom config
const { createUndoRedoReducer } = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.do.type,
    AnnotationActions.addAnnotationLevel.do.type,
    AnnotationActions.removeAnnotationLevel.do.type,
  ],
});

export const reducer = createUndoRedoReducer(
  initialState,
  ...new AnnotationStateReducers(LoginMode.LOCAL).create(),
  on(
    LocalModeActions.login,
    (state: LocalModeState, { files, sessionFile }) => ({
      ...state,
      files,
      sessionFile,
    })
  ),
  on(
    AuthenticationActions.logout.success,
    (state: LocalModeState, { clearSession, mode }) => {
      if (mode === LoginMode.LOCAL) {
        return clearSession
          ? {
              ...initialState,
              guidelines: state.guidelines,
              projectConfig: state.projectConfig,
              methods: state.methods,
            }
          : {
              ...state,
              savingNeeded: false,
              isSaving: false,
              submitted: false,
              audio: {
                loaded: false,
                fileName: '',
                sampleRate: 0,
              },
              files: [],
              histories: {},
            };
      }
      return state;
    }
  ),
  on(
    LocalModeActions.setSessionFile,
    (state: LocalModeState, { sessionFile }) => ({
      ...state,
      sessionFile,
    })
  ),
  on(
    IDBActions.loadOptionsSuccess,
    (state: LocalModeState, { localOptions }) => {
      let result = state;

      for (const [name, value] of getProperties(localOptions)) {
        result = writeOptionToStore(result, name, value);
      }

      return result;
    }
  )
);

function writeOptionToStore(
  state: LocalModeState,
  attribute: string,
  value: any
): LocalModeState {
  const sessionFile = SessionFile.fromAny(value);

  switch (attribute) {
    case 'sessionfile':
      return {
        ...state,
        sessionFile,
      };
  }

  return state;
}
