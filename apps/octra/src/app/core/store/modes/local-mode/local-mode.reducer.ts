import {on} from '@ngrx/store';
import {LocalModeState, OnlineModeState} from '../../index';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from '../../annotation/annotation.actions';
import {LocalModeActions} from './local-mode.actions';

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
  ...fromAnnotation.reducers,
  on(LocalModeActions.login, (state: OnlineModeState, data) => ({
    ...state,
    ...data
  })),
  on(LocalModeActions.logout, (state: OnlineModeState, {clearSession}) => {
    return (clearSession) ? initialState : {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false
      },
      files: [],
      histories: {}
    };
  })
);
