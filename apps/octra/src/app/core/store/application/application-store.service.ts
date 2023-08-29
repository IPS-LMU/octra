import { Injectable } from '@angular/core';
import { LoginMode, RootState } from '../index';
import { Store } from '@ngrx/store';
import { ApplicationActions } from './application.actions';
import { SubscriptionManager } from '@octra/utilities';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStoreService {
  private _useMode?: LoginMode;

  get useMode(): LoginMode | undefined {
    return this._useMode;
  }

  private subscrManager = new SubscriptionManager();

  constructor(private store: Store<RootState>) {
    this.subscrManager.add(
      this.store
        .select((state: RootState) => state.application.mode)
        .subscribe({
          next: (mode) => {
            this._useMode = mode;
          },
        })
    );
  }

  loading$ = this.store.select((state: RootState) => state.application.loading);
  appconfig$ = this.store.select(
    (state: RootState) => state.application.appConfiguration
  );
  idb$ = this.store.select((state: RootState) => state.application.idb);
  loggedIn$ = this.store.select(
    (state: RootState) => state.application.loggedIn
  );
  appInitialized = this.store.select(
    (state: RootState) => state.application.initialized
  );

  public initApplication() {
    this.store.dispatch(ApplicationActions.initApplication.do());
  }

  public destroy() {
    this.subscrManager.destroy();
  }
}
