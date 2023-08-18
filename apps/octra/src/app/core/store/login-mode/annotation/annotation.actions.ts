import { Action, createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginMode } from '../../index';
import { OIDBLink } from '@octra/annotation';
import { ILog } from '../../../obj/Settings/logging';
import { ProjectDto, TaskDto, TaskInputOutputDto } from '@octra/api-types';
import {
  AnnotationStateLevel,
  GuidelinesItem,
  TranscriptionState,
} from './index';
import { ProjectSettings } from '../../../obj';
import {ASRQueueItemType, ASRTimeInterval} from "../../asr";
import videojs from "video.js";
import Log = videojs.Log;

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

  static showNoRemainingTasksModal = createActionGroup({
    source: 'annotation/modal show no remaining tasks',
    events: {
      do: emptyProps(),
    },
  });

  static prepareTaskDataForAnnotation = createActionGroup({
    source: `annotation/ prepare task data for annotation`,
    events: {
      do: props<{
        mode: LoginMode;
        currentProject: ProjectDto;
        task: TaskDto;
      }>(),
      success: emptyProps(),
      fail: emptyProps(),
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

  static quit = createActionGroup({
    source: `annotation/quit`,
    events: {
      do: props<{
        clearSession: boolean;
        freeTask: boolean;
        redirectToProjects?: boolean;
      }>(),
      success: props<{
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
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

  static initTranscriptionService = createActionGroup({
    source: `annotation/ init transcription service`,
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
    },
  });

  static startAnnotation = createActionGroup({
    source: `annotation/start`,
    events: {
      do: props<{
        project: ProjectDto;
        mode: LoginMode;
        actionAfterFail?: Action;
      }>(),
      success: props<{
        project: ProjectDto;
        task: TaskDto;
        projectSettings: ProjectSettings;
        guidelines: GuidelinesItem[];
        selectedGuidelines?: GuidelinesItem;
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
        showOKButton: true;
      }>(),
      noTasks: emptyProps(),
    },
  });

  static sendAnnotation = createActionGroup({
    source: `annotation/ send to server`,
    events: {
      do: emptyProps(),
      start: props<{
        mode: LoginMode;
      }>(),
      success: props<{
        task: TaskDto;
        mode: LoginMode;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static redirectToProjects = createActionGroup({
    source: `annotation/redirect to projects`,
    events: {
      do: emptyProps(),
      success: emptyProps(),
    },
  });

  static redirectToTranscription = createActionGroup({
    source: 'annotation/redirect to transcription',
    events: {
      do: emptyProps(),
    },
  });

  static resumeTaskManually = createActionGroup({
    source: 'annotation/resume task manually',
    events: {
      do: emptyProps(),
    },
  });

  static updateASRSegmentInformation = createActionGroup({
      source: 'annotation/update asr information',
      events: {
        do: props<{
          mode: LoginMode,
          itemType: ASRQueueItemType,
          timeInterval: ASRTimeInterval;
          progress: number;
          result?: string;
          isBlockedBy?: ASRQueueItemType;
        }>(),
        fail: props<{
          error: string
        }>()
      }
  });

}
