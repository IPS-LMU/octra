import { Injectable } from '@angular/core';
import { RootState } from '../index';
import { Store } from '@ngrx/store';
import { ApplicationActions } from './application.actions';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStoreService {
  constructor(private store: Store<RootState>) {}
  loading$ = this.store.select((state: RootState) => state.application.loading);

  public initApplication() {
    this.store.dispatch(ApplicationActions.initApplication.do());
  }
}
