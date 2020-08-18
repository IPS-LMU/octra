import {createAction, props} from '@ngrx/store';

const context = 'IDB';

export const loadIDB = createAction(
  `[${context}] Load IDB`
);
