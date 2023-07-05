import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginMode } from '../index';
import { OIDBLink } from '@octra/annotation';
import { ILog } from '../../obj/Settings/logging';
import { ProjectDto, TaskDto, TaskInputOutputDto } from '@octra/api-types';
import { HttpErrorResponse } from '@angular/common/http';
import { AnnotationStateLevel, TranscriptionState } from './index';

export class AnnotationActions {
  static loadAudio = createActionGroup({
    source: 'annotation/audio/load',
    events: {
      do: props<{
        audioFile?: TaskInputOutputDto;
        mode: LoginMode;
      }>(),
      progress: props<{
        mode: LoginMode;
        value: number;
      }>(),
      success: props<{
        audioFile?: TaskInputOutputDto;
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearSessionStorage = createActionGroup({
    source: `annotation/ session storage/ clear`,
    events: {
      success: emptyProps(),
      fail: emptyProps(),
    },
  });

  static clearWholeSession = createActionGroup({
    source: `annotation/ session storage/ clear all`,
    events: {
      do: emptyProps(),
      success: props<{
        mode: LoginMode;
      }>(),
      fail: emptyProps(),
    },
  });

  static clearAnnotation = createActionGroup({
    source: `annotation/ annotation/ clear`,
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
    },
  });

  static overwriteTranscript = createActionGroup({
    source: `annotation/ overwrite transcript`,
    events: {
      do: props<{
        transcript: TranscriptionState;
        mode: LoginMode;
        saveToDB: boolean;
      }>(),
    },
  });

  static overwriteLinks = createActionGroup({
    source: `annotation/ overwrite links`,
    events: {
      do: props<{
        links: OIDBLink[];
      }>(),
    },
  });

  static changeAnnotationLevel = createActionGroup({
    source: `annotation/ change level`,
    events: {
      do: props<{
        level: AnnotationStateLevel;
        mode: LoginMode;
      }>(),
    },
  });

  static addAnnotationLevel = createActionGroup({
    source: `annotation/ add level`,
    events: {
      do: props<{
        level: AnnotationStateLevel;
        mode: LoginMode;
      }>(),
    },
  });

  static removeAnnotationLevel = createActionGroup({
    source: `annotation/ remove level`,
    events: {
      do: props<{
        id: number;
        mode: LoginMode;
      }>(),
    },
  });

  static setLevelCounter = createActionGroup({
    source: `annotation/ set level counter`,
    events: {
      do: props<{
        levelCounter: number;
        mode: LoginMode;
      }>(),
    },
  });

  static setSavingNeeded = createActionGroup({
    source: `annotation/ set saving needed`,
    events: {
      do: props<{
        savingNeeded: boolean;
        mode: LoginMode;
      }>(),
    },
  });

  static setIsSaving = createActionGroup({
    source: `annotation/ set is saving`,
    events: {
      do: props<{
        isSaving: boolean;
      }>(),
    },
  });

  static saveLogs = createActionGroup({
    source: `annotation/ save logs`,
    events: {
      do: props<{
        logs: any[];
        mode: LoginMode;
      }>(),
    },
  });

  static setTranscriptionState = createActionGroup({
    source: `annotation/ set transcription state`,
    events: {
      do: props<TranscriptionState>(),
    },
  });

  static setCurrentEditor = createActionGroup({
    source: `annotation/ set current editor`,
    events: {
      do: props<{
        currentEditor: string;
        mode: LoginMode;
      }>(),
    },
  });

  static setLogging = createActionGroup({
    source: `annotation/ set logging`,
    events: {
      do: props<{
        logging: boolean;
        mode: LoginMode;
      }>(),
    },
  });

  static clearLogs = createActionGroup({
    source: `annotation/ clear logs`,
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
    },
  });

  static addLog = createActionGroup({
    source: `annotation/ add log`,
    events: {
      do: props<{
        log: ILog;
        mode: LoginMode;
      }>(),
    },
  });

  static setAudioURL = createActionGroup({
    source: `annotation/ set audio url`,
    events: {
      do: props<{
        audioURL: string;
        mode: LoginMode;
      }>(),
    },
  });

  static startAnnotation = createActionGroup({
    source: `annotation/ start`,
    events: {
      do: props<{
        project: ProjectDto;
        mode: LoginMode;
      }>(),
      success: props<{
        project: ProjectDto;
        task: TaskDto;
        mode: LoginMode;
      }>(),
      fail: props<{
        error: HttpErrorResponse;
      }>(),
    },
  });
}
