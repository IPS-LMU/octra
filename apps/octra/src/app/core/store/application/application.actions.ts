import {createAction, props} from '@ngrx/store';
import {ConsoleEntry} from '../../shared/service/bug-report.service';

const context = 'Application';

export class ApplicationActions {
  public static undo = createAction(
    `UNDO`
  );

  public static redo = createAction(
    `REDO`
  );

  public static clear = createAction(
    `CLEAR`
  );

  public static undoSuccess = createAction(
    `UNDO SUCCESS`
  );

  public static undoFailed = createAction(
    `UNDO FAILED`,
    props<{
      error: string;
    }>()
  );

  public static redoSuccess = createAction(
    `REDO SUCCESS`
  );

  public static redoFailed = createAction(
    `REDO FAILED`,
    props<{
      error: string;
    }>()
  );

  public static finishLoading = createAction(`[${context}] Finish Loading`);
  public static load = createAction(
    `[${context}] Load`,
    props<{
      progress: number;
    }>()
  );

  public static addError = createAction(
    `[${context}] Add Error`,
    props<{
      error: string
    }>()
  );

  public static setReloaded = createAction(
    `[${context}] Set reloaded`,
    props<{
      reloaded: boolean;
    }>()
  );

  public static setAppLanguage = createAction(
    `[${context}] Set app language`,
    props<{
      language: string;
    }>()
  );

  public static setDBVersion = createAction(
    `[${context}] Set IDB Version`,
    props<{
      version: number;
    }>()
  );

  public static setConsoleEntries = createAction(
    `[${context}] Set Console Entries`,
    props<{
      consoleEntries: ConsoleEntry[];
    }>()
  );

  public static consoleEntriesLoadSuccess = createAction(
    `[IDB] Console Entries Load Success`
  );

  public static consoleEntriesLoadFailed = createAction(
    `[IDB] Console Entries Load Failed`,
    props<{
      error: string;
    }>()
  );
}


