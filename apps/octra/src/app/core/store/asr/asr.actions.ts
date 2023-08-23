import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ASRProcessStatus,
  ASRQueueItemType,
  ASRStateProcessOptions,
  ASRStateQueueItem,
  ASRTimeInterval,
} from './index';
import { ASRLanguage } from '../../obj';

export class ASRActions {
  static setSelectedASRInformation = createActionGroup({
    source: 'asr/set selected asr',
    events: {
      do: props<{
        asrInfo?: ASRLanguage;
      }>(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static setASRMausLanguage = createActionGroup({
    source: 'asr/set maus language',
    events: {
      do: props<{
        selectedMausLanguage?: string;
      }>(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static initQueue = createActionGroup({
    source: 'asr/init queue',
    events: {
      do: emptyProps(),
      success: emptyProps(),
      fail: props<Error>(),
    },
  });

  static addToQueue = createActionGroup({
    source: 'asr/add to queue',
    events: {
      do: props<{
        item: {
          timeInterval: ASRTimeInterval;
          type: ASRQueueItemType;
          transcript?: string;
        };
      }>(),
      success: props<{
        item: ASRStateQueueItem;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static removeItemFromQueue = createActionGroup({
    source: 'asr/remove item from queue',
    events: {
      do: props<{
        id: number;
      }>(),
      success: props<{
        index: number;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static clearQueue = createActionGroup({
    source: 'asr/clear queue',
    events: {
      do: emptyProps(),
    },
  });

  static startProcessing = createActionGroup({
    source: 'asr/start processing',
    events: {
      do: emptyProps(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static processQueueItem = createActionGroup({
    source: 'asr/process item',
    events: {
      do: props<{
        item: ASRStateQueueItem;
      }>(),
      success: props<{
        item: ASRStateQueueItem;
        result: string;
      }>(),
      fail: props<{
        item: ASRStateQueueItem;
        newStatus: ASRProcessStatus;
        error: string;
      }>(),
    },
  });

  static cutAndUploadQueueItem = createActionGroup({
    source: 'asr/cut and upload item',
    events: {
      do: props<{
        item: ASRStateQueueItem;
        options?: ASRStateProcessOptions;
      }>(),
      success: props<{
        audioURL: string;
        transcriptURL?: string;
        outFormat: string;
        item: ASRStateQueueItem;
        options?: ASRStateProcessOptions;
      }>(),
      fail: props<{
        item?: ASRStateQueueItem;
        newStatus: ASRProcessStatus;
        error: string;
      }>(),
    },
  });

  static runASROnItem = createActionGroup({
    source: 'asr/run asr',
    events: {
      do: props<{
        item: ASRStateQueueItem;
        audioURL: string;
        outFormat: string;
        options?: ASRStateProcessOptions;
      }>(),
      success: props<{
        item: ASRStateQueueItem;
        audioURL: string;
        result?: {
          text: string;
          url: string;
        };
        options?: ASRStateProcessOptions;
      }>(),
      fail: props<{
        item: ASRStateQueueItem;
        newStatus: ASRProcessStatus;
        error: string;
      }>(),
    },
  });

  static runWordAlignmentOnItem = createActionGroup({
    source: 'asr/run word alignment',
    events: {
      do: props<{
        item: ASRStateQueueItem;
        transcriptURL: string;
        audioURL: string;
        outFormat: string;
      }>(),
      success: props<{
        item: ASRStateQueueItem;
        transcriptURL: string;
        result: string;
        options?: ASRStateProcessOptions;
      }>(),
      fail: props<{
        item: ASRStateQueueItem;
        newStatus: ASRProcessStatus;
        error: string;
      }>(),
    },
  });

  static setQueueStatus = createActionGroup({
    source: 'asr/set queue status',
    events: {
      do: props<{
        status: ASRProcessStatus;
      }>(),
      success: emptyProps(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static stopItemProcessing = createActionGroup({
    source: 'asr/stop item processing',
    events: {
      do: props<{
        time: ASRTimeInterval;
      }>(),
      success: props<{
        id: number;
      }>(),
      fail: props<{
        error: string;
      }>(),
    },
  });

  static enableASR = createActionGroup({
    source: 'asr/set enable',
    events: {
      do: props<{
        isEnabled: boolean;
      }>(),
      success: emptyProps(),
    },
  });
}
