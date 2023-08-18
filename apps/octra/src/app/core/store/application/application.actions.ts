import {
  createAction,
  createActionGroup,
  emptyProps,
  props,
} from '@ngrx/store';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { LoginMode } from '../index';
import { AppSettings } from '../../obj';
import { HttpErrorResponse } from '@angular/common/http';

const context = 'Application';

export class ApplicationActions {
  static initApplication = createActionGroup({
    source: 'app/init',
    events: {
      do: emptyProps(),
      success: props<{
        playOnHover: boolean;
        followPlayCursor: boolean;
        loggedIn: boolean;
        reloaded: boolean;
      }>(),
      finish: emptyProps(),
    },
  });

  static redirectToLastPage = createActionGroup({
    source: 'app/redirect to last page',
    events: {
      do: emptyProps()
    }
  });


  static loadASRSettings = createActionGroup({
    source: 'app/load asr settings',
    events: {
      do: props<{
        settings: AppSettings;
      }>(),
      success: props<{
        settings: AppSettings;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });

  static loadSettings = createActionGroup({
    source: 'app/load settings',
    events: {
      do: emptyProps(),
      success: props<{
        settings: AppSettings;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static loadLanguage = createActionGroup({
    source: 'app/load language',
    events: {
      do: emptyProps(),
      success: emptyProps(),
    },
  });

  static changeLanguage = createActionGroup({
    source: 'app/change language',
    events: {
      success: emptyProps(),
    },
  });

  static setRedirectionTo = createActionGroup({
    source: 'app/set redirection',
    events: {
      success: props<{
        needsRedirectionTo?: string;
      }>(),
    },
  });

  static waitForEffects = createActionGroup({
    source: 'app/wait',
    events: {
      do: emptyProps(),
    },
  });

  static showErrorModal = createActionGroup({
      source: 'app/show error modal',
      events: {
        do: props<{
          error: string;
          showOKButton: boolean;
        }>()
      }
  });


  public static undo = createAction(`UNDO`);

  public static redo = createAction(`REDO`);

  public static clear = createAction(`CLEAR`);

  public static undoSuccess = createAction(`UNDO SUCCESS`);

  public static undoFailed = createAction(
    `UNDO FAILED`,
    props<{
      error: string;
    }>()
  );

  public static redoSuccess = createAction(`REDO SUCCESS`);

  public static redoFailed = createAction(
    `REDO FAILED`,
    props<{
      error: string;
    }>()
  );

  public static finishLoading = createAction(`[${context}] Finish Loading`);

  public static setLoggedIn = createAction(
    `[${context}] Set loggedIn`,
    props<{
      loggedIn: boolean;
    }>()
  );

  public static setMode = createAction(
    `[${context}] Set Mode`,
    props<{
      mode: LoginMode;
    }>()
  );

  public static addError = createAction(
    `[${context}] Add Error`,
    props<{
      error: string;
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

  public static setPlayOnHover = createAction(
    `[${context}] set playOnHover`,
    props<{
      playOnHover: boolean;
    }>()
  );

  public static setJobsLeft = createAction(
    `[${context}] set jobsLeft`,
    props<{
      jobsLeft: number;
    }>()
  );

  public static setFollowPlayCursor = createAction(
    `[${context}] set follow play cursor`,
    props<{
      followPlayCursor: boolean;
    }>()
  );

  public static setAudioSettings = createAction(
    `[${context}] Set volume`,
    props<{
      volume: number;
      speed: number;
    }>()
  );

  public static setShowLoupe = createAction(
    `[${context}] Set showLoupe`,
    props<{
      showLoupe: boolean;
    }>()
  );

  public static setEasyMode = createAction(
    `[${context}] Set easy mode`,
    props<{
      easyMode: boolean;
    }>()
  );

  public static setSecondsPerLine = createAction(
    `[${context}] Set seconds per line`,
    props<{
      secondsPerLine: number;
    }>()
  );

  public static setHighlightingEnabled = createAction(
    `[${context}] Set highlightingEnabled`,
    props<{
      highlightingEnabled: boolean;
    }>()
  );

  public static clearSettings = createAction(`[Configuration] Clear Settings`);
}
