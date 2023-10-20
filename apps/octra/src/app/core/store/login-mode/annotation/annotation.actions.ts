import { Action, createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginMode } from '../../index';
import {
  AnnotationAnySegment,
  AnnotationLevelType,
  ASRContext,
  OctraAnnotation,
  OctraAnnotationAnyLevel,
  OctraAnnotationLink,
  OctraAnnotationSegment,
  OEvent,
  OItem,
} from '@octra/annotation';
import { ILog } from '../../../obj/Settings/logging';
import { ProjectDto, TaskDto, TaskInputOutputDto } from '@octra/api-types';
import { ProjectSettings } from '../../../obj';
import { ASRQueueItemType, ASRTimeInterval } from '../../asr';
import { SampleUnit } from '@octra/media';
import { GuidelinesItem } from './index';
import { FeedBackForm } from '../../../obj/FeedbackForm/FeedBackForm';

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
        transcript: OctraAnnotation<ASRContext, OctraAnnotationSegment>;
        mode: LoginMode;
        saveToDB: boolean;
      }>(),
    },
  });

  static overwriteLinks = createActionGroup({
    source: `annotation/ overwrite links`,
    events: {
      do: props<{
        links: OctraAnnotationLink[];
      }>(),
    },
  });

  static changeAnnotationLevel = createActionGroup({
    source: `annotation/ change level`,
    events: {
      do: props<{
        level: OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>;
        mode: LoginMode;
      }>(),
    },
  });

  static addAnnotationLevel = createActionGroup({
    source: `annotation/ add level`,
    events: {
      do: props<{
        levelType: AnnotationLevelType;
        audioDuration: SampleUnit;
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

  static setSavingNeeded = createActionGroup({
    source: `annotation/ set saving needed`,
    events: {
      do: props<{
        savingNeeded: boolean;
        mode: LoginMode;
      }>(),
    },
  });

  static changeCurrentLevelItems = createActionGroup({
    source: `annotation/ change items`,
    events: {
      do: props<{
        items: AnnotationAnySegment[];
        mode: LoginMode;
      }>(),
    },
  });

  static removeCurrentLevelItems = createActionGroup({
    source: `annotation/ remove items`,
    events: {
      do: props<{
        items: { index?: number; id?: number }[];
        removeOptions?: {
          silenceCode?: string;
          mergeTranscripts?: boolean;
        };
        mode: LoginMode;
      }>(),
    },
  });

  static addCurrentLevelItems = createActionGroup({
    source: `annotation/ add items`,
    events: {
      do: props<{
        items: AnnotationAnySegment[];
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
      success: props<{
        mode: LoginMode;
        transcript: OctraAnnotation<
          ASRContext,
          OctraAnnotationSegment<ASRContext>
        >;
        feedback?: FeedBackForm;
        saveToDB: boolean;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static startOnlineAnnotation = createActionGroup({
    source: `annotation/start online`,
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

  static sendOnlineAnnotation = createActionGroup({
    source: `annotation/ send online annotation`,
    events: {
      do: props<{
        mode: LoginMode;
      }>(),
      start: props<{
        mode: LoginMode;
      }>(),
      success: props<{
        task: TaskDto;
        mode: LoginMode;
      }>(),
      fail: props<{
        mode: LoginMode;
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
        mode: LoginMode;
        itemType: ASRQueueItemType;
        timeInterval: ASRTimeInterval;
        progress: number;
        result?: string;
        isBlockedBy?: ASRQueueItemType;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static addMultipleASRSegments = createActionGroup({
    source: 'annotation/add multiple segments',
    events: {
      success: props<{
        mode: LoginMode;
        segmentID: number;
        newSegments: OctraAnnotationSegment<ASRContext>[];
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static duplicateLevel = createActionGroup({
    source: 'annotation/duplicate level',
    events: {
      do: props<{
        index: number;
        mode: LoginMode;
      }>(),
    },
  });

  static changeLevelName = createActionGroup({
    source: 'annotation/change level name',
    events: {
      do: props<{
        mode: LoginMode;
        index: number;
        name: string;
      }>(),
    },
  });

  static setLevelIndex = createActionGroup({
    source: 'annotation/set level index',
    events: {
      do: props<{
        currentLevelIndex: number;
        mode: LoginMode;
      }>(),
    },
  });

  static changeFeedback = createActionGroup({
    source: 'annotation/change feedback',
    events: {
      do: props<{
        feedback: any;
      }>(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static changeCurrentItemById = createActionGroup({
    source: 'annotation/change current level item by id',
    events: {
      do: props<{
        id: number;
        item: OItem | OEvent | OctraAnnotationSegment<ASRContext>;
        mode: LoginMode;
      }>(),
    },
  });
}
