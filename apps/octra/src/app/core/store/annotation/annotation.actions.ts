import {createAction, props} from '@ngrx/store';
import {AnnotationState, AnnotationStateLevel, TranscriptionState} from '../index';
import {OIDBLink} from '@octra/annotation';
import {ILog} from '../../obj/Settings/logging';

export class AnnotationActions {
  protected static context = 'Annotation';

  public static logout = createAction(
    `[${AnnotationActions.context}] Logout`,
    props<{
      clearSession: boolean;
    }>()
  );


  public static setAudioURL = createAction(`[${AnnotationActions.context}] Set Audio URL`,
    props<{
      audioURL: string;
    }>()
  );

  public static clearSessionStorageSuccess = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Success`,
  );

  public static clearSessionStorageFailed = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Failed`,
  );

  public static clearWholeSession = createAction(
    `[${AnnotationActions.context}] Clear whole session`,
  );


  public static clearWholeSessionSuccess = createAction(
    `[${AnnotationActions.context}] Clear whole session success`,
  );

  public static clearWholeSessionFailed = createAction(
    `[${AnnotationActions.context}] Clear whole session failed`,
  );

  public static setAnnotation = createAction(
    `[${AnnotationActions.context}] Set annotation`,
    props<{
      annotation: AnnotationState;
    }>()
  );

  public static clearAnnotation = createAction(
    `[${AnnotationActions.context}] Clear annotation`
  );

  public static overwriteAnnotation = createAction(
    `[${AnnotationActions.context}] Overwrite annotation`,
    props<{
      annotation: AnnotationState,
      saveToDB: boolean
    }>()
  );

  public static overwriteLinks = createAction(
    `[${AnnotationActions.context}] Overwrite links`,
    props<{
      links: OIDBLink[]
    }>()
  );

  public static changeAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Change Annotation Level`,
    props<{
      level: AnnotationStateLevel;
      sortorder: number;
    }>()
  );

  public static addAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Add Annotation Level`,
    props<{
      level: AnnotationStateLevel
    }>()
  );

  public static removeAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Remove Annotation Level`,
    props<{
      id: number
    }>()
  );

  public static setLevelCounter = createAction(
    `[${AnnotationActions.context}] Set Level Counter`,
    props<{
      levelCounter: number
    }>()
  );

  public static setSavingNeeded = createAction(
    `[${AnnotationActions.context}] Set savingNeeded`,
    props<{
      savingNeeded: boolean;
    }>()
  );

  public static setIsSaving = createAction(
    `[${AnnotationActions.context}] Set isSaving`,
    props<{
      isSaving: boolean;
    }>()
  );

  public static setSubmitted = createAction(
    `[${AnnotationActions.context}] set submitted`,
    props<{
      submitted: boolean;
    }>()
  );

  public static addLog = createAction(
    `[${AnnotationActions.context}] add log`,
    props<{
      log: ILog;
    }>()
  );

  public static setLogs = createAction(
    `[${AnnotationActions.context}] set logs`,
    props<{
      logs: any[];
    }>()
  );

  public static setTranscriptionState = createAction(
    `[${AnnotationActions.context}] set transcription state`,
    props<TranscriptionState>()
  );

  public static setCurrentEditor = createAction(
    `[${AnnotationActions.context}] Set current editor`,
    props<{
      currentEditor: string
    }>()
  );

  public static setLogging = createAction(
    `[${AnnotationActions.context}] Set logging`,
    props<{
      logging: boolean;
    }>()
  );

  public static setFeedback = createAction(
    `[${AnnotationActions.context}] Set feedback`,
    props<{
      feedback: any;
    }>()
  );

  public static clearLogs = createAction(
    `[${AnnotationActions.context}] Clear logs`
  );

  public static setAudioLoaded = createAction(
    `[Transcription] Set Audio Loaded`,
    props<{
      loaded: boolean;
    }>()
  );
}
