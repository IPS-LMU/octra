import {createAction, props} from '@ngrx/store';
import {ConsoleEntry} from '../../shared/service/bug-report.service';
import {OIDBLink} from '@octra/annotation';

const context = 'IDB';

export const loadOptionsSuccess = createAction(
  `[${context}] Load Options Success`,
  props<{
    variables: { name: string, value: any }[]
  }>()
);

export const loadOptionsFailed = createAction(
  `[${context}] Load Options Failed`,
  props<{
    error: string
  }>()
);

export const loadLogsSuccess = createAction(
  `[${context}] Load Logs Success`,
  props<{
    logs: any
  }>()
);

export const loadLogsFailed = createAction(
  `[${context}] Load Logs Failed`,
  props<{
    error: string
  }>()
);

export const loadAnnotationLinksSuccess = createAction(
  `[${context}] Load AnnotationLinks Success`,
  props<{
    links: OIDBLink[]
  }>()
);

export const loadAnnotationLinksFailed = createAction(
  `[${context}] Load AnnotationLinks Failed`,
  props<{
    error: string
  }>()
);

export const loadAnnotationLevelsSuccess = createAction(
  `[${context}] Load Annotation Levels Success`,
  props<{
    levels: any;
    levelCounter: number;
  }>()
);

export const loadAnnotationLevelsFailed = createAction(
  `[${context}] Load Annotation Levels Failed`,
  props<{
    error: string
  }>()
);

export const loadConsoleEntriesSuccess = createAction(
  `[${context}] Load ConsoleEntries Success`,
  props<{
    consoleEntries: ConsoleEntry[]
  }>()
);

export const loadConsoleEntriesFailed = createAction(
  `[${context}] Load ConsoleEntries Failed`,
  props<{
    error: string
  }>()
);

export const clearLogsSuccess = createAction(
  `[${context}] Clear Logs Success`
);

export const clearLogsFailed = createAction(
  `[${context}] Clear Logs Failed`,
  props<{
    error: string
  }>()
);

export const clearAllOptions = createAction(
  `[${context}] Clear All Options`
);

export const clearAllOptionsSuccess = createAction(
  `[${context}] Clear All Options Success`
);

export const clearAllOptionsFailed = createAction(
  `[${context}] Clear All Options Failed`,
  props<{
    error: string
  }>()
);

export const saveUserProfileSuccess = createAction(
  `[${context}] Save User Profile Success`
);

export const saveUserProfileFailed = createAction(
  `[${context}] Save User Profile Failed`,
  props<{
    error: string
  }>()
);

export const saveTranscriptionSubmittedSuccess = createAction(
  `[${context}] Save Submitted Success`
);

export const saveTranscriptionSubmittedFailed = createAction(
  `[${context}] Save Submitted Failed`,
  props<{
    error: string
  }>()
);

export const saveTranscriptionFeedbackSuccess = createAction(
  `[${context}] Save Transcription Feedback Success`
);

export const saveTranscriptionFeedbackFailed = createAction(
  `[${context}] Save Transcription Feedback Failed`,
  props<{
    error: string
  }>()
);

export const saveAppLanguageSuccess = createAction(
  `[${context}] Save App Language Success`
);

export const saveAppLanguageFailed = createAction(
  `[${context}] Save App Language Failed`,
  props<{
    error: string
  }>()
);

export const saveIDBVersionSuccess = createAction(
  `[${context}] Save IDB Version Success`
);

export const saveIDBVersionFailed = createAction(
  `[${context}] Save IDB Version Failed`,
  props<{
    error: string
  }>()
);

export const saveTranscriptionLoggingSuccess = createAction(
  `[${context}] Save Transcription Logging Success`
);

export const saveTranscriptionLoggingFailed = createAction(
  `[${context}] Save Transcription Logging Failed`,
  props<{
    error: string
  }>()
);

export const saveShowLoupeSuccess = createAction(
  `[${context}] Save showLoupe Success`
);

export const saveShowLoupeFailed = createAction(
  `[${context}] Save showLoupe Failed`,
  props<{
    error: string
  }>()
);

export const saveEasyModeSucess = createAction(
  `[${context}] Save easyMode Success`
);

export const saveEasyModeFailed = createAction(
  `[${context}] Save easyMode Failed`,
  props<{
    error: string
  }>()
);

export const saveTranscriptionCommentSuccess = createAction(
  `[${context}] Save Transcription Comment Success`
);

export const saveTranscriptionCommentFailed = createAction(
  `[${context}] Save Transcription Comment Failed`,
  props<{
    error: string
  }>()
);

export const saveSecondsPerLineSuccess = createAction(
  `[${context}] Save SecondsPerLine Success`
);

export const saveSecondsPerLineFailed = createAction(
  `[${context}] Save SecondsPerLine Failed`,
  props<{
    error: string
  }>()
);

export const saveHighlightingEnabledSuccess = createAction(
  `[${context}] Save highlightingEnabled Success`
);

export const saveHighlightingEnabledFailed = createAction(
  `[${context}] Save highlightingEnabled Failed`,
  props<{
    error: string
  }>()
);

export const saveDemoSessionSuccess = createAction(
  `[${context}] Save demoSession Success`
);

