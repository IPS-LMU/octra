import {on} from '@ngrx/store';
import {AnnotationState} from '../index';
import {undoRedo} from 'ngrx-wieder';
import {AnnotationActions} from './annotation.actions';
import {IDBActions} from '../idb/idb.actions';

export const initialState: AnnotationState = {
  levels: [],
  links: [],
  levelCounter: 0
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
  on(AnnotationActions.setLevelCounter, (state: AnnotationState, {levelCounter}) =>
    ({
      ...state,
      levelCounter: levelCounter
    })),
  on(AnnotationActions.setAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    annotation
  })),
  on(AnnotationActions.clearAnnotation, () => ({
    levels: [],
    links: [],
    levelCounter: 0
  })),
  on(AnnotationActions.overwriteAnnotation, (state: AnnotationState, {annotation}) => ({
    ...state,
    ...annotation
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
);
