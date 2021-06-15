import {on} from '@ngrx/store';
import {OnlineModeState} from '../../index';
import * as fromAnnotation from '../../annotation/annotation.reducer';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from '../../annotation/annotation.actions';
import {OnlineModeActions} from './online-mode.actions';

export const initialState: OnlineModeState  = {
  ...fromAnnotation.initialState,
  onlineSession: {
    loginData: {
      id: '',
      project: '',
      jobNumber: -1,
      password: ''
    }
  }
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
  on(OnlineModeActions.loginDemo, (state: OnlineModeState, {onlineSession}) => ({
    ...state,
    onlineSession
  })),
  on(OnlineModeActions.login, (state: OnlineModeState, {onlineSession}) => ({
    ...state,
    onlineSession
  })),
  on(OnlineModeActions.logout, (state: OnlineModeState, {clearSession}) => {
    return (clearSession) ? initialState : {
      ...state,
      savingNeeded: false,
      isSaving: false,
      submitted: false,
      audio: {
        loaded: false
      },
      histories: {}
    };
  })
);
