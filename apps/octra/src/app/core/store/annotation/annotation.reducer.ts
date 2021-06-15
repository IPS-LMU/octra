import {ActionCreator, on, ReducerTypes} from '@ngrx/store';
import {AnnotationState} from '../index';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from './annotation.actions';
import {IDBActions} from '../idb/idb.actions';
import {LoginActions} from '../login/login.actions';

export const initialState: AnnotationState = {
  transcript: {
    levels: [],
    links: [],
    levelCounter: 0
  },
  savingNeeded: false,
  isSaving: false,
  submitted: false,
  audio: {
    loaded: false
  },
  feedback: null,
  logs: [],
  logging: false,
  histories: {}
};

// initialize ngrx-wieder with custom config
const {createUndoRedoReducer} = undoRedo({
  allowedActionTypes: [
    AnnotationActions.changeAnnotationLevel.type,
    AnnotationActions.addAnnotationLevel.type,
    AnnotationActions.removeAnnotationLevel.type
  ]
})

export const reducers: ReducerTypes<AnnotationState, ActionCreator[]>[] = [
  on(AnnotationActions.setLevelCounter, (state: AnnotationState, {levelCounter}) =>
    ({
      ...state,
      levelCounter: levelCounter
    })),
  on(AnnotationActions.setAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    annotation
  })),
  on(AnnotationActions.clearAnnotation, (state) => ({
    ...state,
    levels: [],
    links: [],
    levelCounter: 0
  })),
  on(LoginActions.logout, ((state, {clearSession}) => {
    if (clearSession) return initialState;
    return state;
  })),
  on(LoginActions.clearWholeSession, (() => {
    return initialState;
  })),
  on(LoginActions.loginDemo, (() => {
    return initialState;
  })),
  on(LoginActions.loginURLParameters, (() => {
    return initialState;
  })),
  on(LoginActions.loginLocal, ((state: AnnotationState, {removeData}) => {
    if (removeData) {
      return initialState;
    }
    return state;
  })),
  on(LoginActions.loginOnline, ((state: AnnotationState, {removeData}) => {
    if (removeData) {
      return initialState;
    }
    return state;
  })),
  on(AnnotationActions.overwriteAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    levels: annotation.levels,
    links: annotation.links,
    levelCounter: annotation.levelCounter
  })),
  on(AnnotationActions.changeAnnotationLevel, (state: AnnotationState, {level}) => {
    const annotationLevels = state.levels;
    const index = annotationLevels.findIndex(a => a.id === level.id);

    if (index > -1 && index < annotationLevels.length) {
      return {
        ...state,
        levels: [
          ...state.levels.slice(0, index),
          {
            ...level
          },
          ...state.levels.slice(index + 1)
        ]
      };
    } else {
      console.error(`can't change level because index not valid.`);
    }

    return state;
  }),
  on(AnnotationActions.addAnnotationLevel, (state: AnnotationState, {level}) =>
    ({
      ...state,
      levels: [
        ...state.levels,
        level
      ]
    })),
  on(AnnotationActions.removeAnnotationLevel, (state: AnnotationState, {id}) => {
    if (id > -1) {
      const index = state.levels.findIndex((a) => (a.id === id));
      if (index > -1) {
        return {
          ...state,
          levels: [
            ...state.levels.slice(0, index),
            ...state.levels.slice(index + 1)
          ]
        }
      } else {
        console.error(`can't remove level because index not valid.`);
      }
    } else {
      console.error(`can't remove level because id not valid.`);
    }

    return state;
  }),
  on(IDBActions.loadAnnotationLevelsSuccess, (state: AnnotationState, {levels, levelCounter}) =>
    ({
      ...state,
      levels,
      levelCounter
    })),
  on(IDBActions.loadAnnotationLinksSuccess, (state: AnnotationState, {links}) =>
    ({
      ...state,
      links
    }))
];
