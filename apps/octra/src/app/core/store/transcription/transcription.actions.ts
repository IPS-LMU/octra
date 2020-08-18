import {createAction, props} from '@ngrx/store';
import {AnnotationState, TranscriptionState} from '../index';
import {OIDBLevel, OIDBLink, OLevel} from '@octra/annotation';

const context = 'Transcription';

export const setSavingNeeded = createAction(
  `[${context}] Set savingNeeded`,
  props<{
    savingNeeded: boolean;
  }>()
);

export const setIsSaving = createAction(
  `[${context}] Set isSaving`,
  props<{
    isSaving: boolean;
  }>()
);

export const setPlayOnHover = createAction(
  `[${context}] set playOnHover`,
  props<{
    playOnHover: boolean;
  }>()
);

export const setSubmitted = createAction(
  `[${context}] set submitted`,
  props<{
    submitted: boolean;
  }>()
);

export const setLogs = createAction(
  `[${context}] set submitted`,
  props<{
    logs: any[];
  }>()
);

export const setTranscriptionState = createAction(
  `[${context}] set transcription state`,
  props<TranscriptionState>()
);

export const setFollowPlayCursor = createAction(
  `[${context}] set follow play cursor`,
  props<{
    followPlayCursor: boolean;
  }>()
);


export const setCurrentEditor = createAction(
  `[${context}] Set current editor`,
  props<{
    currentEditor: string
  }>()
);

export const setAudioVolume = createAction(
  `[${context}] Set volume`,
  props<{
    volume: number
  }>()
);

export const setAudioSpeed = createAction(
  `[${context}] Set speed`,
  props<{
    speed: number
  }>()
);

export const setLogging = createAction(
  `[${context}] Set logging`,
  props<{
    logging: boolean;
  }>()
);

export const setShowLoupe = createAction(
  `[${context}] Set showLoupe`,
  props<{
    showLoupe: boolean;
  }>()
);

export const setEasyMode = createAction(
  `[${context}] Set easy mode`,
  props<{
    easyMode: boolean;
  }>()
);

export const setSecondsPerLine = createAction(
  `[${context}] Set seconds per line`,
  props<{
    secondsPerLine: number;
  }>()
);

export const setHighlightingEnabled = createAction(
  `[${context}] Set highlightingEnabled`,
  props<{
    highlightingEnabled: boolean;
  }>()
);

export const setFeedback = createAction(
  `[${context}] Set feedback`,
  props<{
    feedback: any;
  }>()
);

export const setAnnotation = createAction(
  `[${context}] Set annotation`,
  props<{
    annotation: AnnotationState;
  }>()
);

export const setAnnotationLevels = createAction(
  `[${context}] Set annotationLevels`,
  props<{
    levels: OIDBLevel[];
  }>()
);

export const setAnnotationLinks = createAction(
  `[${context}] Set annotationLinks`,
  props<{
    links: OIDBLink[];
  }>()
);

export const clearAnnotation = createAction(
  `[${context}] Clear annotation`
);

export const changeAnnotationLevel = createAction(
  `[ANNOTATION] Change Annotation Level`,
  props<{
    index: number,
    level: OLevel
  }>()
);

export const addAnnotationLevel = createAction(
  `[ANNOTATION] Add Annotation Level`,
  props<OIDBLevel>()
);

export const removeAnnotationLevel = createAction(
  `[ANNOTATION] Remove Annotation Level`,
  props<{
    id: number
  }>()
);

export const setLevelCounter = createAction(
  `[ANNOTATION] Set Level Counter`,
  props<{
    levelCounter: number
  }>()
);
