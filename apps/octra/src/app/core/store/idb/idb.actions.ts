import {createAction, props} from '@ngrx/store';
import {ConsoleEntry} from '../../shared/service/bug-report.service';
import {OIDBLink} from '@octra/annotation';
import {AnnotationStateLevel} from '../index';

const context = 'IDB';

export class IDBActions {
  public static loadOptionsSuccess = createAction(
    `[${context}] Load Options Success`,
    props<{
      variables: { name: string, value: any }[]
    }>()
  );

  public static loadOptionsFailed = createAction(
    `[${context}] Load Options Failed`,
    props<{
      error: string
    }>()
  );

  public static loadLogsSuccess = createAction(
    `[${context}] Load Logs Success`,
    props<{
      online: any[],
      demo: any[],
      local: any[]
    }>()
  );

  public static loadLogsFailed = createAction(
    `[${context}] Load Logs Failed`,
    props<{
      error: string
    }>()
  );

  public static loadAnnotationLinksSuccess = createAction(
    `[${context}] Load AnnotationLinks Success`,
    props<{
      links: OIDBLink[]
    }>()
  );

  public static loadAnnotationSuccess = createAction(
    `[${context}] Load Annotation Success`,
    props<{
      online: {
        levels: AnnotationStateLevel[];
        levelCounter: number;
      },
      demo: {
        levels: AnnotationStateLevel[];
        levelCounter: number;
      },
      local: {
        levels: AnnotationStateLevel[];
        levelCounter: number;
      },
    }>()
  );

  public static loadAnnotationFailed = createAction(
    `[${context}] Load Annotation Failed`,
    props<{
      error: string
    }>()
  );

  public static loadConsoleEntriesSuccess = createAction(
    `[${context}] Load ConsoleEntries Success`,
    props<{
      consoleEntries: ConsoleEntry[]
    }>()
  );

  public static loadConsoleEntriesFailed = createAction(
    `[${context}] Load ConsoleEntries Failed`,
    props<{
      error: string
    }>()
  );

  public static clearLogsSuccess = createAction(
    `[${context}] Clear Logs Success`,
    props<{
      mode: string
    }>()
  );

  public static clearLogsFailed = createAction(
    `[${context}] Clear Logs Failed`,
    props<{
      error: string
    }>()
  );

  public static clearAllOptions = createAction(
    `[${context}] Clear All Options`
  );

  public static clearAllOptionsSuccess = createAction(
    `[${context}] Clear All Options Success`
  );

  public static clearAllOptionsFailed = createAction(
    `[${context}] Clear All Options Failed`,
    props<{
      error: string
    }>()
  );

  public static saveUserProfileSuccess = createAction(
    `[${context}] Save User Profile Success`
  );

  public static saveUserProfileFailed = createAction(
    `[${context}] Save User Profile Failed`,
    props<{
      error: string
    }>()
  );

  public static saveTranscriptionSubmittedSuccess = createAction(
    `[${context}] Save Submitted Success`
  );

  public static saveTranscriptionSubmittedFailed = createAction(
    `[${context}] Save Submitted Failed`,
    props<{
      error: string
    }>()
  );

  public static saveTranscriptionFeedbackSuccess = createAction(
    `[${context}] Save Transcription Feedback Success`
  );

  public static saveTranscriptionFeedbackFailed = createAction(
    `[${context}] Save Transcription Feedback Failed`,
    props<{
      error: string
    }>()
  );

  public static saveAppLanguageSuccess = createAction(
    `[${context}] Save App Language Success`
  );

  public static saveAppLanguageFailed = createAction(
    `[${context}] Save App Language Failed`,
    props<{
      error: string
    }>()
  );

  public static saveIDBVersionSuccess = createAction(
    `[${context}] Save IDB Version Success`
  );

  public static saveIDBVersionFailed = createAction(
    `[${context}] Save IDB Version Failed`,
    props<{
      error: string
    }>()
  );

  public static saveTranscriptionLoggingSuccess = createAction(
    `[${context}] Save Transcription Logging Success`
  );

  public static saveTranscriptionLoggingFailed = createAction(
    `[${context}] Save Transcription Logging Failed`,
    props<{
      error: string
    }>()
  );

  public static saveShowLoupeSuccess = createAction(
    `[${context}] Save showLoupe Success`
  );

  public static saveShowLoupeFailed = createAction(
    `[${context}] Save showLoupe Failed`,
    props<{
      error: string
    }>()
  );

  public static saveEasyModeSucess = createAction(
    `[${context}] Save easyMode Success`
  );

  public static saveEasyModeFailed = createAction(
    `[${context}] Save easyMode Failed`,
    props<{
      error: string
    }>()
  );

  public static saveTranscriptionCommentSuccess = createAction(
    `[${context}] Save Transcription Comment Success`
  );

  public static saveTranscriptionCommentFailed = createAction(
    `[${context}] Save Transcription Comment Failed`,
    props<{
      error: string
    }>()
  );

  public static saveSecondsPerLineSuccess = createAction(
    `[${context}] Save SecondsPerLine Success`
  );

  public static saveSecondsPerLineFailed = createAction(
    `[${context}] Save SecondsPerLine Failed`,
    props<{
      error: string
    }>()
  );

  public static saveHighlightingEnabledSuccess = createAction(
    `[${context}] Save highlightingEnabled Success`
  );

  public static saveHighlightingEnabledFailed = createAction(
    `[${context}] Save highlightingEnabled Failed`,
    props<{
      error: string
    }>()
  );