export const saveDemoSessionFailed = createAction(
  `[${context}] Save demoSession Failed`,
  props<{
    error: string
  }>()
);

export const saveOnlineSessionSuccess = createAction(
  `[${context}] Save OnlineSession Success`
);

export const saveOnlineSessionFailed = createAction(
  `[${context}] Save OnlineSession Failed`,
  props<{
    error: string
  }>()
);

export const saveLoggedInSuccess = createAction(
  `[SessionStore] Save LoggedIn Success`
);

export const saveLoggedInFailed = createAction(
  `[SessionStore] Save LoggedIn Failed`,
  props<{
    error: string
  }>()
);

export const savePlayOnHoverSuccess = createAction(
  `[SessionStore] Save PlayOnHover Success`
);

export const savePlayOnHoverFailed = createAction(
  `[SessionStore] Save PlayOnHover Failed`,
  props<{
    error: string
  }>()
);

export const saveFollowPlayCursorSuccess = createAction(
  `[SessionStore] Save FollowPlayCursor Success`
);

export const saveFollowPlayCursorFailed = createAction(
  `[SessionStore] Save FollowPlayCursor Failed`,
  props<{
    error: string
  }>()
);

export const saveAppReloadedSuccess = createAction(
  `[SessionStore] Save AppReloaded Success`
);

export const saveAppReloadedFailed = createAction(
  `[SessionStore] Save AppReloaded Failed`,
  props<{
    error: string
  }>()
);

export const saveServerDataEntrySuccess = createAction(
  `[SessionStore] Save ServerDataEntry Success`
);

export const saveServerDataEntryFailed = createAction(
  `[SessionStore] Save ServerDataEntry Failed`,
  props<{
    error: string
  }>()
);

export const saveLocalSessionSuccess = createAction(
  `[${context}] Save LocalSession Success`
);

export const saveLocalSessionFailed = createAction(
  `[${context}] Save LocalSession Failed`,
  props<{
    error: string
  }>()
);

export const saveLogsSuccess = createAction(
  `[${context}] Save Logs Success`
);

export const saveLogsFailed = createAction(
  `[${context}] Save Logs Failed`,
  props<{
    error: string
  }>()
);

export const saveASRSettingsSuccess = createAction(
  `[${context}] Save ASRSettings Success`
);

export const saveASRSettingsFailed = createAction(
  `[${context}] Save ASRSettings Failed`,
  props<{
    error: string
  }>()
);

export const saveAudioSettingsSuccess = createAction(
  `[${context}] Save AudioSettings Success`
);

export const saveAudioSettingsFailed = createAction(
  `[${context}] Save AudioSettings Failed`,
  props<{
    error: string
  }>()
);

export const saveCurrentEditorSuccess = createAction(
  `[${context}] Save CurrentEditor Success`
);

export const saveCurrentEditorFailed = createAction(
  `[${context}] Save CurrentEditor Failed`,
  props<{
    error: string
  }>()
);

export const clearAnnotationSuccess = createAction(
  `[${context}] Save Annotation Success`
);

export const clearAnnotationFailed = createAction(
  `[${context}] Save Annotation Failed`,
  props<{
    error: string
  }>()
);

export const overwriteAnnotationSuccess = createAction(
  `[${context}] Overwrite Annotation Success`
);

export const overwriteAnnotationFailed = createAction(
  `[${context}] Overwrite Annotation Failed`,
  props<{
    error: string
  }>()
);

export const overwriteAnnotationLinksSuccess = createAction(
  `[${context}] Overwrite AnnotationLinks Success`
);

export const overwriteAnnotationLinksFailed = createAction(
  `[${context}] Overwrite AnnotationLinks Failed`,
  props<{
    error: string
  }>()
);

export const clearLocalStorageSuccess = createAction(
  `[${context}] Clear LocalStorage Success`
);

export const clearLocalStorageFailed = createAction(
  `[${context}] Clear LocalStorage Failed`,
  props<{
    error: string
  }>()
);

export const saveLogSuccess = createAction(
  `[${context}] Save Log Success`
);

export const saveLogFailed = createAction(
  `[${context}] Save Log Failed`,
  props<{
    error: string
  }>()
);

export const saveAnnotationLevelSuccess = createAction(
  `[${context}] Save AnnotationLevel Success`
);

export const saveAnnotationLevelFailed = createAction(
  `[${context}] Save AnnotationLevel Failed`,
  props<{
    error: string
  }>()
);

export const addAnnotationLevelSuccess = createAction(
  `[${context}] Add AnnotationLevel Success`
);

export const addAnnotationLevelFailed = createAction(
  `[${context}] Add AnnotationLevel Failed`,
  props<{
    error: string
  }>()
);

export const removeAnnotationLevelSuccess = createAction(
  `[${context}] Remove AnnotationLevel Success`
);

export const removeAnnotationLevelFailed = createAction(
  `[${context}] Remove AnnotationLevel Failed`,
  props<{
    error: string
  }>()
);

export const saveConsoleEntriesSuccess = createAction(
  `[${context}] Save ConsoleEntries Success`
);

export const saveConsoleEntriesFailed = createAction(
  `[${context}] Save ConsoleEntries Failed`,
  props<{
    error: string
  }>()
);
