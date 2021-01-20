import {createAction, props} from '@ngrx/store';
import {TranscriptionState} from '../index';

const context = 'Transcription';

export class TranscriptionActions {
  public static setSavingNeeded = createAction(
    `[${context}] Set savingNeeded`,
    props<{
      savingNeeded: boolean;
    }>()
  );

  public static setIsSaving = createAction(
    `[${context}] Set isSaving`,
    props<{
      isSaving: boolean;
    }>()
  );

  public static setPlayOnHover = createAction(
    `[${context}] set playOnHover`,
    props<{
      playOnHover: boolean;
    }>()
  );

  public static setSubmitted = createAction(
    `[${context}] set submitted`,
    props<{
      submitted: boolean;
    }>()
  );

  public static addLog = createAction(
    `[${context}] add log`,
    props<{
      log: any;
    }>()
  );

  public static setLogs = createAction(
    `[${context}] set logs`,
    props<{
      logs: any[];
    }>()
  );

  public static setTranscriptionState = createAction(
    `[${context}] set transcription state`,
    props<TranscriptionState>()
  );

  public static setFollowPlayCursor = createAction(
    `[${context}] set follow play cursor`,
    props<{
      followPlayCursor: boolean;
    }>()
  );


  public static setCurrentEditor = createAction(
    `[${context}] Set current editor`,
    props<{
      currentEditor: string
    }>()
  );

  public static setAudioSettings = createAction(
    `[${context}] Set volume`,
    props<{
      volume: number;
      speed: number;
    }>()
  );

  public static setLogging = createAction(
    `[${context}] Set logging`,
    props<{
      logging: boolean;
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

  public static setFeedback = createAction(
    `[${context}] Set feedback`,
    props<{
      feedback: any;
    }>()
  );

  public static clearLogs = createAction(
    `[${context}] Clear logs`
  );

  public static setAudioLoaded = createAction(
    `[Transcription] Set Audio Loaded`,
    props<{
      loaded: boolean;
    }>()
  );

  public static clearSettings = createAction(
    `[Configuration] Clear Settings`
  );
}