  public static saveDemoSessionSuccess = createAction(
    `[${context}] Save demoSession Success`
  );

  public static saveDemoSessionFailed = createAction(
    `[${context}] Save demoSession Failed`,
    props<{
      error: string
    }>()
  );

  public static saveOnlineSessionSuccess = createAction(
    `[${context}] Save OnlineSession Success`
  );

  public static saveOnlineSessionFailed = createAction(
    `[${context}] Save OnlineSession Failed`,
    props<{
      error: string
    }>()
  );

  public static saveLoggedInSuccess = createAction(
    `[SessionStore] Save LoggedIn Success`
  );

  public static saveLoggedInFailed = createAction(
    `[SessionStore] Save LoggedIn Failed`,
    props<{
      error: string
    }>()
  );

  public static savePlayOnHoverSuccess = createAction(
    `[SessionStore] Save PlayOnHover Success`
  );

  public static savePlayOnHoverFailed = createAction(
    `[SessionStore] Save PlayOnHover Failed`,
    props<{
      error: string
    }>()
  );

  public static saveFollowPlayCursorSuccess = createAction(
    `[SessionStore] Save FollowPlayCursor Success`
  );

  public static saveFollowPlayCursorFailed = createAction(
    `[SessionStore] Save FollowPlayCursor Failed`,
    props<{
      error: string
    }>()
  );

  public static saveAppReloadedSuccess = createAction(
    `[SessionStore] Save AppReloaded Success`
  );

  public static saveAppReloadedFailed = createAction(
    `[SessionStore] Save AppReloaded Failed`,
    props<{
      error: string
    }>()
  );

  public static saveServerDataEntrySuccess = createAction(
    `[SessionStore] Save ServerDataEntry Success`
  );

  public static saveServerDataEntryFailed = createAction(
    `[SessionStore] Save ServerDataEntry Failed`,
    props<{
      error: string
    }>()
  );

  public static saveLocalSessionSuccess = createAction(
    `[${context}] Save LocalSession Success`
  );

  public static saveLocalSessionFailed = createAction(
    `[${context}] Save LocalSession Failed`,
    props<{
      error: string
    }>()
  );

  public static saveLogsSuccess = createAction(
    `[${context}] Save Logs Success`
  );

  public static saveLogsFailed = createAction(
    `[${context}] Save Logs Failed`,
    props<{
      error: string
    }>()
  );

  public static saveASRSettingsSuccess = createAction(
    `[${context}] Save ASRSettings Success`
  );

  public static saveASRSettingsFailed = createAction(
    `[${context}] Save ASRSettings Failed`,
    props<{
      error: string
    }>()
  );

  public static saveAudioSettingsSuccess = createAction(
    `[${context}] Save AudioSettings Success`
  );

  public static saveAudioSettingsFailed = createAction(
    `[${context}] Save AudioSettings Failed`,
    props<{
      error: string
    }>()
  );

  public static saveCurrentEditorSuccess = createAction(
    `[${context}] Save CurrentEditor Success`
  );

  public static saveCurrentEditorFailed = createAction(
    `[${context}] Save CurrentEditor Failed`,
    props<{
      error: string
    }>()
  );

  public static clearAnnotationSuccess = createAction(
    `[${context}] Save Annotation Success`
  );

  public static clearAnnotationFailed = createAction(
    `[${context}] Save Annotation Failed`,
    props<{
      error: string
    }>()
  );

  public static overwriteAnnotationSuccess = createAction(
    `[${context}] Overwrite Annotation Success`
  );

  public static overwriteAnnotationFailed = createAction(
    `[${context}] Overwrite Annotation Failed`,
    props<{
      error: string
    }>()
  );

  public static overwriteAnnotationLinksSuccess = createAction(
    `[${context}] Overwrite AnnotationLinks Success`
  );

  public static overwriteAnnotationLinksFailed = createAction(
    `[${context}] Overwrite AnnotationLinks Failed`,
    props<{
      error: string
    }>()
  );

  public static saveModeOptionsSuccess = createAction(
    `[${context}] Save Mode Options Success`,
    props<{
      mode: string;
    }>()
  );

  public static saveModeOptionsFailed = createAction(
    `[${context}] Save Mode Options Failed`,
    props<{
      error: string;
    }>()
  );

  public static logoutSessionSuccess = createAction(
    `[${context}] Logout Session Success`
  );

  public static logoutSessionFailed = createAction(
    `[${context}] Logout Session Failed`,
    props<{
      error: string
    }>()
  );

  public static saveAnnotationSuccess = createAction(
    `[${context}] Save Annotation Success`
  );

  public static saveAnnotationFailed = createAction(
    `[${context}] Save Annotation Failed`,
    props<{
      error: string
    }>()
  );

  public static addAnnotationLevelSuccess = createAction(
    `[${context}] Add AnnotationLevel Success`
  );

  public static addAnnotationLevelFailed = createAction(
    `[${context}] Add AnnotationLevel Failed`,
    props<{
      error: string
    }>()
  );

  public static removeAnnotationLevelSuccess = createAction(
    `[${context}] Remove AnnotationLevel Success`
  );

  public static removeAnnotationLevelFailed = createAction(
    `[${context}] Remove AnnotationLevel Failed`,
    props<{
      error: string
    }>()
  );

  public static saveConsoleEntriesSuccess = createAction(
    `[${context}] Save ConsoleEntries Success`
  );

  public static saveConsoleEntriesFailed = createAction(
    `[${context}] Save ConsoleEntries Failed`,
    props<{
      error: string
    }>()
  );
}
