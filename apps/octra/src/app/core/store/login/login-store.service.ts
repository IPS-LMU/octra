import {Injectable} from '@angular/core';
import {RootState, URLParameters, OnlineSession} from '../index';
import {Store} from '@ngrx/store';
import * as fromLoginActions from './login.actions';

@Injectable({
  providedIn: 'root'
})
export class LoginStoreService {

  constructor(private store: Store<RootState>) {
  }

  public loginURL(urlParams: URLParameters) {
    this.store.dispatch(fromLoginActions.loginURL({urlParams}));
  }

  public loginDemo(audioURL: string, serverComment: string) {
    this.store.dispatch(fromLoginActions.loginDemo({
      audioURL,
      serverComment
    }));
  }

  public loginOnline(onlineSession: OnlineSession) {
    this.store.dispatch(fromLoginActions.loginOnline({onlineSession}));
  }

  public loginLocal(files: File[]) {
    this.store.dispatch(fromLoginActions.loginLocal({files}));
  }
}
