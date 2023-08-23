import { Injectable } from '@angular/core';
import { ASRActions } from './asr.actions';
import { RootState } from '../index';
import { Store } from '@ngrx/store';
import { ASRLanguage } from '../../obj';
import { ASRQueueItemType, ASRTimeInterval } from './index';

@Injectable({
  providedIn: 'root',
})
export class AsrStoreService {
  asrOptions$ = this.store.select((state) => state.asr.settings);
  queue$ = this.store.select((state) => state.asr.queue);
  asrEnabled$ = this.store.select((state) => state.asr.isEnabled);

  changeASRService(asrInfo?: ASRLanguage) {
    this.store.dispatch(
      ASRActions.setSelectedASRInformation.do({
        asrInfo,
      })
    );
  }

  startProcessing() {
    this.store.dispatch(ASRActions.startProcessing.do());
  }

  stopItemProcessing(time: ASRTimeInterval) {
    this.store.dispatch(
      ASRActions.stopItemProcessing.do({
        time,
      })
    );
  }

  changeASRSelectedMausLanguage(value: string) {
    this.store.dispatch(
      ASRActions.setASRMausLanguage.do({
        selectedMausLanguage: value,
      })
    );
  }

  addToQueue(
    timeInterval: ASRTimeInterval,
    type: ASRQueueItemType,
    transcript?: string
  ) {
    this.store.dispatch(
      ASRActions.addToQueue.do({
        item: {
          timeInterval,
          type,
          transcript,
        },
      })
    );
  }

  constructor(private store: Store<RootState>) {}
}
