import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { SubscriptionManager } from '@octra/utilities';
import { IDBApplicationOptionName } from '../../shared/octra-database';
import { LoginMode, RootState } from '../index';
import { ApplicationActions } from './application.actions';

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
        }),
    );
  }

  loading$ = this.store.select((state: RootState) => state.application.loading);
  appconfig$ = this.store.select(
    (state: RootState) => state.application.appConfiguration,
  );
  idb$ = this.store.select((state: RootState) => state.application.idb);
  loggedIn$ = this.store.select(
    (state: RootState) => state.application.loggedIn,
  );
  appInitialized = this.store.select(
    (state: RootState) => state.application.initialized,
  );
  shortcutsEnabled$ = this.store.select(
    (state: RootState) => state.application.shortcutsEnabled,
  );

  options$ = this.store.select((state: RootState) => state.application.options);

  public initApplication() {
    this.store.dispatch(ApplicationActions.initApplication.do());
  }

  public destroy() {
    this.subscrManager.destroy();
  }

  setShortcutsEnabled(shortcutsEnabled: boolean) {
    this.store.dispatch(
      ApplicationActions.setShortcutsEnabled.do({
        shortcutsEnabled,
      }),
    );
  }

  changeApplicationOption(
    name: IDBApplicationOptionName,
    value: boolean | number | string,
  ) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name,
        value,
      }),
    );
  }
}
