import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ASRContext,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import {
  IIDBApplicationOptions,
  IIDBModeOptions,
} from '../../shared/octra-database';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { LoginMode } from '../index';

export class IDBActions {
  static loadOptions = createActionGroup({
    source: `IDB/Load options`,
    events: {
      success: props<{
        applicationOptions: IIDBApplicationOptions;
        localOptions: IIDBModeOptions;
        onlineOptions: IIDBModeOptions;
        demoOptions: IIDBModeOptions;
        urlOptions: IIDBModeOptions;
        importOptions?: Record<string, any>;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static loadLogs = createActionGroup({
    source: `IDB/Load logs`,
    events: {
      success: props<{
        online: any[];
        demo: any[];
        local: any[];
        url: any[];
      }>(),
    },
  });

  static loadAnnotation = createActionGroup({
    source: `IDB/Load annotation`,
    events: {
      do: emptyProps(),
      success: props<{
        online: OctraAnnotation<ASRContext, OctraAnnotationSegment<ASRContext>>;
        demo: OctraAnnotation<ASRContext, OctraAnnotationSegment<ASRContext>>;
        local: OctraAnnotation<ASRContext, OctraAnnotationSegment<ASRContext>>;
        url: OctraAnnotation<ASRContext, OctraAnnotationSegment<ASRContext>>;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static loadConsoleEntries = createActionGroup({
    source: `IDB/Load console entries`,
    events: {
      success: props<{
        consoleEntries: ConsoleEntry[];
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearLogs = createActionGroup({
    source: `IDB/Clear logs`,
    events: {
      success: props<{
        mode: string;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearAllOptions = createActionGroup({
    source: `IDB/Clear all options`,
    events: {
      do: emptyProps(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveUserProfile = createActionGroup({
    source: `IDB/save user profile`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveTranscriptionSubmitted = createActionGroup({
    source: `IDB/save transcription submitted`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveTranscriptionFeedback = createActionGroup({
    source: `IDB/save transcription feedback`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveAppLanguage = createActionGroup({
    source: `IDB/save app language`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveIDBVersion = createActionGroup({
    source: `IDB/save IDB version`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveTranscriptionLogging = createActionGroup({
    source: `IDB/save transcription logging`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveShowMagnifier = createActionGroup({
    source: `IDB/save show magnifier`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveEasyMode = createActionGroup({
    source: `IDB/save easy mode`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveTranscriptionComment = createActionGroup({
    source: `IDB/save easy mode`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveSecondsPerLine = createActionGroup({
    source: `IDB/save seconds per line`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveHighlightingEnabled = createActionGroup({
    source: `IDB/save highlightingEnabled`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveDemoSession = createActionGroup({
    source: `IDB/save demoSession`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveOnlineSession = createActionGroup({
    source: `IDB/save OnlineSession`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveLoggedIn = createActionGroup({
    source: `IDB/save LoggedIn`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static savePlayOnHover = createActionGroup({
    source: `IDB/save PlayOnHover`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveFollowPlayCursor = createActionGroup({
    source: `IDB/save FollowPlayCursor`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveAppReloaded = createActionGroup({
    source: `IDB/save AppReloaded`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveServerDataEntry = createActionGroup({
    source: `IDB/save ServerDataEntry`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveLoginSession = createActionGroup({
    source: `IDB/save LoginSession`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveLogout = createActionGroup({
    source: `IDB/save logout`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveLogs = createActionGroup({
    source: `IDB/save logs`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveASRSettings = createActionGroup({
    source: `IDB/save ASRSettings`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveAudioSettings = createActionGroup({
    source: `IDB/save saveAudioSettings`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveCurrentEditor = createActionGroup({
    source: `IDB/save saveCurrentEditor`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearAnnotation = createActionGroup({
    source: `IDB/save clearAnnotation`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static overwriteTranscript = createActionGroup({
    source: `IDB/save overwriteTranscript`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static overwriteAnnotationLinks = createActionGroup({
    source: `IDB/save overwriteAnnotationLinks`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveModeOptions = createActionGroup({
    source: `IDB/save saveModeOptions`,
    events: {
      success: props<{
        mode: string;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static logoutSession = createActionGroup({
    source: `IDB/Logout session`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveAnnotation = createActionGroup({
    source: `IDB/save annotation`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static addAnnotationLevel = createActionGroup({
    source: `IDB/add AnnotationLevel`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static removeAnnotationLevel = createActionGroup({
    source: `IDB/remove AnnotationLevel`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveConsoleEntries = createActionGroup({
    source: `IDB/save ConsoleEntries`,
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearAllData = createActionGroup({
    source: 'IDB/clear all data',
    events: {
      do: emptyProps(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static saveImportOptions = createActionGroup({
    source: 'IDB/save import options',
    events: {
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static loadImportOptions = createActionGroup({
    source: 'IDB/load import options',
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
      success: props<{
        mode: LoginMode;
        importOptions?: Record<string, any>;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });
}
