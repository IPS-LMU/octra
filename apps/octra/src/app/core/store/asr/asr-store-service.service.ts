import { inject, Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SubscriptionManager } from '@octra/utilities';
import { map } from 'rxjs';
import { RootState } from '../index';
import { ASRActions } from './asr.actions';
import {
  ASRQueueItemType,
  ASRStateQueue,
  ASRStateSettings,
  ASRTimeInterval,
} from './index';

@Injectable({
  providedIn: 'root',
})
export class AsrStoreService {
  private store = inject<Store<RootState>>(Store);
  private actions$ = inject(Actions);

  asrOptions$ = this.store.select((state) => state.asr.settings);
  private _asrOptions?: ASRStateSettings;
  private subscrManager = new SubscriptionManager();

  get asrOptions(): ASRStateSettings | undefined {
    return this._asrOptions;
  }

  queue$ = this.store.select((state) => state.asr.queue);
  languageSettings$ = this.store.select((state) => state.asr.languageSettings);
  mausLanguages$ = this.store.select((state) => state.asr.mausLanguages);
  asrLanguages$ = this.store.select((state) => state.asr.asrLanguages);
  asrEnabled$ = this.store.select((state) => state.asr.isEnabled);
  itemChange$ = this.actions$.pipe(
    ofType(
      ASRActions.processQueueItem.success,
      ASRActions.processQueueItem.fail,
    ),
    map((action) => action.item),
  );

  startProcessing() {
    this.store.dispatch(ASRActions.startProcessing.do());
  }

  stopItemProcessing(time: ASRTimeInterval) {
    this.store.dispatch(
      ASRActions.stopItemProcessing.do({
        time,
      }),
    );
  }

  addToQueue(
    timeInterval: ASRTimeInterval,
    type: ASRQueueItemType,
    transcript?: string,
  ) {
    this.store.dispatch(
      ASRActions.addToQueue.do({
        item: {
          timeInterval,
          type,
          transcript,
        },
      }),
    );
  }

  stopProcessing() {
    this.store.dispatch(ASRActions.stopProcessing.do());
  }

  setASRSettings(settings: ASRStateSettings) {
    this.store.dispatch(ASRActions.setASRSettings.do({ settings }));
  }

  queue?: ASRStateQueue;

  constructor() {
    this.subscrManager.add(
      this.asrOptions$.subscribe({
        next: (asrOptions) => {
          this._asrOptions = asrOptions;
        },
      }),
    );

    this.subscrManager.add(this.queue$.subscribe({
      next: (queue) => {
        this.queue = queue;
        console.log("statistics");
        console.log(queue.statistics);
      }
    }));
  }
}
