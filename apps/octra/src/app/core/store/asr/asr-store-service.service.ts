import { Injectable } from '@angular/core';
import { ASRActions } from './asr.actions';
import { RootState } from '../index';
import { Store } from '@ngrx/store';
import { ASRLanguage } from '../../obj';
import { ASRQueueItemType, ASRStateSettings, ASRTimeInterval } from './index';
import { SubscriptionManager } from '@octra/utilities';
import { Actions, ofType } from '@ngrx/effects';
import { map } from 'rxjs';

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
  languageSettings$ = this.store.select((state) => state.asr.languageSettings);
  mausLanguages$ = this.store.select((state) => state.asr.mausLanguages);
  asrEnabled$ = this.store.select((state) => state.asr.isEnabled);
  itemChange$ = this.actions$.pipe(
    ofType(
      ASRActions.processQueueItem.success,
      ASRActions.processQueueItem.fail
    ),
    map((action) => action.item)
  );

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

  constructor(private store: Store<RootState>, private actions$: Actions) {
    this.subscrManager.add(
      this.asrOptions$.subscribe({
        next: (asrOptions) => {
          this._asrOptions = asrOptions;
        },
      })
    );
  }
}
