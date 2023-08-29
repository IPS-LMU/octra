import { Injectable } from '@angular/core';
import { ASRActions } from './asr.actions';
import { RootState } from '../index';
import { Store } from '@ngrx/store';
import { ASRLanguage } from '../../obj';
import { ASRQueueItemType, ASRStateSettings, ASRTimeInterval } from './index';
import { SubscriptionManager } from '@octra/utilities';

@Injectable({
  providedIn: 'root',
})
export class AsrStoreService {
  asrOptions$ = this.store.select((state) => state.asr.settings);
  private _asrOptions?: ASRStateSettings;
  private subscrManager = new SubscriptionManager();

  get asrOptions(): ASRStateSettings | undefined {
    return this._asrOptions;
  }

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

  stopProcessing() {
    this.store.dispatch(ASRActions.stopProcessing.do());
  }

  constructor(private store: Store<RootState>) {
    this.subscrManager.add(
      this.asrOptions$.subscribe({
        next: (asrOptions) => {
          this._asrOptions = asrOptions;
        },
      })
    );
  }
}
