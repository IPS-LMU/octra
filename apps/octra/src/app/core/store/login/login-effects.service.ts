import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {exhaustMap} from 'rxjs/operators';
import {Subject, timer} from 'rxjs';
import {Action, Store} from '@ngrx/store';
import {SessionStorageService} from 'ngx-webstorage';
import {LoginActions} from '../login/login.actions';
import {ApplicationActions} from '../application/application.actions';


@Injectable({
  providedIn: 'root'
})
export class LogoutEffects {
  logoutSession$ = createEffect(() => this.actions$.pipe(
    ofType(LoginActions.logout),
    exhaustMap((action) => {
      this.sessStr.clear();
      // clear undo history
      this.store.dispatch(ApplicationActions.clear());

      const subject = new Subject<Action>();

      timer(10).subscribe(()=>{
        subject.next(LoginActions.clearSessionStorageSuccess());
        subject.complete();
      });

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private sessStr: SessionStorageService,
              private store: Store) {
  }
}
