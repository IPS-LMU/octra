import {createAction, props} from '@ngrx/store';
import {AnnotationStateLevel, LoginMode, TranscriptionState} from '../index';
import {OIDBLink} from '@octra/annotation';
import {ILog} from '../../obj/Settings/logging';

export class AnnotationActions {
  protected static context = 'Annotation';

  public static logout = createAction(
    `[${AnnotationActions.context}] Logout`,
    props<{
      clearSession: boolean;
      mode: LoginMode;
    }>()
  );

  public static clearSessionStorageSuccess: any = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Success`
  );

  public static clearSessionStorageFailed = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Failed`
  );

  public static clearWholeSession = createAction(
    `[${AnnotationActions.context}] Clear whole session`,
    props<{
      mode: LoginMode;
    }>()
  );


  public static clearWholeSessionSuccess = createAction(
    `[${AnnotationActions.context}] Clear whole session success`
  );

  public static clearWholeSessionFailed = createAction(
    `[${AnnotationActions.context}] Clear whole session failed`
  );

  public static clearAnnotation = createAction(
    `[${AnnotationActions.context}] Clear annotation`,
    props<{
      mode: LoginMode
    }>()
  );

  public static overwriteTranscript = createAction(
    `[${AnnotationActions.context}] Overwrite transcript`,
    props<{
      transcript: TranscriptionState,
      mode: LoginMode,
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
      mode: LoginMode;
    }>()
  );

  public static addAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Add Annotation Level`,
    props<{
      level: AnnotationStateLevel;
      mode: LoginMode;
    }>()
  );

  public static removeAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Remove Annotation Level`,
    props<{
      id: number;
      mode: LoginMode;
    }>()
  );

  public static setLevelCounter = createAction(
    `[${AnnotationActions.context}] Set Level Counter`,
    props<{
      levelCounter: number;
      mode: LoginMode;
    }>()
  );

  public static setSavingNeeded = createAction(
    `[${AnnotationActions.context}] Set savingNeeded`,
    props<{
      savingNeeded: boolean;
      mode: LoginMode;
    }>()
  );

  public static setIsSaving = createAction(
    `[${AnnotationActions.context}] Set isSaving`,
    props<{
      isSaving: boolean;
    }>()
  );

  public static saveLogs = createAction(
    `[${AnnotationActions.context}] set logs`,
    props<{
      logs: any[];
      mode: LoginMode;
    }>()
  );

  public static setTranscriptionState = createAction(
    `[${AnnotationActions.context}] set transcription state`,
    props<TranscriptionState>()
  );

  public static setCurrentEditor = createAction(
    `[${AnnotationActions.context}] Set current editor`,
    props<{
      currentEditor: string;
      mode: LoginMode;
    }>()
  );

  public static setLogging = createAction(
    `[${AnnotationActions.context}] Set logging`,
    props<{
      logging: boolean;
      mode: LoginMode;
    }>()
  );

  public static clearLogs = createAction(
    `[${AnnotationActions.context}] Clear logs`,
    props<{
      mode: LoginMode;
    }>()
  );

  public static setAudioLoaded = createAction(
    `[Transcription] Set Audio Loaded`,
    props<{
      mode: LoginMode,
      loaded: boolean;
      fileName: string;
      sampleRate: number;
    }>()
  );

  public static addLog = createAction(
    `[Transcription] Add Log`,
    props<{
      log: ILog;
      mode: LoginMode;
    }>()
  );

  public static setAudioURL = createAction(`[${AnnotationActions.context}] Set Audio URL`,
    props<{
      audioURL: string;
      mode: LoginMode;
    }>()
  );
}
